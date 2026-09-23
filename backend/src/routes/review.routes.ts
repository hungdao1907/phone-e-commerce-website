import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// GET all reviews
router.get('/', authenticateToken, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        customer: { select: { fullName: true, email: true } },
        order: { select: { orderCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST create review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, customerId, rating, comment, images } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'completed' && order.status !== 'delivered') {
      return res.status(400).json({ message: 'Chỉ có thể đánh giá đơn hàng đã hoàn thành hoặc đã giao' });
    }

    const review = await prisma.review.create({
      data: {
        orderId,
        customerId,
        rating,
        comment,
        images: images || []
      },
      include: {
        customer: { select: { fullName: true } },
        order: { select: { orderCode: true } }
      }
    });

    // 🔔 Create notification for new review
    const stars = '⭐'.repeat(review.rating);
    prisma.notification.create({
      data: {
        type: 'REVIEW',
        title: `Đánh giá mới ${stars}`,
        message: `${review.customer?.fullName || 'Khách hàng'} vừa đánh giá đơn hàng #${review.order?.orderCode}${review.comment ? ': ' + review.comment.slice(0, 60) : ''}.`,
        referenceType: 'Review',
        referenceId: review.id,
      },
    }).catch(console.error);

    res.status(201).json({ message: 'Tạo đánh giá thành công', review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
