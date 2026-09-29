import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Provider-agnostic webhook for processing bank transactions
// In production, this would be secured by provider-specific IP allowlists, signatures, or secret tokens.
router.post('/webhook', async (req, res) => {
  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['x-sepay-signature'] as string;
    const timestampStr = req.headers['x-sepay-timestamp'] as string;
    
    // 1. Verify SePay Webhook Signature & Timestamp
    if (signature && timestampStr) {
      const secret = process.env.SEPAY_WEBHOOK_SECRET;
      if (!secret) return res.status(500).json({ success: false, message: 'Server config error' });
      
      // Replay attack prevention (5 minutes window)
      const reqTime = timestampStr.length > 10 ? parseInt(timestampStr, 10) : parseInt(timestampStr, 10) * 1000;
      if (Math.abs(Date.now() - reqTime) > 5 * 60 * 1000) {
        return res.status(401).json({ success: false, message: 'Expired request' });
      }

      // Verify HMAC-SHA256
      const expectedSignature = crypto.createHmac('sha256', secret)
        .update(timestampStr + '.' + rawBody)
        .digest('hex');
      
      try {
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
          return res.status(401).json({ success: false, message: 'Invalid signature' });
        }
      } catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid signature format' });
      }
    } else {
      // 2. Legacy / Test webhook (Only in DEV)
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: 'Test webhook not allowed in production' });
      }
      const parsedBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (parsedBody.provider_secret !== process.env.BANK_WEBHOOK_SECRET) {
        return res.status(401).json({ message: 'Unauthorized test webhook' });
      }
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    let transactions = [];

    // Normalize Payload
    if (payload.transactions && Array.isArray(payload.transactions)) {
      transactions = payload.transactions;
    } else if (payload.id && payload.gateway) {
      transactions = [{
        transactionId: payload.referenceCode || String(payload.id),
        amount: Number(payload.transferAmount),
        description: payload.content || '',
        transactionDate: payload.transactionDate,
        bankName: payload.gateway,
        accountNumber: payload.accountNumber,
        transactionType: (payload.transferType || '').toLowerCase() === 'in' ? 'IN' : 'OUT',
        rawData: payload
      }];
    } else {
      return res.status(400).json({ success: false, message: 'Unrecognized payload format' });
    }

    if (transactions.length === 0) {
      return res.status(400).json({ success: false, message: 'No transactions found' });
    }

    let processedCount = 0;

    for (const tx of transactions) {
      const { transactionId, amount, description, transactionDate, bankName, accountNumber, transactionType } = tx;

      // 1. Idempotency Check: Skip if transaction already exists
      const existingTx = await prisma.bankTransaction.findUnique({
        where: { transactionId }
      });

      if (existingTx) {
        processedCount++; // Treated as processed for idempotent success
        continue;
      }

      // 2. Filter: Only care about incoming money (IN)
      if (transactionType !== 'IN') {
        await prisma.bankTransaction.create({
          data: {
            transactionId, amount, description, transactionDate: new Date(transactionDate),
            bankName, accountNumber, transactionType, status: 'UNMATCHED',
            rawData: tx
          }
        });
        continue;
      }

      // 3. Extract Order Code from Description (Regex matching e.g., SEVQR DH2026...)
      const orderCodeMatch = description.match(/DH\d{11}/i);
      const extractedOrderCode = orderCodeMatch ? orderCodeMatch[0].toUpperCase() : null;

      if (!extractedOrderCode) {
        // No order code found in description
        await prisma.bankTransaction.create({
          data: {
            transactionId, amount, description, transactionDate: new Date(transactionDate),
            bankName, accountNumber, transactionType, status: 'INVALID_CONTENT',
            rawData: tx
          }
        });
        continue;
      }

      // 4. Find the Order
      const order = await prisma.order.findUnique({
        where: { orderCode: extractedOrderCode }
      });

      if (!order) {
        // Found a code, but no such order in DB
        await prisma.bankTransaction.create({
          data: {
            transactionId, amount, description, transactionDate: new Date(transactionDate),
            bankName, accountNumber, transactionType, status: 'UNMATCHED',
            orderCode: extractedOrderCode,
            rawData: tx
          }
        });
        continue;
      }

      // 5. Match Check
      if (order.totalAmount === amount && ['pending', 'pending_payment'].includes(order.status) && order.paymentMethod === 'BANK_TRANSFER') {
        // LEVEL 1: Exact Match! Process within a transaction
        await prisma.$transaction(async (txPrisma) => {
          // Update Order Status
          await txPrisma.order.update({
            where: { id: order.id },
            data: { 
              status: 'confirmed',
              paymentStatus: 'PAID'
            }
          });

          // Create BankTransaction
          await txPrisma.bankTransaction.create({
            data: {
              transactionId, amount, description, transactionDate: new Date(transactionDate),
              bankName, accountNumber, transactionType, status: 'MATCHED',
              orderId: order.id,
              orderCode: extractedOrderCode,
              matchedAt: new Date(),
              matchedBy: 'SYSTEM',
              rawData: tx
            }
          });

          // Optional: Create Notification for Admin
          try {
            await txPrisma.notification.create({
              data: {
                type: 'PAYMENT',
                title: 'Thanh toán tự động thành công',
                message: `Đơn ${order.orderCode} đã nhận thanh toán chuyển khoản ${amount.toLocaleString('vi-VN')}đ.`,
                referenceType: 'Order',
                referenceId: order.id
              }
            });
          } catch(e) {}
        });

      } else {
        // LEVEL 2: Found order, but amount doesn't match or order isn't in waiting state
        const isAlreadyPaid = order.paymentStatus === 'PAID' || order.status === 'confirmed';
        const finalStatus = isAlreadyPaid ? 'MANUAL_REVIEW' : 'INVALID_AMOUNT';
        
        await prisma.bankTransaction.create({
          data: {
            transactionId, amount, description, transactionDate: new Date(transactionDate),
            bankName, accountNumber, transactionType, status: finalStatus,
            orderId: order.id,
            orderCode: extractedOrderCode,
            rawData: tx
          }
        });
        
        try {
          await prisma.notification.create({
            data: {
              type: 'PAYMENT',
              title: 'Giao dịch cần đối soát',
              message: `Nhận được ${amount.toLocaleString('vi-VN')}đ cho đơn ${order.orderCode} nhưng số tiền/trạng thái không khớp.`,
              referenceType: 'Order',
              referenceId: order.id
            }
          });
        } catch(e) {}
      }
      
      processedCount++;
    }

    return res.json({ success: true, processedCount });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ message: 'Internal server error processing webhook' });
  }
});

// DEV-ONLY: Trigger a mock webhook
router.post('/webhook/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Endpoint is not available in production' });
  }
  
  // Forward to main webhook logic
  req.body.provider_secret = process.env.BANK_WEBHOOK_SECRET;
  
  try {
    const port = process.env.PORT || 3001;
    // Send as JSON since our proxy in index.ts won't trigger for /webhook/test if we call it internally, but wait, we are fetching the self URL /api/bank/webhook which WILL hit index.ts and receive raw body!
    const fetchRes = await fetch(`http://localhost:${port}/api/bank/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const result = await fetchRes.json();
    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to dispatch test webhook' });
  }
});

// GET all bank transactions (Admin)
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    
    const transactions = await prisma.bankTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip
    });

    const total = await prisma.bankTransaction.count({ where });

    res.json({ data: transactions, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET transaction stats
router.get('/transactions/stats', authenticateToken, async (req, res) => {
  try {
    const totalTransactions = await prisma.bankTransaction.count();
    const matchedCount = await prisma.bankTransaction.count({ where: { status: 'MATCHED' } });
    const unmatchedCount = await prisma.bankTransaction.count({ where: { status: 'UNMATCHED' } });
    const needsReviewCount = await prisma.bankTransaction.count({ where: { status: { in: ['INVALID_AMOUNT', 'INVALID_CONTENT', 'MANUAL_REVIEW'] } } });

    const totalInResult = await prisma.bankTransaction.aggregate({
      where: { transactionType: 'IN' },
      _sum: { amount: true }
    });

    res.json({
      total: totalTransactions,
      matched: matchedCount,
      unmatched: unmatchedCount,
      needsReview: needsReviewCount,
      totalAmountIn: totalInResult._sum.amount || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single transaction
router.get('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const txId = req.params.id as string;
    const tx = await prisma.bankTransaction.findUnique({
      where: { id: txId }
    });
    if (!tx) return res.status(404).json({ message: 'Not found' });
    
    // Manually fetch order if matched
    let orderInfo = null;
    if (tx.orderId) {
      orderInfo = await prisma.order.findUnique({
        where: { id: tx.orderId },
        select: { id: true, orderCode: true, totalAmount: true, status: true, paymentStatus: true }
      });
    }
    
    res.json({ ...tx, order: orderInfo });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manual Match Transaction to Order
router.post('/transactions/:id/match', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    const txId = req.params.id as string;

    const tx = await prisma.bankTransaction.findUnique({ where: { id: txId } });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    
    if (tx.status === 'MATCHED') {
      return res.status(400).json({ message: 'Transaction is already matched' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Perform manual match
    await prisma.$transaction(async (txPrisma) => {
      // 1. Update Order Status
      await txPrisma.order.update({
        where: { id: order.id },
        data: { 
          status: 'confirmed',
          paymentStatus: 'PAID'
        }
      });

      // 2. Update Transaction
      await txPrisma.bankTransaction.update({
        where: { id: tx.id },
        data: {
          status: 'MATCHED',
          orderId: order.id,
          orderCode: order.orderCode,
          matchedAt: new Date(),
          matchedBy: 'ADMIN'
        }
      });
    });

    res.json({ success: true, message: 'Matched successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error matching transaction' });
  }
});

export default router;
