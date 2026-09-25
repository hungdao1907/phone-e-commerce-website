import express from 'express';
import { Prisma } from '@prisma/client';
import type { Banner } from '@prisma/client';
import prisma from '../config/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();

type BannerPayload = Record<string, unknown>;

type BannerWriteData = {
  title: string;
  image: string | null;
  publicUrl: string | null;
  link: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
};

class BannerValidationError extends Error {}

function asBannerPayload(value: unknown): BannerPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BannerValidationError('Dữ liệu banner không hợp lệ.');
  }
  return value as BannerPayload;
}

const hasOwn = (payload: BannerPayload, key: string) =>
  Object.prototype.hasOwnProperty.call(payload, key);

const readValue = <T>(payload: BannerPayload, key: string, fallback: T): unknown =>
  hasOwn(payload, key) ? payload[key] : fallback;

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BannerValidationError(`${field} là bắt buộc.`);
  }

  return value.trim();
}

function optionalBannerImage(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') {
    throw new BannerValidationError('Đường dẫn ảnh phải là chuỗi hợp lệ.');
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/i);
  if (match) {
    return match[1];
  }
  return trimmed;
}

function optionalPublicUrl(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') {
    throw new BannerValidationError('Public URL phải là chuỗi hợp lệ.');
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!/^https?:\/\//i.test(trimmed)) {
    throw new BannerValidationError('Public URL phải bắt đầu bằng http:// hoặc https://');
  }

  return trimmed;
}

function optionalLink(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') {
    throw new BannerValidationError('Đường dẫn phải là chuỗi hợp lệ.');
  }

  const link = value.trim();
  if (!link) return null;
  if (link.startsWith('/')) return link;

  try {
    const url = new URL(link);
    if (url.protocol === 'http:' || url.protocol === 'https:') return link;
  } catch {
    // Handled by the validation error below.
  }

  throw new BannerValidationError('Đường dẫn phải bắt đầu bằng "/" hoặc là URL http(s) hợp lệ.');
}

function optionalDate(value: unknown, field: string): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new BannerValidationError(`${field} phải là ngày giờ hợp lệ.`);
  }

  return new Date(value);
}

function sortOrder(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new BannerValidationError('Thứ tự hiển thị phải là số nguyên lớn hơn hoặc bằng 0.');
  }

  return value;
}

function activeState(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new BannerValidationError('Trạng thái hiển thị phải là true hoặc false.');
  }

  return value;
}

function parseBannerPayload(payload: BannerPayload, existing?: Banner): BannerWriteData {
  const title = requiredText(readValue(payload, 'title', existing?.title), 'Tiêu đề');

  const rawImage = readValue(payload, 'image', existing?.image ?? null);
  const image = optionalBannerImage(rawImage);

  const rawPublicUrl = readValue(payload, 'publicUrl', existing?.publicUrl ?? null);
  const publicUrl = optionalPublicUrl(rawPublicUrl);

  if (!image && !publicUrl) {
    throw new BannerValidationError('Banner phải có ảnh tải lên hoặc Public URL.');
  }

  const position = requiredText(readValue(payload, 'position', existing?.position), 'Vị trí hiển thị');
  const link = optionalLink(readValue(payload, 'link', existing?.link ?? null));
  const nextSortOrder = sortOrder(readValue(payload, 'sortOrder', existing?.sortOrder ?? 0));
  const isActive = activeState(readValue(payload, 'isActive', existing?.isActive ?? true));
  const startDate = optionalDate(readValue(payload, 'startDate', existing?.startDate ?? null), 'Thời gian bắt đầu');
  const endDate = optionalDate(readValue(payload, 'endDate', existing?.endDate ?? null), 'Thời gian kết thúc');

  if (startDate && endDate && endDate <= startDate) {
    throw new BannerValidationError('Thời gian kết thúc phải sau thời gian bắt đầu.');
  }

  return {
    title,
    image,
    publicUrl,
    link,
    position,
    sortOrder: nextSortOrder,
    isActive,
    startDate,
    endDate,
  };
}

function messageFromError(error: unknown): string {
  if (error instanceof BannerValidationError) return error.message;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return 'Không tìm thấy banner.';
  }
  return 'Lỗi server.';
}

// Storefront: only banners that are enabled and currently within their optional schedule.
router.get('/active', async (req, res) => {
  try {
    const position = typeof req.query.position === 'string' ? req.query.position.trim() : undefined;
    if (Array.isArray(req.query.position)) {
      return res.status(400).json({ message: 'Vị trí hiển thị không hợp lệ.' });
    }

    const now = new Date();
    const where: Prisma.BannerWhereInput = {
      isActive: true,
      ...(position ? { position } : {}),
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    };

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return res.json(banners);
  } catch (error) {
    console.error('Error fetching active banners:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
});

// Admin: returns every banner so scheduled, expired and disabled banners remain manageable.
router.get('/', authenticateToken, async (_req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return res.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = parseBannerPayload(asBannerPayload(req.body));
    const targetPosition = data.position;
    const requestedOrder = data.sortOrder;

    const banner = await prisma.$transaction(async (tx) => {
      const count = await tx.banner.count({ where: { position: targetPosition } });
      const targetOrder = Math.max(0, Math.min(requestedOrder, count));

      if (targetOrder < count) {
        await tx.banner.updateMany({
          where: { position: targetPosition, sortOrder: { gte: targetOrder } },
          data: { sortOrder: { increment: 1 } }
        });
      }

      return tx.banner.create({
        data: { ...data, sortOrder: targetOrder }
      });
    });

    return res.status(201).json({ message: 'Tạo banner thành công.', banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    const message = messageFromError(error);
    return res.status(error instanceof BannerValidationError ? 400 : 500).json({ message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID banner không hợp lệ.' });

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy banner.' });

    const data = parseBannerPayload(asBannerPayload(req.body), existing);

    const banner = await prisma.$transaction(async (tx) => {
      if (existing.position !== data.position) {
        // Shift old position up
        await tx.banner.updateMany({
          where: { position: existing.position, sortOrder: { gt: existing.sortOrder } },
          data: { sortOrder: { decrement: 1 } }
        });

        const count = await tx.banner.count({ where: { position: data.position } });
        const targetOrder = Math.max(0, Math.min(data.sortOrder, count));

        // Shift new position down
        if (targetOrder < count) {
          await tx.banner.updateMany({
            where: { position: data.position, sortOrder: { gte: targetOrder } },
            data: { sortOrder: { increment: 1 } }
          });
        }

        return tx.banner.update({
          where: { id },
          data: { ...data, sortOrder: targetOrder }
        });
      } else {
        if (existing.sortOrder === data.sortOrder) {
          return tx.banner.update({ where: { id }, data });
        }

        const count = await tx.banner.count({ where: { position: data.position } });
        const targetOrder = Math.max(0, Math.min(data.sortOrder, count - 1));

        if (existing.sortOrder < targetOrder) {
          await tx.banner.updateMany({
            where: {
              position: data.position,
              sortOrder: { gt: existing.sortOrder, lte: targetOrder }
            },
            data: { sortOrder: { decrement: 1 } }
          });
        } else {
          await tx.banner.updateMany({
            where: {
              position: data.position,
              sortOrder: { gte: targetOrder, lt: existing.sortOrder }
            },
            data: { sortOrder: { increment: 1 } }
          });
        }

        return tx.banner.update({
          where: { id },
          data: { ...data, sortOrder: targetOrder }
        });
      }
    });

    return res.json({ message: 'Cập nhật banner thành công.', banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    const message = messageFromError(error);
    return res.status(error instanceof BannerValidationError ? 400 : 500).json({ message });
  }
});

router.patch('/:id/move', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID banner không hợp lệ.' });

    const { direction } = req.body;
    if (direction !== 'up' && direction !== 'down') {
      return res.status(400).json({ message: 'Hướng di chuyển không hợp lệ (up/down).' });
    }

    const banners = await prisma.$transaction(async (tx) => {
      const current = await tx.banner.findUnique({ where: { id } });
      if (!current) throw new Prisma.PrismaClientKnownRequestError('', { code: 'P2025', clientVersion: '' });

      const targetOrder = direction === 'up' ? current.sortOrder - 1 : current.sortOrder + 1;
      if (targetOrder < 0) return null;

      const adjacent = await tx.banner.findFirst({
        where: { position: current.position, sortOrder: targetOrder }
      });

      if (!adjacent) return null;

      // Swap
      await tx.banner.update({
        where: { id },
        data: { sortOrder: targetOrder }
      });

      await tx.banner.update({
        where: { id: adjacent.id },
        data: { sortOrder: current.sortOrder }
      });

      return tx.banner.findMany({ orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }] });
    });

    return res.json({ message: 'Đổi thứ tự thành công.', banners });
  } catch (error) {
    console.error('Error moving banner:', error);
    const message = messageFromError(error);
    return res.status(message === 'Không tìm thấy banner.' ? 404 : 500).json({ message });
  }
});

router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID banner không hợp lệ.' });

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive phải là boolean' });
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: { isActive },
    });

    return res.json({
      message: isActive ? 'Đã bật banner' : 'Đã tắt banner',
      banner,
    });
  } catch (error) {
    console.error('Error updating banner status:', error);
    const message = messageFromError(error);
    return res.status(message === 'Không tìm thấy banner.' ? 404 : 500).json({ message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID banner không hợp lệ.' });

    await prisma.$transaction(async (tx) => {
      const banner = await tx.banner.findUnique({ where: { id } });
      if (!banner) throw new Prisma.PrismaClientKnownRequestError('', { code: 'P2025', clientVersion: '' });

      await tx.banner.delete({ where: { id } });

      await tx.banner.updateMany({
        where: { position: banner.position, sortOrder: { gt: banner.sortOrder } },
        data: { sortOrder: { decrement: 1 } }
      });
    });

    return res.json({ message: 'Xóa banner thành công.' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    const message = messageFromError(error);
    return res.status(message === 'Không tìm thấy banner.' ? 404 : 500).json({ message });
  }
});

export default router;
