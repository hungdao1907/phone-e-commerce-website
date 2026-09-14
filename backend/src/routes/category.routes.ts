import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Helper: Generate slug from Vietnamese name
const generateSlug = (name: string): string => {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// GET all categories (tree structure)
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            attributes: { orderBy: { sortOrder: 'asc' } },
            children: {
              include: {
                attributes: { orderBy: { sortOrder: 'asc' } }
              },
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        attributes: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET single category with attributes
router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        attributes: { orderBy: { sortOrder: 'asc' } },
        children: { include: { attributes: true }, orderBy: { sortOrder: 'asc' } },
        products: { include: { variants: true } }
      }
    });
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST create category
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, icon, parentId, isActive } = req.body;
    const slug = generateSlug(name);

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ message: 'Danh mục với tên này đã tồn tại' });
    }

    const maxOrder = await prisma.category.aggregate({
      _max: { sortOrder: true },
      where: { parentId: parentId || null }
    });

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        icon: icon || null,
        parentId: parentId || null,
        isActive: isActive !== false,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1
      },
      include: { attributes: true, children: true }
    });
    res.status(201).json({ message: 'Tạo danh mục thành công', category: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT update category
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, icon, isActive, sortOrder } = req.body;
    const data: any = {};
    if (name !== undefined) {
      data.name = name;
      data.slug = generateSlug(name);
    }
    if (icon !== undefined) data.icon = icon;
    if (isActive !== undefined) data.isActive = isActive;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data,
      include: { attributes: true, children: true }
    });
    res.json({ message: 'Cập nhật danh mục thành công', category: updated });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE category
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ========== ATTRIBUTE ROUTES ==========

// POST add attribute to category
router.post('/:id/attributes', authenticateToken, async (req, res) => {
  try {
    const { name, values, colorCodes } = req.body;
    const maxOrder = await prisma.categoryAttribute.aggregate({
      _max: { sortOrder: true },
      where: { categoryId: req.params.id }
    });

    const attr = await prisma.categoryAttribute.create({
      data: {
        name,
        values: values || [],
        colorCodes: colorCodes || [],
        categoryId: req.params.id,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1
      }
    });
    res.status(201).json({ message: 'Thêm thuộc tính thành công', attribute: attr });
  } catch (error) {
    console.error('Error adding attribute:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT update attribute
router.put('/attributes/:attrId', authenticateToken, async (req, res) => {
  try {
    const { name, values, colorCodes } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (values !== undefined) data.values = values;
    if (colorCodes !== undefined) data.colorCodes = colorCodes;

    const updated = await prisma.categoryAttribute.update({
      where: { id: req.params.attrId },
      data
    });
    res.json({ message: 'Cập nhật thuộc tính thành công', attribute: updated });
  } catch (error) {
    console.error('Error updating attribute:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE attribute
router.delete('/attributes/:attrId', authenticateToken, async (req, res) => {
  try {
    await prisma.categoryAttribute.delete({ where: { id: req.params.attrId } });
    res.json({ message: 'Xóa thuộc tính thành công' });
  } catch (error) {
    console.error('Error deleting attribute:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
