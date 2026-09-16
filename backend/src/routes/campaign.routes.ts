import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();
const prisma = new PrismaClient();

// GET all campaigns
router.get('/', authenticateToken, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST create campaign
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, discountType, discountValue, startDate, endDate, isActive, appliesTo, targetIds, bannerUrl } = req.body;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        discountType,
        discountValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        appliesTo,
        targetIds,
        bannerUrl
      }
    });

    res.status(201).json({ message: 'Tạo chiến dịch thành công', campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT update campaign
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, discountType, discountValue, startDate, endDate, isActive, appliesTo, targetIds, bannerUrl } = req.body;

    const campaign = await prisma.campaign.update({
      where: { id: getRouteParam(req.params.id) },
      data: {
        name,
        description,
        discountType,
        discountValue,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        appliesTo,
        targetIds,
        bannerUrl
      }
    });

    res.json({ message: 'Cập nhật chiến dịch thành công', campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE campaign
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.campaign.delete({
      where: { id: getRouteParam(req.params.id) }
    });
    res.json({ message: 'Xóa chiến dịch thành công' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
