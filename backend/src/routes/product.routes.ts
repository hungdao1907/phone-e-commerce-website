import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();
const prisma = new PrismaClient();

// POST /sync-mock (Create or find mock product for storefront cart)
router.post('/sync-mock', async (req, res) => {
  try {
    const p = req.body;
    let product = await prisma.product.findFirst({
      where: { name: p.name },
      include: { variants: true, category: { include: { parent: true } } }
    });

    if (!product) {
      const numericPrice = typeof p.price === 'string' ? parseInt(p.price.replace(/\D/g, '')) : (p.price || 0);
      const numericOriginalPrice = typeof p.originalPrice === 'string' ? parseInt(p.originalPrice.replace(/\D/g, '')) : null;
      
      let variantsData = [];
      if (p.colors && p.colors.length > 0) {
        variantsData = p.colors.map((c: any, i: number) => ({
          sku: `${p.slug || p.id}-var-${i}`,
          price: numericPrice,
          salePrice: numericOriginalPrice ? numericPrice : null,
          stock: 10,
          attributes: {
            "Màu sắc": c.name,
            "Dung lượng": "Tiêu chuẩn"
          },
          colorCode: c.hex,
          image: c.image || p.image || null
        }));
      } else {
        variantsData = [{
          sku: `${p.slug || p.id}-var-default`,
          price: numericPrice,
          salePrice: numericOriginalPrice ? numericPrice : null,
          stock: 10,
          attributes: { "Màu sắc": "Mặc định", "Dung lượng": "Tiêu chuẩn" },
          image: p.image || null
        }];
      }

      product = await prisma.product.create({
        data: {
          name: p.name,
          brand: p.brand || 'Khác',
          description: p.description || p.tagline || '',
          image: p.image || null,
          images: p.image ? [p.image] : [],
          status: 'active',
          specifications: p.specs ? [
            { key: 'Màn hình', value: p.specs.display || '' },
            { key: 'Chip', value: p.specs.chipset || '' },
            { key: 'Camera', value: p.specs.camera || '' },
            { key: 'Pin', value: p.specs.battery || '' },
          ] : [],
          variants: {
            create: variantsData
          }
        },
        include: { variants: true, category: { include: { parent: true } } }
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Error syncing mock product:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET all products with variants and active campaigns
router.get('/', async (req, res) => {
  try {
    const [products, activeCampaigns] = await Promise.all([
      prisma.product.findMany({
        include: {
          category: true,
          variants: { orderBy: { createdAt: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.campaign.findMany({
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      })
    ]);

    // Attach campaign to products
    const productsWithCampaigns = products.map((product) => {
      // Find a campaign that applies to this product
      const campaign = activeCampaigns.find(c => 
        (c.appliesTo === 'product' && c.targetIds.includes(product.id)) ||
        (c.appliesTo === 'category' && c.targetIds.includes(product.categoryId || '')) ||
        (c.appliesTo === 'all')
      );
      return { ...product, activeCampaign: campaign || null };
    });

    res.json(productsWithCampaigns);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET single product with variants, category attributes and active campaign
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: getRouteParam(req.params.id) },
      include: {
        category: { include: { attributes: true, parent: true } },
        variants: { orderBy: { createdAt: 'asc' } }
      }
    });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    const campaign = activeCampaigns.find(c => 
      (c.appliesTo === 'product' && c.targetIds.includes(product.id)) ||
      (c.appliesTo === 'category' && c.targetIds.includes(product.categoryId || '')) ||
      (c.appliesTo === 'all')
    );

    res.json({ ...product, activeCampaign: campaign || null });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST create product with variants
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, brand, image, images, categoryId, status, variants, specifications } = req.body;

    // Validate variants
    if (!variants || variants.length === 0) {
      return res.status(400).json({ message: 'Sản phẩm cần ít nhất 1 biến thể' });
    }

    // Check SKU uniqueness for all variants
    for (const v of variants) {
      const existing = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
      if (existing) {
        return res.status(400).json({ message: `Mã SKU "${v.sku}" đã tồn tại` });
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description: description || null,
        brand: brand || null,
        image: image || null,
        images: images || [],
        categoryId: categoryId || null,
        status: status || 'active',
        specifications: specifications || null,
        variants: {
          create: variants.map((v: any) => ({
            sku: v.sku,
            price: Number(v.price),
            salePrice: v.salePrice ? Number(v.salePrice) : null,
            stock: Number(v.stock || 0),
            attributes: v.attributes || {},
            colorCode: v.colorCode || null,
            image: v.image || null
          }))
        }
      },
      include: { category: true, variants: true }
    });

    res.status(201).json({ message: 'Thêm sản phẩm thành công', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error); res.status(500).json({ message: 'Lỗi server: ' + ((error as any).message || '') }); return;
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT update product (basic info + upsert variants)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    const { name, description, brand, image, images, categoryId, status, variants, specifications } = req.body;

    // Update product basic info
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (brand !== undefined) data.brand = brand;
    if (image !== undefined) data.image = image;
    if (images !== undefined) data.images = images;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (status !== undefined) data.status = status;
    if (specifications !== undefined) data.specifications = specifications;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, variants: true }
    });

    // If variants provided, update existing by SKU and create new ones
    if (variants && Array.isArray(variants)) {
      const incomingSkus = variants.map((v: any) => v.sku);
      
      const existingVariants = await prisma.productVariant.findMany({ where: { productId: id } });
      const skusToDelete = existingVariants.filter(ev => !incomingSkus.includes(ev.sku)).map(ev => ev.sku);
      
      if (skusToDelete.length > 0) {
        try {
          await prisma.productVariant.deleteMany({ where: { sku: { in: skusToDelete } } });
        } catch (e) {
          return res.status(400).json({ message: 'Không thể xoá biến thể vì đã phát sinh đơn hàng liên quan.' });
        }
      }

      for (const v of variants) {
        const existing = existingVariants.find(ev => ev.sku === v.sku);
        if (existing) {
          await prisma.productVariant.update({
            where: { id: existing.id },
            data: {
              price: Number(v.price),
              salePrice: v.salePrice ? Number(v.salePrice) : null,
              stock: Number(v.stock || 0),
              attributes: v.attributes || {},
              colorCode: v.colorCode || null,
              image: v.image || null
            }
          });
        } else {
          // Check SKU globally
          const conflict = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
          if (conflict) {
            return res.status(400).json({ message: `Mã SKU "${v.sku}" đã tồn tại ở sản phẩm khác.` });
          }
          await prisma.productVariant.create({
            data: {
              sku: v.sku,
              price: Number(v.price),
              salePrice: v.salePrice ? Number(v.salePrice) : null,
              stock: Number(v.stock || 0),
              attributes: v.attributes || {},
              colorCode: v.colorCode || null,
              image: v.image || null,
              productId: id
            }
          });
        }
      }

      // Refetch with new variants
      const final = await prisma.product.findUnique({
        where: { id },
        include: { category: true, variants: true }
      });
      return res.json({ message: 'Cập nhật sản phẩm thành công', product: final });
    }

    res.json({ message: 'Cập nhật sản phẩm thành công', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PATCH update single variant stock (for Inventory quick edit)
router.patch('/variants/:variantId', authenticateToken, async (req, res) => {
  try {
    const { stock } = req.body;
    const updated = await prisma.productVariant.update({
      where: { id: getRouteParam(req.params.variantId) },
      data: { stock: Number(stock) }
    });
    res.json({ message: 'Cập nhật tồn kho thành công', variant: updated });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE product (cascades to variants)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: getRouteParam(req.params.id) } });
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
