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

async function applyOrder(tx: Omit<Prisma.TransactionClient, never>, list: { id: string; sortOrder: number }[]) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].sortOrder !== i + 1) {
      await tx.homeFeaturedProduct.update({
        where: { id: list[i].id },
        data: { sortOrder: i + 1 },
      });
      list[i].sortOrder = i + 1;
    }
  }
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
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
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
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
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

        const all = await tx.homeFeaturedProduct.findMany({
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
          select: { id: true, sortOrder: true },
        });

        const maxAllowed = all.length + 1;
        if (requestedPosition === null || requestedPosition < 1 || requestedPosition > maxAllowed) {
          requestedPosition = maxAllowed;
        }

        const created = await tx.homeFeaturedProduct.create({
          data: { productId, sortOrder: 999999, isActive },
          include: productInclude,
        });

        all.splice(requestedPosition - 1, 0, { id: created.id, sortOrder: 999999 });
        await applyOrder(tx, all);

        created.sortOrder = requestedPosition;
        return created;
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

      let updated = await tx.homeFeaturedProduct.update({
        where: { id },
        data: isActive !== null ? { isActive } : {},
        include: productInclude,
      });

      if (requestedPosition !== null && requestedPosition !== existing.sortOrder) {
        const all = await tx.homeFeaturedProduct.findMany({
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
          select: { id: true, sortOrder: true },
        });

        const targetIndex = all.findIndex((x) => x.id === id);
        if (targetIndex > -1) {
          const [targetItem] = all.splice(targetIndex, 1);
          let safePosition = requestedPosition;
          if (safePosition > all.length + 1) safePosition = all.length + 1;

          all.splice(safePosition - 1, 0, targetItem);
          await applyOrder(tx, all);
          updated.sortOrder = safePosition;
        }
      }

      return updated;
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
      
      const all = await tx.homeFeaturedProduct.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true, sortOrder: true },
      });
      await applyOrder(tx, all);
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
