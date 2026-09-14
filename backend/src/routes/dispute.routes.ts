import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// GET all disputes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        customer: { select: { fullName: true, email: true, phone: true } },
        order: { select: { orderCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(disputes);
  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST create dispute
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, customerId, reason, description, images } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        customerId,
        reason,
        description,
        images: images || [],
        status: 'open'
      }
    });

    res.status(201).json({ message: 'Tạo khiếu nại thành công', dispute });
  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT update dispute status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, resolution } = req.body;

    const dispute = await prisma.dispute.update({
      where: { id: req.params.id },
      data: { status, resolution }
    });

    res.json({ message: 'Cập nhật khiếu nại thành công', dispute });
  } catch (error) {
    console.error('Error updating dispute:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
