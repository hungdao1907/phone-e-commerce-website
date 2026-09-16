import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';
import { sendOrderReceivedEmail, sendOrderConfirmedEmail } from '../services/email.service';

const router = express.Router();
const prisma = new PrismaClient();

type PreparedOrderItem = {
  variantId: string;
  productName: string;
  variantInfo: string;
  quantity: number;
  unitPrice: number;
};

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
        items: true,
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
        items: true,
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
    const { customerId, items, paymentMethod, shippingAddress, shippingPhone, shippingFee, note, estimatedDelivery } = req.body;

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
    const orderCode = `ORD-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;

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

    // Use transaction to create order and reduce stock
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderCode,
          customerId,
          paymentMethod,
          shippingAddress,
          shippingPhone,
          shippingFee: shippingFee || 0,
          totalAmount,
          note,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
          items: {
            create: orderItemsData
          }
        },
        include: { items: true, customer: true }
      });

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

      return order;
    });

    // 📩 Send "Order Received" Email asynchronously
    if (newOrder.customer && newOrder.customer.email) {
      sendOrderReceivedEmail(newOrder.customer.email, newOrder.customer.fullName, newOrder.orderCode).catch(console.error);
    }

    res.status(201).json({ message: 'Tạo đơn hàng thành công', order: newOrder });
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
        updatedOrder.customer.fullName, 
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

