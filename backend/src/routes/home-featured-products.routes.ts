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
    const isActive = readIsActive(req.body?.isActive);
    let requestedPosition = readSortOrder(req.body?.sortOrder);

    if (!productId) return res.status(400).json({ message: 'productId la bat buoc.' });
    if (isActive === null) return res.status(400).json({ message: 'Trang thai hien thi phai la boolean.' });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });
    if (!product) return res.status(404).json({ message: 'Khong tim thay san pham.' });
    if (product.status !== 'active') {
      return res.status(400).json({ message: 'Chi co the chon san pham dang hoat dong.' });
    }

    try {
      const featuredProduct = await prisma.$transaction(async (tx) => {
        const existing = await tx.homeFeaturedProduct.findUnique({ where: { productId } });
        if (existing) throw new Error('DUPLICATE_PRODUCT');

        const totalCount = await tx.homeFeaturedProduct.count();
        const maxAllowed = totalCount + 1;

        if (requestedPosition === null || requestedPosition < 1 || requestedPosition > maxAllowed) {
          requestedPosition = maxAllowed;
        }

        if (requestedPosition < maxAllowed) {
          await tx.homeFeaturedProduct.updateMany({
            where: { sortOrder: { gte: requestedPosition } },
            data: { sortOrder: { increment: 1 } },
          });
        }

        return tx.homeFeaturedProduct.create({
          data: { productId, sortOrder: requestedPosition, isActive },
          include: productInclude,
        });
      });
      return res.status(201).json({ message: 'Da them san pham noi bat.', featuredProduct });
    } catch (e: any) {
      if (e.message === 'DUPLICATE_PRODUCT') {
        return res.status(409).json({ message: 'San pham nay da nam trong danh sach noi bat.' });
      }
      throw e;
    }
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

    const hasSortOrder = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'sortOrder');
    const hasIsActive = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'isActive');
    
    if (!hasSortOrder && !hasIsActive) {
      return res.status(400).json({ message: 'Can cap nhat thu tu hoac trang thai hien thi.' });
    }

    const requestedPosition = hasSortOrder ? readSortOrder(req.body.sortOrder) : null;
    if (hasSortOrder && (requestedPosition === null || requestedPosition < 1)) {
      return res.status(400).json({ message: 'Thu tu hien thi phai la so nguyen duong.' });
    }

    const isActive = hasIsActive ? readIsActive(req.body.isActive) : null;
    if (hasIsActive && isActive === null) {
      return res.status(400).json({ message: 'Trang thai hien thi phai la boolean.' });
    }

    const featuredProduct = await prisma.$transaction(async (tx) => {
      const existing = await tx.homeFeaturedProduct.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');

      const dataToUpdate: any = {};
      if (isActive !== null) dataToUpdate.isActive = isActive;

      if (requestedPosition !== null && requestedPosition !== existing.sortOrder) {
        const totalCount = await tx.homeFeaturedProduct.count();
        let safePosition = requestedPosition;
        if (safePosition > totalCount) safePosition = totalCount;

        const oldPosition = existing.sortOrder;
        const newPosition = safePosition;

        if (oldPosition < newPosition) {
          await tx.homeFeaturedProduct.updateMany({
            where: { sortOrder: { gt: oldPosition, lte: newPosition } },
            data: { sortOrder: { decrement: 1 } },
          });
        } else if (oldPosition > newPosition) {
          await tx.homeFeaturedProduct.updateMany({
            where: { sortOrder: { gte: newPosition, lt: oldPosition } },
            data: { sortOrder: { increment: 1 } },
          });
        }
        dataToUpdate.sortOrder = newPosition;
      }

      return tx.homeFeaturedProduct.update({
        where: { id },
        data: dataToUpdate,
        include: productInclude,
      });
    });

    return res.json({ message: 'Da cap nhat san pham noi bat.', featuredProduct });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Khong tim thay san pham noi bat.' });
    }
    console.error('Error updating home featured product:', error);
    return res.status(500).json({ message: 'Khong the cap nhat san pham noi bat.' });
  }
});

router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID san pham noi bat khong hop le.' });

    await prisma.$transaction(async (tx) => {
      const existing = await tx.homeFeaturedProduct.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');

      await tx.homeFeaturedProduct.delete({ where: { id } });
      
      await tx.homeFeaturedProduct.updateMany({
        where: { sortOrder: { gt: existing.sortOrder } },
        data: { sortOrder: { decrement: 1 } },
      });
    });

    return res.json({ message: 'Da xoa san pham khoi danh sach noi bat.' });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Khong tim thay san pham noi bat.' });
    }
    console.error('Error deleting home featured product:', error);
    return res.status(500).json({ message: 'Khong the xoa san pham noi bat.' });
  }
});

export default router;
