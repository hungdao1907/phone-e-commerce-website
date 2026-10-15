import express from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();

class PromoCodeHistoryConflict extends Error {}

// GET all promo codes
router.get('/', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), async (req, res) => {
  try {
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Map to expected frontend format which uses 'name' instead of 'code' for legacy compatibility
    const mappedPromoCodes = promoCodes.map(p => ({
      ...p,
      name: p.code // for frontend compatibility
    }));
    res.json(mappedPromoCodes);
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST validate promo code (Public)
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });
    }

    const promo = await prisma.promoCode.findFirst({
      where: {
        code: {
          equals: code,
          mode: 'insensitive' // case-insensitive match
        },
        isActive: true,
      }
    });

    if (!promo) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
    }

    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      return res.status(400).json({ message: 'Mã giảm giá chưa đến hạn hoặc đã hết hạn sử dụng' });
    }
    
    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
    }
    
    if (subtotal !== undefined && subtotal < promo.minOrderValue) {
      return res.status(400).json({ message: `Đơn hàng tối thiểu để dùng mã này là ${promo.minOrderValue.toLocaleString('vi-VN')}đ` });
    }

    res.json({
      message: 'Áp dụng mã thành công',
      campaign: {
        id: promo.id,
        name: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderValue: promo.minOrderValue
      }
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST create promo code
router.post('/', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), async (req, res) => {
  try {
    // The frontend sends `name` instead of `code`. We map it back.
    const { name, code, discountType, discountValue, startDate, endDate, isActive, usageLimit, minOrderValue } = req.body;
    const actualCode = code || name;

    const promoCode = await prisma.promoCode.create({
      data: {
        code: actualCode,
        discountType,
        discountValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        usageLimit: usageLimit || 0,
        minOrderValue: minOrderValue || 0,
        usedCount: 0
      }
    });

    res.status(201).json({ message: 'Tạo mã thành công', promoCode });
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT update promo code
router.put('/:id', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), async (req, res) => {
  try {
    const { name, code, discountType, discountValue, startDate, endDate, isActive, usageLimit, minOrderValue, usedCount } = req.body;
    const actualCode = code || name;

    const promoCode = await prisma.promoCode.update({
      where: { id: getRouteParam(req.params.id) },
      data: {
        ...(actualCode && { code: actualCode }),
        discountType,
        discountValue,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        usageLimit,
        minOrderValue,
        usedCount
      }
    });

    res.json({ message: 'Cập nhật mã thành công', promoCode });
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE promo code
router.delete('/:id', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    await prisma.$transaction(async (tx) => {
      if (await tx.order.count({ where: { promoCodeId: id } }) > 0) {
        throw new PromoCodeHistoryConflict('Promo code is referenced by existing orders.');
      }
      await tx.promoCode.delete({ where: { id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.json({ message: 'Xóa mã thành công' });
  } catch (error) {
    if (error instanceof PromoCodeHistoryConflict) {
      return res.status(409).json({ message: 'Cannot delete a promotion code used by an order; deactivate it to preserve the order history.' });
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: 'Promo code not found.' });
    }
    console.error('Error deleting promo code:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
