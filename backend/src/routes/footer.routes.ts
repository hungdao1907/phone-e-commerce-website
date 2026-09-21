import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { getRouteParam } from '../utils/route-param';

const router = Router();

// Lấy danh sách toàn bộ Footer sections kèm links (Dành cho Admin, không filter isActive)
router.get('/sections', authenticateToken, async (_req, res) => {
  try {
    const sections = await prisma.footerSection.findMany({
      include: {
        links: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return res.json({ sections });
  } catch (error) {
    console.error('Error fetching footer sections:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
});

// Lấy Footer đang active cho public storefront
router.get('/active', async (_req, res) => {
  try {
    const activeSections = await prisma.footerSection.findMany({
      where: { isActive: true },
      include: {
        links: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const columns = activeSections.filter(s => s.type === 'column').map(s => ({
      id: s.id,
      type: 'column',
      title: s.title,
      sortOrder: s.sortOrder,
      links: s.links.map(l => ({
        id: l.id,
        label: l.label,
        url: l.url,
        sortOrder: l.sortOrder,
      })),
    }));

    const bottomSection = activeSections.find(s => s.type === 'bottom');
    const bottom = bottomSection ? {
      id: bottomSection.id,
      type: 'bottom',
      copyrightText: bottomSection.copyrightText,
      links: bottomSection.links.map(l => ({
        id: l.id,
        label: l.label,
        url: l.url,
        sortOrder: l.sortOrder,
      })),
    } : null;

    return res.json({ columns, bottom });
  } catch (error) {
    console.error('Error fetching active footer:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
});

// Lấy 1 Footer section
router.get('/sections/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ.' });

    const section = await prisma.footerSection.findUnique({
      where: { id },
      include: {
        links: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!section) return res.status(404).json({ message: 'Không tìm thấy mục footer.' });

    return res.json({ section });
  } catch (error) {
    console.error('Error fetching footer section:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
});

// Helper validation logic (could be inline, but let's separate a bit for cleanliness)
function validateFooterPayload(data: any): { valid: boolean; message: string; normalized?: any } {
  if (!data || (data.type !== 'column' && data.type !== 'bottom')) {
    return { valid: false, message: 'Type không hợp lệ.' };
  }

  const type = data.type;
  let title = null;
  let copyrightText = null;

  if (type === 'column') {
    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      return { valid: false, message: 'Cột Footer cần có tên nhóm (title).' };
    }
    title = data.title.trim();
  } else {
    if (!data.copyrightText || typeof data.copyrightText !== 'string' || !data.copyrightText.trim()) {
      return { valid: false, message: 'Dãy dưới Footer cần có bản quyền (copyrightText).' };
    }
    copyrightText = data.copyrightText.trim();
  }

  const sortOrder = typeof data.sortOrder === 'number' && data.sortOrder >= 0 ? Math.floor(data.sortOrder) : 0;
  const isActive = typeof data.isActive === 'boolean' ? data.isActive : true;

  const rawLinks = Array.isArray(data.links) ? data.links : [];
  const normalizedLinks = [];

  for (let i = 0; i < rawLinks.length; i++) {
    const link = rawLinks[i];
    if (!link.label || typeof link.label !== 'string' || !link.label.trim()) {
      return { valid: false, message: `Liên kết thứ ${i + 1} thiếu tên hiển thị.` };
    }
    if (!link.url || typeof link.url !== 'string' || !link.url.trim()) {
      return { valid: false, message: `Liên kết thứ ${i + 1} thiếu URL.` };
    }
    
    normalizedLinks.push({
      label: link.label.trim(),
      url: link.url.trim(),
      sortOrder: typeof link.sortOrder === 'number' && link.sortOrder >= 0 ? Math.floor(link.sortOrder) : i,
      isActive: typeof link.isActive === 'boolean' ? link.isActive : true,
    });
  }

  return {
    valid: true,
    message: 'OK',
    normalized: {
      type,
      title,
      copyrightText,
      sortOrder,
      isActive,
      links: normalizedLinks,
    }
  };
}

// Tạo Footer section
router.post('/sections', authenticateToken, async (req, res) => {
  try {
    const { valid, message, normalized } = validateFooterPayload(req.body);
    if (!valid || !normalized) {
      return res.status(400).json({ message });
    }

    if (normalized.type === 'bottom') {
      const existingBottom = await prisma.footerSection.findFirst({ where: { type: 'bottom' } });
      if (existingBottom) {
        return res.status(409).json({ message: 'Đã tồn tại dãy dưới (bottom) Footer. Chỉ cho phép duy nhất một.' });
      }
    }

    const { links, ...sectionData } = normalized;

    const section = await prisma.footerSection.create({
      data: {
        ...sectionData,
        links: {
          create: links,
        },
      },
      include: {
        links: true,
      },
    });

    return res.status(201).json({ message: 'Tạo thành công.', section });
  } catch (error) {
    console.error('Error creating footer section:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
});

// Cập nhật Footer section
router.put('/sections/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ.' });

    const existing = await prisma.footerSection.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy mục footer.' });

    const { valid, message, normalized } = validateFooterPayload(req.body);
    if (!valid || !normalized) {
      return res.status(400).json({ message });
    }

    if (normalized.type === 'bottom') {
      const existingBottom = await prisma.footerSection.findFirst({ 
        where: { type: 'bottom', NOT: { id } } 
      });
      if (existingBottom) {
        return res.status(409).json({ message: 'Đã tồn tại dãy dưới (bottom) Footer khác.' });
      }
    }

    const { links, ...sectionData } = normalized;

    const updatedSection = await prisma.footerSection.update({
      where: { id },
      data: {
        ...sectionData,
        links: {
          deleteMany: {},
          create: links,
        },
      },
      include: {
        links: true,
      },
    });

    return res.json({ message: 'Cập nhật thành công.', section: updatedSection });
  } catch (error) {
    console.error('Error updating footer section:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
});

// Xóa Footer section
router.delete('/sections/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ.' });

    const existing = await prisma.footerSection.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy mục footer.' });

    await prisma.footerSection.delete({ where: { id } });

    return res.json({ message: 'Xóa thành công.' });
  } catch (error) {
    console.error('Error deleting footer section:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
});

export default router;
