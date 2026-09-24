import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';

import multer from 'multer';
import { parseExcelPreview, processImport } from '../services/import.service';

import { extractFiltersFromProducts, normalizeKey, extractAdminFiltersFromProducts } from '../services/filter.service';

const router = express.Router();
const prisma = new PrismaClient();

const uploadMemory = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


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

    const productIds = products.map(p => p.id);
    const _reviews = await prisma.review.findMany({
      where: { productId: { in: productIds }, status: 'APPROVED' },
      select: { productId: true, rating: true }
    });

    // Attach campaign and reviews to products
    const productsWithData = products.map((product) => {
      // Find a campaign that applies to this product
      const campaign = activeCampaigns.find(c => 
        (c.appliesTo === 'product' && c.targetIds.includes(product.id)) ||
        (c.appliesTo === 'category' && c.targetIds.includes(product.categoryId || '')) ||
        (c.appliesTo === 'all')
      );

      const pReviews = _reviews.filter(r => r.productId === product.id);
      const reviewCount = pReviews.length;
      const ratingAverage = reviewCount > 0
        ? Number((pReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : 0;

      return { 
        ...product, 
        activeCampaign: campaign || null,
        reviewCount,
        ratingAverage
      };
    });

    res.json(productsWithData);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /filters - Returns dynamic filter options
router.get('/filters', async (req, res) => {
  try {
    const { category, brand } = req.query;
    let whereClause: any = { status: 'active' };

    if (category) {
      const catSlug = (category as string).toLowerCase();
      if (catSlug === 'phone' || catSlug === 'ien-thoai' || catSlug === 'dien-thoai') {
        whereClause.category = { slug: { in: ['iphone', 'samsung', 'xiaomi', 'oppo', 'ien-thoai', 'dien-thoai', 'phone'] } };
      } else if (catSlug === 'laptop') {
        whereClause.category = { slug: { in: ['macbook', 'asus', 'lenovo'] } };
      } else if (catSlug === 'tablet') {
        whereClause.category = { slug: { in: ['ipad', 'samsung-tablet', 'xiaomi-tablet'] } };
      } else if (catSlug === 'watch') {
        whereClause.category = { slug: { in: ['apple-watch', 'samsung-watch'] } }; // Adjust based on real slugs
      } else {
        whereClause.category = { slug: catSlug };
      }
    }

    if (brand) {
      whereClause.brand = { equals: brand as string, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        variants: true
      }
    });

    const filters = extractFiltersFromProducts(products);
    res.json(filters);
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ==========================================
// ADMIN ENDPOINTS (Phase 1)
// ==========================================

// GET /admin/filters - Extract dynamic filters for admin
router.get('/admin/filters', authenticateToken, async (req, res) => {
  try {
    const { category, brand } = req.query;
    let whereClause: any = {};

    if (category) {
      const catSlug = (category as string).toLowerCase();
      if (catSlug === 'phone' || catSlug === 'ien-thoai' || catSlug === 'dien-thoai') {
        whereClause.category = { slug: { in: ['iphone', 'samsung', 'xiaomi', 'oppo', 'ien-thoai', 'dien-thoai', 'phone'] } };
      } else if (catSlug === 'laptop') {
        whereClause.category = { slug: { in: ['macbook', 'asus', 'lenovo', 'laptop'] } };
      } else if (catSlug === 'tablet') {
        whereClause.category = { slug: { in: ['ipad', 'samsung-tablet', 'xiaomi-tablet', 'tablet'] } };
      } else if (catSlug === 'watch') {
        whereClause.category = { slug: { in: ['apple-watch', 'samsung-watch', 'dong-ho-thong-minh'] } };
      } else {
        whereClause.category = { slug: catSlug };
      }
    }

    if (brand) {
      whereClause.brand = { equals: brand as string, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { variants: true }
    });

    const filters = extractAdminFiltersFromProducts(products);
    res.json(filters);
  } catch (error) {
    console.error('Error fetching admin filters:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /admin/search - Admin Search & Filter with Pagination
router.get('/admin/search', authenticateToken, async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search, 
      category, 
      brand, 
      status,
      stock, // "in_stock", "low_stock", "out_of_stock"
      sort,  // "newest", "price_asc", "price_desc", "name_asc", "name_desc"
      ...dynamicFilters 
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    
    let whereClause: any = {};

    if (status) {
      whereClause.status = status as string;
    }
    
    if (brand) {
      whereClause.brand = { equals: brand as string, mode: 'insensitive' };
    }
    
    if (category) {
      const catSlug = (category as string).toLowerCase();
      if (catSlug === 'phone' || catSlug === 'ien-thoai' || catSlug === 'dien-thoai') {
        whereClause.category = { slug: { in: ['iphone', 'samsung', 'xiaomi', 'oppo', 'ien-thoai', 'dien-thoai', 'phone'] } };
      } else if (catSlug === 'laptop') {
        whereClause.category = { slug: { in: ['macbook', 'asus', 'lenovo', 'laptop'] } };
      } else if (catSlug === 'tablet') {
        whereClause.category = { slug: { in: ['ipad', 'samsung-tablet', 'xiaomi-tablet', 'tablet'] } };
      } else if (catSlug === 'watch') {
        whereClause.category = { slug: { in: ['apple-watch', 'samsung-watch', 'dong-ho-thong-minh'] } };
      } else {
        whereClause.category = { slug: catSlug };
      }
    }

    let products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        variants: true
      }
    });

    if (search) {
      const q = (search as string).toLowerCase();
      products = products.filter(p => {
        if (p.name.toLowerCase().includes(q)) return true;
        if (p.brand && p.brand.toLowerCase().includes(q)) return true;
        return p.variants.some(v => v.sku.toLowerCase().includes(q));
      });
    }

    const dynamicKeys = Object.keys(dynamicFilters).filter(k => k.startsWith('spec_') || k.startsWith('attr_'));
    
    if (dynamicKeys.length > 0) {
      products = products.filter(p => {
        const specsMap: Record<string, string> = {};
        if (Array.isArray(p.specifications)) {
          for (const s of (p.specifications as any[])) {
            if (s.key && s.value) specsMap[normalizeKey(s.key)] = (s.value as string).trim();
          }
        }
        
        const attrsMap: Record<string, Set<string>> = {};
        for (const v of p.variants) {
          if (v.attributes && typeof v.attributes === 'object') {
            for (const [k, val] of Object.entries(v.attributes)) {
               const normKey = normalizeKey(k);
               if (!attrsMap[normKey]) attrsMap[normKey] = new Set();
               attrsMap[normKey].add((val as string).trim());
            }
          }
        }

        for (const k of dynamicKeys) {
          const filterValueStr = String(dynamicFilters[k]);
          const filterValues = filterValueStr.split(',');

          if (k.startsWith('spec_')) {
            const specKey = normalizeKey(k.replace('spec_', ''));
            const pVal = specsMap[specKey];
            if (!pVal || !filterValues.includes(pVal)) return false;
          } else if (k.startsWith('attr_')) {
            const attrKey = normalizeKey(k.replace('attr_', ''));
            const pSet = attrsMap[attrKey];
            if (!pSet || ![...pSet].some(val => filterValues.includes(val))) return false;
          }
        }
        return true;
      });
    }

    if (stock) {
      products = products.filter(p => {
        const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
        if (stock === 'in_stock') return totalStock > 10;
        if (stock === 'low_stock') return totalStock > 0 && totalStock <= 10;
        if (stock === 'out_of_stock') return totalStock === 0;
        return true;
      });
    }

    const productsWithPrice = products.map(p => {
      let minEffective = Infinity;
      for (const v of p.variants) {
        const pVal = v.salePrice || v.price;
        if (pVal < minEffective) minEffective = pVal;
      }
      if (minEffective === Infinity) minEffective = 0;
      return { ...p, effectivePrice: minEffective };
    });

    if (sort === 'price_asc') {
      productsWithPrice.sort((a, b) => a.effectivePrice - b.effectivePrice);
    } else if (sort === 'price_desc') {
      productsWithPrice.sort((a, b) => b.effectivePrice - a.effectivePrice);
    } else if (sort === 'name_asc') {
      productsWithPrice.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name_desc') {
      productsWithPrice.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      productsWithPrice.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = productsWithPrice.length;
    const totalPages = Math.ceil(total / limitNumber);
    const skipItems = (pageNumber - 1) * limitNumber;
    const paginatedData = productsWithPrice.slice(skipItems, skipItems + limitNumber);

    res.json({
      data: paginatedData,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error in admin search:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});


// POST /import/preview - Preview Excel Import
router.post('/import/preview', authenticateToken, uploadMemory.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không tìm thấy file tải lên.' });
    }
    const result = await parseExcelPreview(req.file.buffer);
    res.json(result);
  } catch (error: any) {
    console.error('Import preview error:', error);
    res.status(500).json({ message: 'Lỗi khi đọc file Excel: ' + error.message });
  }
});

// POST /import/confirm - Confirm Excel Import
router.post('/import/confirm', authenticateToken, async (req, res) => {
  try {
    const { groupedProducts } = req.body;
    if (!groupedProducts || !Array.isArray(groupedProducts)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
    }
    
    const result = await processImport(groupedProducts);
    res.json(result);
  } catch (error: any) {
    console.error('Import confirm error:', error);
    res.status(500).json({ message: 'Lỗi khi import dữ liệu: ' + error.message });
  }
});

// POST /admin/bulk-action - Admin Bulk Actions
router.post('/admin/bulk-action', authenticateToken, async (req, res) => {
  try {
    const { action, productIds } = req.body;
    if (!action || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    if (action === 'activate') {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { status: 'active' }
      });
    } else if (action === 'deactivate') {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { status: 'inactive' }
      });
    } else if (action === 'delete') {
      try {
        await prisma.product.deleteMany({
          where: { id: { in: productIds } }
        });
      } catch (err: any) {
        if (err.code === 'P2003') {
          return res.status(400).json({ message: 'Không thể xóa sản phẩm vì đã có đơn hàng liên kết. Vui lòng "Ẩn" sản phẩm thay vì xóa.' });
        }
        throw err;
      }
    } else {
      return res.status(400).json({ message: 'Unknown action' });
    }

    res.json({ success: true, message: `Thực hiện ${action} thành công cho ${productIds.length} sản phẩm.` });
  } catch (error) {
    console.error('Error in bulk action:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /search - Search and filter products
router.get('/search', async (req, res) => {
  try {
    const { 
      category, brand, minPrice, maxPrice, 
      ram, storage, cpu, gpu, screenSize, color, 
      sort, page = '1', limit = '12' 
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    let whereClause: any = { status: 'active' };

    if (category) {
      const catSlug = (category as string).toLowerCase();
      if (catSlug === 'phone' || catSlug === 'ien-thoai' || catSlug === 'dien-thoai') {
        whereClause.category = { slug: { in: ['iphone', 'samsung', 'xiaomi', 'oppo', 'ien-thoai', 'dien-thoai', 'phone'] } };
      } else if (catSlug === 'laptop') {
        whereClause.category = { slug: { in: ['macbook', 'asus', 'lenovo', 'laptop'] } };
      } else if (catSlug === 'tablet') {
        whereClause.category = { slug: { in: ['ipad', 'samsung-tablet', 'xiaomi-tablet', 'tablet'] } };
      } else if (catSlug === 'watch') {
        whereClause.category = { slug: { in: ['apple-watch', 'samsung-watch', 'dong-ho-thong-minh'] } };
      } else {
        whereClause.category = { slug: catSlug };
      }
    }

    if (brand) {
      whereClause.brand = { equals: brand as string, mode: 'insensitive' };
    }

    // For simplicity, we'll fetch products matching basic criteria 
    // and then filter in-memory if Prisma JSON filtering is too complex.
    // In production, consider using PostgreSQL raw queries for JSON arrays.
    
    let products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        variants: { orderBy: { createdAt: 'asc' } }
      }
    });

    // In-memory filter for specifications and attributes
    if (ram || storage || cpu || gpu || screenSize || color || minPrice || maxPrice) {
      const ramArr = typeof ram === 'string' ? ram.split(',') : [];
      const storageArr = typeof storage === 'string' ? storage.split(',') : [];
      const cpuArr = typeof cpu === 'string' ? cpu.split(',') : [];
      const gpuArr = typeof gpu === 'string' ? gpu.split(',') : [];
      const screenArr = typeof screenSize === 'string' ? screenSize.split(',') : [];
      const colorArr = typeof color === 'string' ? color.split(',') : [];
      const minP = minPrice ? parseInt(minPrice as string) : 0;
      const maxP = maxPrice ? parseInt(maxPrice as string) : Infinity;

      products = products.filter(p => {
        // Build a normalized representation of the product's specs
        const specs: Record<string, string> = {};
        if (Array.isArray(p.specifications)) {
          for (const s of (p.specifications as any[])) {
            if (s && s.key && s.value) {
              specs[normalizeKey(s.key)] = (s.value as string).trim();
            }
          }
        }

        // Build normalized variant attributes
        const varAttrs: Record<string, Set<string>> = { color: new Set(), storage: new Set() };
        let minVariantPrice = Infinity;
        let maxVariantPrice = 0;
        
        if (Array.isArray(p.variants)) {
          for (const v of p.variants) {
            const price = v.salePrice || v.price;
            if (price < minVariantPrice) minVariantPrice = price;
            if (price > maxVariantPrice) maxVariantPrice = price;
            
            if (v.attributes && typeof v.attributes === 'object') {
              for (const [k, val] of Object.entries(v.attributes)) {
                if (val) varAttrs[normalizeKey(k)]?.add((val as string).trim());
              }
            }
          }
        }
        if (minVariantPrice === Infinity) minVariantPrice = 0;

        // Price Filter (Match if product's price range overlaps or is within requested range)
        if (minVariantPrice > maxP || maxVariantPrice < minP) return false;

        // RAM
        if (ramArr.length > 0 && !ramArr.includes(specs['ram'])) return false;
        
        // CPU
        if (cpuArr.length > 0 && !cpuArr.includes(specs['cpu'])) return false;
        
        // GPU
        if (gpuArr.length > 0 && !gpuArr.includes(specs['gpu'])) return false;
        
        // Screen Size
        if (screenArr.length > 0 && !screenArr.includes(specs['screensize'])) return false;

        // Storage (Could be in specs or variant attributes)
        if (storageArr.length > 0) {
          const specStorage = specs['storage'];
          const hasVariantStorage = Array.from(varAttrs['storage']).some(s => storageArr.includes(s));
          if (!storageArr.includes(specStorage) && !hasVariantStorage) return false;
        }

        // Color (Variant attributes)
        if (colorArr.length > 0) {
          const hasColor = Array.from(varAttrs['color']).some(c => colorArr.includes(c));
          if (!hasColor) return false;
        }

        return true;
      });
    }

    // Sorting
    if (sort === 'price_asc') {
      products.sort((a, b) => {
        const pA = a.variants?.[0]?.salePrice || a.variants?.[0]?.price || 0;
        const pB = b.variants?.[0]?.salePrice || b.variants?.[0]?.price || 0;
        return pA - pB;
      });
    } else if (sort === 'price_desc') {
      products.sort((a, b) => {
        const pA = a.variants?.[0]?.salePrice || a.variants?.[0]?.price || 0;
        const pB = b.variants?.[0]?.salePrice || b.variants?.[0]?.price || 0;
        return pB - pA;
      });
    } else if (sort === 'newest') {
      products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = products.length;
    const paginatedProducts = products.slice(skip, skip + limitNumber);

    // Fetch review aggregates for the paginated products
    const productIds = paginatedProducts.map(p => p.id);
    const _reviews = await prisma.review.findMany({
      where: { productId: { in: productIds }, status: 'APPROVED' },
      select: { productId: true, rating: true }
    });

    const paginatedProductsWithReviews = paginatedProducts.map(p => {
      const pReviews = _reviews.filter(r => r.productId === p.id);
      const reviewCount = pReviews.length;
      const ratingAverage = reviewCount > 0 
        ? Number((pReviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1))
        : 0;
      return { ...p, ratingAverage, reviewCount };
    });

    res.json({
      data: paginatedProductsWithReviews,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    });
  } catch (error) {
    console.error('Error in search:', error);
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

    // Calculate rating summary
    const _reviews = await prisma.review.findMany({
      where: { productId: product.id, status: 'APPROVED' },
      select: { rating: true }
    });
    const reviewCount = _reviews.length;
    const ratingAverage = reviewCount > 0 
      ? Number((_reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1))
      : 0;

    res.json({ 
      ...product, 
      activeCampaign: campaign || null,
      ratingAverage,
      reviewCount
    });
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
