import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// GET all invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        order: {
          include: {
            customer: { select: { fullName: true, email: true, phone: true } },
            items: true
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET single invoice
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            customer: true,
            items: true
          }
        }
      }
    });
    if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
