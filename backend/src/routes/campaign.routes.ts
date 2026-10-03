import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();
const prisma = new PrismaClient();

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

// Helper: resolve full image URL from product/variant
function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return url; // frontend will prepend API_URL
  return url;
}

// Helper: get display price for a product (from variant or fallback)
function getProductPrice(product: any, variantId?: string | null): number {
  if (variantId && product.variants) {
    const v = product.variants.find((v: any) => v.id === variantId);
    if (v) return v.salePrice || v.price || 0;
  }
  // Use cheapest variant
  if (product.variants && product.variants.length > 0) {
    const prices = product.variants.map((v: any) => v.salePrice || v.price || 0).filter((p: number) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }
  return 0;
}

// ============================================================
// MARKETING TAGS
// ============================================================

// GET /api/campaigns/tags — public
router.get('/tags', async (req, res) => {
  try {
    const tags = await prisma.marketingTag.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(tags);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/campaigns/tags — admin
router.post('/tags', authenticateToken, async (req, res) => {
  try {
    const { name, color, sortOrder } = req.body;
    if (!name) return res.status(400).json({ message: 'Tên tag không được bỏ trống' });
    const tag = await prisma.marketingTag.create({
      data: { name: name.trim().toUpperCase(), color, sortOrder: sortOrder || 0 },
    });
    res.status(201).json(tag);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Tag đã tồn tại' });
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/campaigns/tags/:tagId — admin
router.delete('/tags/:tagId', authenticateToken, async (req, res) => {
  try {
    await prisma.marketingTag.delete({ where: { id: getRouteParam(req.params.tagId) } });
    res.json({ message: 'Đã xóa tag' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ============================================================
// CAMPAIGNS — CRUD (giữ nguyên logic cũ, thêm include bannerProducts)
// ============================================================

// GET /api/campaigns — all campaigns (admin)
router.get('/', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        bannerProducts: {
          include: {
            product: { select: { id: true, name: true, image: true, images: true, brand: true } },
            variant: { select: { id: true, price: true, salePrice: true, image: true, attributes: true } },
            tags: { include: { tag: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/campaigns/active/:categorySlug — public, dùng cho Banner frontend
router.get('/active/:categorySlug', async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const now = new Date();

    // Lấy campaign active có sản phẩm banner thuộc category này
    const campaign = await prisma.campaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        bannerProducts: {
          some: { categorySlug },
        },
      },
      orderBy: { startDate: 'desc' }, // Lấy campaign mới nhất nếu có nhiều
      include: {
        bannerProducts: {
          where: { categorySlug },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                images: true,
                brand: true,
                variants: {
                  select: { id: true, price: true, salePrice: true, image: true, attributes: true, colorCode: true },
                  take: 5,
                },
              },
            },
            variant: {
              select: { id: true, price: true, salePrice: true, image: true, attributes: true },
            },
            tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
          },
          orderBy: { sortOrder: 'asc' },
          take: 4,
        },
      },
    });

    if (!campaign) {
      return res.json({ campaign: null, products: [] });
    }

    // Shape data for frontend consumption
    const products = campaign.bannerProducts.map((bp) => {
      const originalPrice = getProductPrice(bp.product, bp.variantId);
      const discountAmount = Math.round(originalPrice * bp.discountPercent / 100);
      const salePrice = originalPrice - discountAmount;

      // Pick best image: variant image > product.image > product.images[0]
      const imageUrl =
        bp.variant?.image ||
        bp.product.image ||
        (bp.product.images && bp.product.images.length > 0 ? bp.product.images[0] : null);

      return {
        id: bp.id,
        productId: bp.product.id,
        productName: bp.product.name,
        brand: bp.product.brand,
        image: imageUrl,
        bannerImage: bp.bannerImage,
        variantId: bp.variantId,
        categorySlug: bp.categorySlug,
        originalPrice,
        discountPercent: bp.discountPercent,
        discountAmount,
        salePrice,
        sortOrder: bp.sortOrder,
        tags: bp.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
      };
    });

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      products,
    });
  } catch (error) {
    console.error('Error fetching active campaign:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/campaigns/:id — single campaign (admin)
router.get('/:id', async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: getRouteParam(req.params.id) },
      include: {
        bannerProducts: {
          include: {
            product: {
              select: {
                id: true, name: true, image: true, images: true, brand: true,
                variants: { select: { id: true, price: true, salePrice: true, image: true, attributes: true }, take: 5 },
              },
            },
            variant: { select: { id: true, price: true, salePrice: true, image: true, attributes: true } },
            tags: { include: { tag: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!campaign) return res.status(404).json({ message: 'Không tìm thấy chiến dịch' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/campaigns — create campaign
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, discountType, discountValue, startDate, endDate, isActive, appliesTo, targetIds, bannerUrl } = req.body;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        discountType: discountType || 'percentage',
        discountValue: Number(discountValue) || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== false,
        appliesTo: appliesTo || 'all',
        targetIds: targetIds || [],
        bannerUrl,
      },
    });

    res.status(201).json({ message: 'Tạo chiến dịch thành công', campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/campaigns/:id — update campaign
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, discountType, discountValue, startDate, endDate, isActive, appliesTo, targetIds, bannerUrl } = req.body;

    const campaign = await prisma.campaign.update({
      where: { id: getRouteParam(req.params.id) },
      data: {
        name,
        description,
        discountType,
        discountValue: discountValue !== undefined ? Number(discountValue) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        appliesTo,
        targetIds,
        bannerUrl,
      },
    });

    res.json({ message: 'Cập nhật chiến dịch thành công', campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/campaigns/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.campaign.delete({ where: { id: getRouteParam(req.params.id) } });
    res.json({ message: 'Xóa chiến dịch thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ============================================================
// BANNER CAMPAIGN PRODUCTS — CRUD
// ============================================================

// GET /api/campaigns/:id/banner-products — list banner products for a campaign
router.get('/:id/banner-products', authenticateToken, async (req, res) => {
  try {
    const { categorySlug } = req.query;
    const where: any = { campaignId: getRouteParam(req.params.id) };
    if (categorySlug) where.categorySlug = categorySlug as string;

    const items = await prisma.bannerCampaignProduct.findMany({
      where,
      include: {
        product: {
          select: {
            id: true, name: true, image: true, images: true, brand: true,
            variants: { select: { id: true, price: true, salePrice: true, image: true, attributes: true, sku: true } },
          },
        },
        variant: { select: { id: true, price: true, salePrice: true, image: true, sku: true, attributes: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/campaigns/:id/banner-products — add a product to campaign banner
router.post('/:id/banner-products', authenticateToken, async (req, res) => {
  try {
    const campaignId = getRouteParam(req.params.id);
    const { productId, variantId, categorySlug, discountPercent, tagIds, sortOrder, bannerImage } = req.body;

    // VALIDATION
    if (!productId) return res.status(400).json({ message: 'productId không được bỏ trống' });
    if (!categorySlug) return res.status(400).json({ message: 'categorySlug không được bỏ trống' });
    if (!bannerImage) return res.status(400).json({ message: 'bannerImage không được bỏ trống' });

    const discount = Number(discountPercent) || 0;
    if (discount < 0) return res.status(400).json({ message: 'discountPercent không được âm' });
    if (discount > 100) return res.status(400).json({ message: 'discountPercent không được vượt quá 100' });

    // Kiểm tra campaign tồn tại
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return res.status(404).json({ message: 'Không tìm thấy chiến dịch' });

    // Kiểm tra product tồn tại
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    // Kiểm tra variant (nếu có)
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant) return res.status(404).json({ message: 'Không tìm thấy biến thể sản phẩm' });
    }

    // Giới hạn tối đa 4 sản phẩm mỗi category
    const existingCount = await prisma.bannerCampaignProduct.count({
      where: { campaignId, categorySlug },
    });
    if (existingCount >= 4) {
      return res.status(422).json({ message: 'Đã đạt tối đa 4 sản phẩm cho danh mục này' });
    }

    // Kiểm tra duplicate (product trong cùng campaign + category)
    const duplicate = await prisma.bannerCampaignProduct.findUnique({
      where: { campaignId_productId_categorySlug: { campaignId, productId, categorySlug } },
    });
    if (duplicate) {
      return res.status(409).json({ message: 'Sản phẩm đã tồn tại trong chiến dịch này' });
    }

    // Auto sort order = current max + 1
    const maxSortOrder = await prisma.bannerCampaignProduct.aggregate({
      where: { campaignId, categorySlug },
      _max: { sortOrder: true },
    });

    const newItem = await prisma.bannerCampaignProduct.create({
      data: {
        campaignId,
        productId,
        variantId: variantId || null,
        categorySlug,
        bannerImage,
        discountPercent: discount,
        sortOrder: sortOrder ?? ((maxSortOrder._max.sortOrder ?? -1) + 1),
        tags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map((tagId: string) => ({ tagId })),
        } : undefined,
      },
      include: {
        product: { select: { id: true, name: true, image: true, images: true, brand: true, variants: { select: { id: true, price: true, salePrice: true } } } },
        variant: { select: { id: true, price: true, salePrice: true } },
        tags: { include: { tag: true } },
      },
    });

    res.status(201).json({ message: 'Thêm sản phẩm thành công', item: newItem });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Sản phẩm đã tồn tại trong chiến dịch này' });
    console.error('Error adding banner product:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/campaigns/:id/banner-products/:bpId — update discount/tags/sortOrder
router.put('/:id/banner-products/:bpId', authenticateToken, async (req, res) => {
  try {
    const bpId = getRouteParam(req.params.bpId);
    const { discountPercent, tagIds, sortOrder, variantId, bannerImage } = req.body;

    const discount = discountPercent !== undefined ? Number(discountPercent) : undefined;
    if (discount !== undefined && (discount < 0 || discount > 100)) {
      return res.status(400).json({ message: 'discountPercent phải từ 0 đến 100' });
    }

    // Update tags: delete all then recreate
    if (tagIds !== undefined) {
      await prisma.bannerCampaignProductTag.deleteMany({ where: { bannerCampaignProductId: bpId } });
    }

    const updated = await prisma.bannerCampaignProduct.update({
      where: { id: bpId },
      data: {
        discountPercent: discount,
        bannerImage: bannerImage !== undefined ? bannerImage : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
        variantId: variantId !== undefined ? (variantId || null) : undefined,
        tags: tagIds !== undefined ? {
          create: tagIds.map((tagId: string) => ({ tagId })),
        } : undefined,
        updatedAt: new Date(),
      },
      include: {
        product: { select: { id: true, name: true, image: true, images: true, brand: true, variants: { select: { id: true, price: true, salePrice: true } } } },
        variant: { select: { id: true, price: true, salePrice: true } },
        tags: { include: { tag: true } },
      },
    });

    res.json({ message: 'Cập nhật thành công', item: updated });
  } catch (error) {
    console.error('Error updating banner product:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/campaigns/:id/banner-products/:bpId
router.delete('/:id/banner-products/:bpId', authenticateToken, async (req, res) => {
  try {
    await prisma.bannerCampaignProduct.delete({ where: { id: getRouteParam(req.params.bpId) } });
    res.json({ message: 'Đã xóa sản phẩm khỏi chiến dịch' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
