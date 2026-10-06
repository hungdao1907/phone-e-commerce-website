import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';
import { sendOrderReceivedEmail, sendOrderConfirmedEmail, sendTrackingOtpEmail } from '../services/email.service';

const router = express.Router();
const prisma = new PrismaClient();

type PreparedOrderItem = {
  variantId: string;
  productName: string;
  variantInfo: string;
  quantity: number;
  unitPrice: number;
};

// In-memory OTP store for secure order tracking
interface TrackingOtpRecord {
  otp: string;
  expiresAt: number;
  orderId: string;
  orderCode: string;
  email: string;
  attempts: number;
}
const orderTrackingOtpCache = new Map<string, TrackingOtpRecord>();

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 1) {
    return `${localPart}***@${domain}`;
  }
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

function maskPhone(phone: string | null | undefined): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length <= 4) return phone || 'số điện thoại';
  return digits.slice(0, 3) + '****' + digits.slice(-3);
}

function cleanDigits(val: string | null | undefined): string {
  if (!val || val === 'null' || val === 'undefined') return '';
  return val.replace(/\D/g, '');
}

function checkPhoneMatch(inputPhone: string, targetPhone: string | null | undefined): boolean {
  const inDigits = cleanDigits(inputPhone);
  const tgtDigits = cleanDigits(targetPhone);
  if (!inDigits || !tgtDigits) return false;

  // Exact digits match
  if (inDigits === tgtDigits) return true;

  // Compare Vietnamese mobile numbers (last 9 digits)
  // E.g., +84972501501, 84972501501, 0972501501, 972501501 all end in 972501501
  const inTail = inDigits.slice(-9);
  const tgtTail = tgtDigits.slice(-9);
  if (inTail.length === 9 && tgtTail.length === 9 && inTail === tgtTail) {
    return true;
  }

  // Suffix matching for general phones
  if (inDigits.length >= 8 && tgtDigits.length >= 8) {
    if (inDigits.endsWith(tgtDigits) || tgtDigits.endsWith(inDigits)) {
      return true;
    }
  }

  return false;
}

// POST request OTP for public order tracking
router.post('/track/request-otp', async (req, res) => {
  try {
    const { orderCode, phoneOrEmail } = req.body;

    if (!orderCode || !phoneOrEmail) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Mã đơn hàng và Số điện thoại/Email' });
    }

    const rawCode = String(orderCode).trim();
    const cleanCode = rawCode.replace(/^[#]/, '').replace(/[-\s]/g, '').trim();

    // Flexible lookup by orderCode (case-insensitive, with/without prefixes)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderCode: { equals: rawCode, mode: 'insensitive' } },
          { orderCode: { equals: cleanCode, mode: 'insensitive' } },
          { orderCode: { equals: cleanCode.replace(/^DH/i, ''), mode: 'insensitive' } },
          { orderCode: { equals: `DH${cleanCode.replace(/^DH/i, '')}`, mode: 'insensitive' } }
        ]
      },
      include: {
        customer: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng với mã này. Vui lòng kiểm tra lại mã đơn.' });
    }

    const input = String(phoneOrEmail).trim().toLowerCase();
    const isInputEmail = input.includes('@');

    // Phone matching (checks both shippingPhone and customer phone)
    const phoneMatched = checkPhoneMatch(input, order.shippingPhone) || checkPhoneMatch(input, order.customer?.phone);

    // Email matching
    const customerEmail = (order.customer?.email || '').trim().toLowerCase();
    const emailMatched = isInputEmail && Boolean(
      customerEmail && (
        customerEmail === input ||
        (customerEmail.includes('@') && customerEmail.split('@')[0] === input.split('@')[0])
      )
    );

    if (!phoneMatched && !emailMatched) {
      console.warn(`[Order Track OTP] Contact mismatch for Order #${order.orderCode}:`, {
        input,
        shippingPhone: order.shippingPhone,
        customerPhone: order.customer?.phone,
        customerEmail: order.customer?.email
      });

      const hint = process.env.NODE_ENV !== 'production'
        ? ` (Gợi ý test: SĐT ${maskPhone(order.shippingPhone)} hoặc Email ${maskEmail(order.customer?.email || '')})`
        : '';

      return res.status(400).json({
        message: `Số điện thoại hoặc email không trùng khớp với thông tin đơn hàng #${order.orderCode}.${hint}`
      });
    }

    // Destination determination: prioritize customer email or provided email, fallback to phone
    const targetEmail = (customerEmail && customerEmail.includes('@')) ? customerEmail : (isInputEmail ? input : null);
    const targetPhone = order.shippingPhone || order.customer?.phone || (!isInputEmail ? input : null);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    // Store in cache with multiple keys so verify matches regardless of formatting
    const rawKey = order.orderCode.trim().toUpperCase();
    const cleanKey = order.orderCode.trim().replace(/[-\s]/g, '').toUpperCase();
    const record: TrackingOtpRecord = {
      otp,
      expiresAt,
      orderId: order.id,
      orderCode: order.orderCode,
      email: targetEmail || targetPhone || 'customer',
      attempts: 0
    };
    orderTrackingOtpCache.set(rawKey, record);
    orderTrackingOtpCache.set(cleanKey, record);

    let masked = 'thông tin bảo mật';
    if (targetEmail) {
      masked = maskEmail(targetEmail);
      // Attempt sending email (fail-safe without blocking response)
      sendTrackingOtpEmail(
        targetEmail,
        order.customer?.fullName || 'Quý khách',
        order.orderCode,
        otp
      ).catch(err => console.warn('[Order Track OTP] Email send error:', err));
    } else if (targetPhone) {
      masked = maskPhone(targetPhone);
    }

    console.log(`[Order Track OTP] Generated OTP for Order #${order.orderCode}: ${otp} (Destination: ${masked})`);

    res.json({
      success: true,
      message: targetEmail ? `Mã xác thực đã được gửi đến ${masked}` : `Mã xác thực đã được tạo cho số ${masked}`,
      maskedDestination: masked,
      orderCode: order.orderCode,
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Error in track request OTP:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi mã OTP' });
  }
});

// POST verify OTP and retrieve full order details
router.post('/track/verify-otp', async (req, res) => {
  try {
    const { orderCode, otp } = req.body;

    if (!orderCode || !otp) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã đơn hàng và mã OTP' });
    }

    const rawKey = String(orderCode).trim().toUpperCase();
    const cleanKey = rawKey.replace(/^[#]/, '').replace(/[-\s]/g, '').toUpperCase();
    const userOtp = String(otp).trim();

    const record = orderTrackingOtpCache.get(cleanKey) || orderTrackingOtpCache.get(rawKey);
    if (!record) {
      return res.status(400).json({ message: 'Yêu cầu xác thực đã hết hạn hoặc không tồn tại. Vui lòng bấm tra cứu lại.' });
    }

    if (Date.now() > record.expiresAt) {
      orderTrackingOtpCache.delete(cleanKey);
      orderTrackingOtpCache.delete(rawKey);
      return res.status(400).json({ message: 'Mã xác thực OTP đã hết hạn (quá 5 phút). Vui lòng yêu cầu mã mới.' });
    }

    if (record.attempts >= 5) {
      orderTrackingOtpCache.delete(cleanKey);
      orderTrackingOtpCache.delete(rawKey);
      return res.status(400).json({ message: 'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng yêu cầu mã xác thực mới.' });
    }

    if (record.otp !== userOtp) {
      record.attempts += 1;
      return res.status(400).json({ message: 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại.' });
    }

    // Success! Invalidate OTP
    orderTrackingOtpCache.delete(cleanKey);
    orderTrackingOtpCache.delete(rawKey);

    const order = await prisma.order.findUnique({
      where: { id: record.orderId },
      include: {
        customer: {
          select: { fullName: true, email: true, phone: true }
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { id: true, name: true, image: true, brand: true }
                }
              }
            }
          }
        },
        Payment: {
          orderBy: { createdAt: 'desc' }
        },
        Invoice: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error verifying OTP for order tracking:', error);
    res.status(500).json({ message: 'Lỗi server khi xác thực mã OTP' });
  }
});


// GET payment status polling endpoint
router.get('/:orderCode/payment-status', authenticateToken, async (req, res) => {
  try {
    const orderCode = getRouteParam(req.params.orderCode);
    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: { id: true, orderCode: true, status: true, paymentStatus: true }
    });
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Check if there are any BankTransactions for this order code
    const latestTx = await prisma.bankTransaction.findFirst({
      where: { orderCode },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      orderId: order.id,
      orderCode: order.orderCode,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      transaction: latestTx ? {
        transactionId: latestTx.transactionId,
        amount: latestTx.amount,
        status: latestTx.status
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching payment status' });
  }
});

// GET all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const whereClause = user.role === 'customer' ? { customerId: user.id } : {};

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { fullName: true, email: true, phone: true }
        },
        items: {
          include: {
            variant: {
              include: { product: { select: { id: true, name: true, image: true } } }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: getRouteParam(req.params.id) },
      include: {
        customer: {
          select: { fullName: true, email: true, phone: true }
        },
        items: {
          include: {
            variant: {
              include: { product: { select: { id: true, name: true, image: true } } }
            }
          }
        },
      }
    });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST create order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customerId, items, paymentMethod, shippingAddress, shippingPhone, note, estimatedDelivery, promoCode } = req.body;

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Thiếu thông tin khách hàng hoặc sản phẩm' });
    }

    // Generate orderCode
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    const orderCode = `DH${dateStr}${(count + 1).toString().padStart(3, '0')}`;

    let totalAmount = 0;
    const orderItemsData: PreparedOrderItem[] = [];

    // Process items and validate stock
    for (const item of items as Array<{ variantId: string; quantity: number }>) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true }
      });

      if (!variant) {
        return res.status(404).json({ message: `Không tìm thấy biến thể SP: ${item.variantId}` });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({ message: `Sản phẩm ${variant.product.name} không đủ tồn kho` });
      }

      const itemTotal = variant.price * item.quantity;
      totalAmount += itemTotal;

      const variantInfo = Object.entries(variant.attributes as any)
        .map(([key, val]) => `${val}`)
        .join(' · ');

      orderItemsData.push({
        variantId: variant.id,
        productName: variant.product.name,
        variantInfo: variantInfo || 'Mặc định',
        quantity: item.quantity,
        unitPrice: variant.price
      });
    }

    // Fetch reward milestones to calculate progress discount
    const milestones = await prisma.rewardMilestone.findMany({ where: { isActive: true } });
    const achievedMilestones = milestones.filter(m => totalAmount >= m.amount);
    
    // Reward discount (Voucher type)
    const rewardDiscount = achievedMilestones
      .filter(m => m.type === 'voucher' && m.discount)
      .reduce((max, m) => Math.max(max, m.discount || 0), 0);

    // Promo code discount
    let promoDiscount = 0;
    let promoCodeId = null;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: promoCode } });
      if (promo && promo.isActive && new Date() >= promo.startDate && new Date() <= promo.endDate && promo.usedCount < promo.usageLimit && totalAmount >= promo.minOrderValue) {
        promoDiscount = promo.discountValue;
        promoCodeId = promo.id;
      }
    }

    const totalDiscountAmount = rewardDiscount + promoDiscount;
    
    // Shipping fee calculation
    const isFreeShipping = achievedMilestones.some(m => m.type === 'shipping') || totalAmount >= 25000000;
    const shippingFee = isFreeShipping || shippingAddress.includes('Nhận tại cửa hàng') ? 0 : 50000;

    const finalTotal = Math.max(0, totalAmount - totalDiscountAmount) + shippingFee;
    
    const dbPaymentMethod = paymentMethod === 'BANK' || paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'COD';
    const initialStatus = dbPaymentMethod === 'BANK_TRANSFER' ? 'pending_payment' : 'confirmed';

    // Use transaction to create order, payment (if bank), reduce stock, and update promo count
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderCode,
          customerId,
          paymentMethod: dbPaymentMethod,
          status: initialStatus,
          shippingAddress,
          shippingPhone,
          shippingFee,
          totalAmount: finalTotal,
          discountAmount: totalDiscountAmount,
          promoCodeId: promoCodeId,
          note,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
          items: {
            create: orderItemsData
          }
        },
        include: { items: true, customer: true, Payment: true }
      });

      // Create Payment and QR Data if BANK_TRANSFER
      if (dbPaymentMethod === 'BANK_TRANSFER') {
        const bankId = process.env.VIETQR_BANK_ID || 'MB';
        const accountNo = process.env.VIETQR_ACCOUNT_NO || '0123456789';
        const accountName = process.env.VIETQR_ACCOUNT_NAME || 'APPLEWEB';
        const transferContent = `SEVQR ${orderCode}`;
        
        // Use VietQR Quick Link API
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${finalTotal}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

        await tx.payment.create({
          data: {
            orderId: order.id,
            method: 'BANK_TRANSFER',
            amount: finalTotal,
            status: 'PENDING',
            transferContent,
            qrData: qrUrl,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins expiry
          }
        });
        
        // Re-fetch order with payment to return properly
        const updatedOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { items: true, customer: true, Payment: true }
        });
        Object.assign(order, updatedOrder);
      }

      // Reduce stock
      for (const item of orderItemsData) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Increment promo code used count
      if (promoCodeId) {
        await tx.promoCode.update({
          where: { id: promoCodeId },
          data: { usedCount: { increment: 1 } }
        });
      }

      return order;
    });

    // 📩 Send "Order Received" Email asynchronously
    if (newOrder.customer && newOrder.customer.email) {
      sendOrderReceivedEmail(newOrder.customer.email, newOrder.customer.fullName ?? 'Khách hàng', newOrder.orderCode).catch(console.error);
    }

    // 🔔 Create notification for new order
    prisma.notification.create({
      data: {
        type: 'ORDER',
        title: `Đơn hàng mới #${newOrder.orderCode}`,
        message: `${newOrder.customer?.fullName || 'Khách hàng'} vừa đặt hàng. Tổng: ${new Intl.NumberFormat('vi-VN').format(newOrder.totalAmount)}đ.`,
        referenceType: 'Order',
        referenceId: newOrder.id,
      },
    }).catch(console.error);

    // Attach current VietQR config so frontend can display it
    const paymentConfig = {
      bankId: process.env.VIETQR_BANK_ID || 'MB',
      accountNo: process.env.VIETQR_ACCOUNT_NO || '0123456789',
      accountName: process.env.VIETQR_ACCOUNT_NAME || 'APPLEWEB'
    };

    res.status(201).json({ message: 'Tạo đơn hàng thành công', order: newOrder, paymentConfig });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT update order status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

    const orderId = getRouteParam(req.params.id);

    // Execute in transaction if status is becoming completed
    let updatedOrder;
    if (status === 'completed') {
      updatedOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: orderId },
          data: dataToUpdate,
          include: { Invoice: true, customer: true }
        });

        // Create invoice if not exists
        if (!order.Invoice) {
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const count = await tx.invoice.count({
            where: {
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            }
          });
          const invoiceCode = `INV-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;

          await tx.invoice.create({
            data: {
              invoiceCode,
              orderId: order.id,
              subtotal: order.totalAmount,
              shippingFee: order.shippingFee,
              total: order.totalAmount + order.shippingFee,
              tax: 0
            }
          });
        }
        return order;
      });
    } else {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: dataToUpdate,
        include: { customer: true }
      });
    }

    // 📩 Send "Order Confirmed / Shipping" Email when status changes to 'shipping'
    if (status === 'shipping' && updatedOrder.customer && updatedOrder.customer.email) {
      sendOrderConfirmedEmail(
        updatedOrder.customer.email, 
        updatedOrder.customer.fullName ?? 'Khách hàng',
        updatedOrder.orderCode, 
        updatedOrder.estimatedDelivery
      ).catch(console.error);
    }

    res.json({ message: 'Cập nhật trạng thái thành công', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE order (Cancel)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Find order to restore stock
    const order = await prisma.order.findUnique({
      where: { id: getRouteParam(req.params.id) },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    await prisma.$transaction(async (tx) => {
      // Restore stock
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }

      // Delete order
      await tx.order.delete({
        where: { id: getRouteParam(req.params.id) }
      });
    });

    res.json({ message: 'Hủy đơn hàng thành công' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;

