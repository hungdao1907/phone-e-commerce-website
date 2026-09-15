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
  image: string;
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

function sanitizeBannerImage(value: unknown, field: string): string {
  const text = requiredText(value, field);
  const match = text.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/i);
  if (match) {
    return match[1];
  }
  return text;
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
  const image = sanitizeBannerImage(readValue(payload, 'image', existing?.image), 'Hình ảnh');
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
    const banner = await prisma.banner.create({
      data: parseBannerPayload(asBannerPayload(req.body)),
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

    const banner = await prisma.banner.update({
      where: { id },
      data: parseBannerPayload(asBannerPayload(req.body), existing),
    });

    return res.json({ message: 'Cập nhật banner thành công.', banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    const message = messageFromError(error);
    return res.status(error instanceof BannerValidationError ? 400 : 500).json({ message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID banner không hợp lệ.' });

    await prisma.banner.delete({ where: { id } });
    return res.json({ message: 'Xóa banner thành công.' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    const message = messageFromError(error);
    return res.status(message === 'Không tìm thấy banner.' ? 404 : 500).json({ message });
  }
});

export default router;