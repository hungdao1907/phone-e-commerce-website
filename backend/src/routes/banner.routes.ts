import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// GET all banners
router.get('/', authenticateToken, async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST create banner
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, image, link, position, sortOrder, isActive, startDate, endDate } = req.body;

    const banner = await prisma.banner.create({
      data: {
        title,
        image,
        link,
        position,
        sortOrder: sortOrder || 0,
        isActive,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }
    });

    res.status(201).json({ message: 'Tạo banner thành công', banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT update banner
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, image, link, position, sortOrder, isActive, startDate, endDate } = req.body;

    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data: {
        title,
        image,
        link,
        position,
        sortOrder,
        isActive,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }
    });

    res.json({ message: 'Cập nhật banner thành công', banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE banner
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.banner.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Xóa banner thành công' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
