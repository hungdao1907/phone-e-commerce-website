import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/wishlist - Get current user's wishlist
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.customerId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const items = await prisma.wishlist.findMany({
      where: { customerId: userId },
      include: {
        product: {
          include: {
            category: true,
            variants: { orderBy: { createdAt: 'asc' }, take: 1 }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/wishlist/ids - Get just product IDs in wishlist (lightweight)
router.get('/ids', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.customerId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const items = await prisma.wishlist.findMany({
      where: { customerId: userId },
      select: { productId: true }
    });

    res.json(items.map(i => i.productId));
  } catch (error) {
    console.error('Error fetching wishlist IDs:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/wishlist/toggle - Toggle a product in wishlist
router.post('/toggle', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.customerId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: { customerId_productId: { customerId: userId, productId } }
    });

    if (existing) {
      // Remove from wishlist
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return res.json({ action: 'removed', productId });
    } else {
      // Add to wishlist
      await prisma.wishlist.create({
        data: { customerId: userId, productId }
      });
      return res.json({ action: 'added', productId });
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/wishlist/:productId - Remove specific product
router.delete('/:productId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || req.user?.customerId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const productId = req.params.productId;

    await prisma.wishlist.deleteMany({
      where: { customerId: userId, productId }
    });

    res.json({ message: 'Đã xóa khỏi yêu thích', productId });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
