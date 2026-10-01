import { Prisma } from '@prisma/client';
import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';

const router = Router();

const productInclude = {
  product: {
    include: {
      category: true,
      variants: { orderBy: { createdAt: 'asc' as const } },
    },
  },
} satisfies Prisma.HomeFeaturedProductInclude;

function readSortOrder(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

function readIsActive(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

// Public storefront selection: only active entries with active canonical products.
router.get('/', async (_req, res) => {
  try {
    const featuredProducts = await prisma.homeFeaturedProduct.findMany({
      where: {
        isActive: true,
        product: { status: 'active' },
      },
      include: productInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return res.json({ featuredProducts });
  } catch (error) {
    console.error('Error fetching home featured products:', error);
    return res.status(500).json({ message: 'Khong the tai san pham noi bat.' });
  }
});

// Admin list deliberately includes inactive selections and inactive products for management.
router.get('/admin', authenticateToken, async (_req, res) => {
  try {
    const featuredProducts = await prisma.homeFeaturedProduct.findMany({
      include: productInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return res.json({ featuredProducts });
  } catch (error) {
    console.error('Error fetching managed home featured products:', error);
    return res.status(500).json({ message: 'Khong the tai danh sach san pham noi bat.' });
  }
});

router.post('/admin', authenticateToken, async (req, res) => {
  try {
    const productId = typeof req.body?.productId === 'string' ? req.body.productId.trim() : '';
    const sortOrder = readSortOrder(req.body?.sortOrder);
    const isActive = readIsActive(req.body?.isActive);

    if (!productId) return res.status(400).json({ message: 'productId la bat buoc.' });
    if (sortOrder === null) return res.status(400).json({ message: 'Thu tu hien thi phai la so nguyen khong am.' });
    if (isActive === null) return res.status(400).json({ message: 'Trang thai hien thi phai la boolean.' });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });
    if (!product) return res.status(404).json({ message: 'Khong tim thay san pham.' });
    if (product.status !== 'active') {
      return res.status(400).json({ message: 'Chi co the chon san pham dang hoat dong.' });
    }

    const existing = await prisma.homeFeaturedProduct.findUnique({ where: { productId } });
    if (existing) return res.status(409).json({ message: 'San pham nay da nam trong danh sach noi bat.' });

    const featuredProduct = await prisma.homeFeaturedProduct.create({
      data: { productId, sortOrder, isActive },
      include: productInclude,
    });

    return res.status(201).json({ message: 'Da them san pham noi bat.', featuredProduct });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'San pham nay da nam trong danh sach noi bat.' });
    }
    console.error('Error creating home featured product:', error);
    return res.status(500).json({ message: 'Khong the them san pham noi bat.' });
  }
});

// Product selection is immutable after creation; edit only featured-specific configuration.
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID san pham noi bat khong hop le.' });
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'productId')) {
      return res.status(400).json({ message: 'Khong the doi san pham cua muc noi bat. Hay xoa va them lai.' });
    }

    const data: { sortOrder?: number; isActive?: boolean } = {};
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'sortOrder')) {
      const sortOrder = readSortOrder(req.body.sortOrder);
      if (sortOrder === null) return res.status(400).json({ message: 'Thu tu hien thi phai la so nguyen khong am.' });
      data.sortOrder = sortOrder;
    }
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'isActive')) {
      const isActive = readIsActive(req.body.isActive);
      if (isActive === null) return res.status(400).json({ message: 'Trang thai hien thi phai la boolean.' });
      data.isActive = isActive;
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'Can cap nhat thu tu hoac trang thai hien thi.' });
    }

    const existing = await prisma.homeFeaturedProduct.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Khong tim thay san pham noi bat.' });

    const featuredProduct = await prisma.homeFeaturedProduct.update({
      where: { id },
      data,
      include: productInclude,
    });
    return res.json({ message: 'Da cap nhat san pham noi bat.', featuredProduct });
  } catch (error) {
    console.error('Error updating home featured product:', error);
    return res.status(500).json({ message: 'Khong the cap nhat san pham noi bat.' });
  }
});

router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID san pham noi bat khong hop le.' });

    const existing = await prisma.homeFeaturedProduct.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Khong tim thay san pham noi bat.' });

    await prisma.homeFeaturedProduct.delete({ where: { id } });
    return res.json({ message: 'Da xoa san pham khoi danh sach noi bat.' });
  } catch (error) {
    console.error('Error deleting home featured product:', error);
    return res.status(500).json({ message: 'Khong the xoa san pham noi bat.' });
  }
});

export default router;
