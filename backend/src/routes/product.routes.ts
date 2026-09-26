import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';

import multer from 'multer';
import { parseExcelPreview, processImport } from '../services/import.service';

import { extractFiltersFromProducts, normalizeKey, extractAdminFiltersFromProducts } from '../services/filter.service';

const router = express.Router();
const prisma = new PrismaClient();

const getBestCampaign = (product: any, activeCampaigns: any[]) => {
  const matching = activeCampaigns.filter(c => 
    (c.appliesTo === 'product' && c.targetIds.includes(product.id)) ||
    (c.appliesTo === 'category' && c.targetIds.includes(product.categoryId || '')) ||
    (c.appliesTo === 'all')
  );
  if (matching.length === 0) return null;

  const getPriority = (appliesTo: string) => appliesTo === 'product' ? 3 : appliesTo === 'category' ? 2 : 1;
  
  matching.sort((a, b) => {
    const pA = getPriority(a.appliesTo);
    const pB = getPriority(b.appliesTo);
    if (pA !== pB) return pB - pA;
    
    let price = 0;
    if (product.variants && product.variants.length > 0) {
      price = product.variants[0].price;
    } else if (product.price) {
      price = product.price;
    }
    
    const getDiscountAmount = (camp: any, originalPrice: number) => {
      if (camp.discountType === 'percentage') return (originalPrice * camp.discountValue) / 100;
      return camp.discountValue;
    };
    
    return getDiscountAmount(b, price) - getDiscountAmount(a, price);
  });
  
  return matching[0];
};

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
      const campaign = getBestCampaign(product, activeCampaigns);

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

function getVariantAttrMap(attributes: unknown): Record<string, string> {
  const map: Record<string, string> = {};
  if (attributes && typeof attributes === 'object' && !Array.isArray(attributes)) {
    for (const [k, v] of Object.entries(attributes as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim()) {
        map[normalizeKey(k)] = v.trim();
      }
    }
  }
  return map;
}

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
        whereClause.category = { slug: { in: ['macbook', 'asus', 'lenovo', 'laptop'] } };
      } else if (catSlug === 'tablet') {
        whereClause.category = { slug: { in: ['ipad', 'samsung-tablet', 'xiaomi-tablet', 'tablet'] } };
      } else if (catSlug === 'watch' || catSlug === 'dong-ho-thong-minh' || catSlug === 'ong-ho-thong-minh') {
        whereClause.category = { slug: { in: ['apple-watch', 'samsung-watch', 'xiaomi-watch', 'dong-ho-thong-minh', 'ong-ho-thong-minh'] } };
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
      } else if (catSlug === 'watch' || catSlug === 'dong-ho-thong-minh' || catSlug === 'ong-ho-thong-minh') {
        whereClause.category = { slug: { in: ['apple-watch', 'samsung-watch', 'xiaomi-watch', 'dong-ho-thong-minh', 'ong-ho-thong-minh'] } };
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
      } else if (catSlug === 'watch' || catSlug === 'dong-ho-thong-minh' || catSlug === 'ong-ho-thong-minh') {
        whereClause.category = { slug: { in: ['apple-watch', 'samsung-watch', 'xiaomi-watch', 'dong-ho-thong-minh', 'ong-ho-thong-minh'] } };
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
      size, connectivity, material,
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
      } else if (catSlug === 'watch' || catSlug === 'dong-ho-thong-minh' || catSlug === 'ong-ho-thong-minh') {
        whereClause.category = { slug: { in: ['apple-watch', 'samsung-watch', 'xiaomi-watch', 'dong-ho-thong-minh', 'ong-ho-thong-minh'] } };
      } else {
        whereClause.category = { slug: catSlug };
      }
    }

    if (brand) {
      whereClause.brand = { equals: brand as string, mode: 'insensitive' };
    }

    let products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        variants: { orderBy: { createdAt: 'asc' } }
      }
    });

    const parseArrayParam = (val: unknown): string[] => {
      if (typeof val !== 'string') return [];
      return val.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    };

    const ramArr = parseArrayParam(ram);
    const storageArr = parseArrayParam(storage);
    const cpuArr = parseArrayParam(cpu);
    const gpuArr = parseArrayParam(gpu);
    const screenArr = parseArrayParam(screenSize);
    const colorArr = parseArrayParam(color);
    const sizeArr = parseArrayParam(size);
    const connArr = parseArrayParam(connectivity);
    const matArr = parseArrayParam(material);
    const hasMinPrice = minPrice !== undefined && minPrice !== '';
    const hasMaxPrice = maxPrice !== undefined && maxPrice !== '';
    const minP = hasMinPrice ? parseInt(minPrice as string, 10) : 0;
    const maxP = hasMaxPrice ? parseInt(maxPrice as string, 10) : Infinity;

    const hasAnyFilter =
      ramArr.length > 0 || storageArr.length > 0 || cpuArr.length > 0 ||
      gpuArr.length > 0 || screenArr.length > 0 || colorArr.length > 0 ||
      sizeArr.length > 0 || connArr.length > 0 || matArr.length > 0 ||
      hasMinPrice || hasMaxPrice;

    if (hasAnyFilter) {
      products = products.filter(p => {
        // 1. Check Product Specifications (RAM, CPU, GPU, Screen Size, Specs Storage)
        const specs: Record<string, string> = {};
        if (Array.isArray(p.specifications)) {
          for (const s of (p.specifications as any[])) {
            if (s && s.key && typeof s.value === 'string' && s.value.trim()) {
              specs[normalizeKey(s.key).toLowerCase()] = s.value.trim().toLowerCase();
            }
          }
        }

        // RAM - extract short value for matching
        if (ramArr.length > 0) {
          const rawRam = specs['ram'] || '';
          const ramMatch = rawRam.match(/(\d+)\s*GB/i);
          const shortRam = ramMatch ? ramMatch[1] + 'GB' : rawRam.trim();
          if (!ramArr.includes(shortRam) && !ramArr.includes(rawRam)) return false;
        }
        
        // CPU/Chip - extract short value for matching
        if (cpuArr.length > 0) {
          const rawCpu = specs['cpu'] || '';
          let shortCpu = rawCpu;
          const aMatch = rawCpu.match(/A(\d+)\s*(Pro|Bionic|Max)?/i);
          if (aMatch) {
            shortCpu = 'A' + aMatch[1];
            if (aMatch[2]) shortCpu += ' ' + aMatch[2].charAt(0).toUpperCase() + aMatch[2].slice(1).toLowerCase();
          }
          const snapMatch = rawCpu.match(/Snapdragon\s+(\d+(?:\s+Gen\s+\d+)?)/i);
          if (snapMatch) shortCpu = 'Snapdragon ' + snapMatch[1];
          const mMatch = rawCpu.match(/M(\d+)\s*(Pro|Max|Ultra)?/i);
          if (mMatch) { shortCpu = 'M' + mMatch[1]; if (mMatch[2]) shortCpu += ' ' + mMatch[2]; }
          
          if (!cpuArr.includes(shortCpu) && !cpuArr.includes(rawCpu)) return false;
        }
        
        // GPU
        if (gpuArr.length > 0 && !gpuArr.includes(specs['gpu'])) return false;
        
        // Screen Size - extract short value for matching
        if (screenArr.length > 0) {
          const rawScreen = specs['screensize'] || specs['screenSize'] || '';
          const sMatch = rawScreen.match(/([\d,.]+)\s*(?:inch|inches|"|″)/i);
          const shortScreen = sMatch ? sMatch[1].replace(',', '.') + '"' : rawScreen;
          if (!screenArr.includes(shortScreen) && !screenArr.includes(rawScreen)) return false;
        }

        // Camera - extract short value for matching
        if (typeof req.query.camera === 'string' && req.query.camera) {
          const cameraArr = req.query.camera.split(',');
          const rawCamera = specs['camera'] || '';
          const camMatches = rawCamera.match(/(\d+)\s*MP/gi);
          let shortCamera = rawCamera;
          if (camMatches && camMatches.length > 0) {
            const mpVals = camMatches.map((m: string) => { const n = m.match(/(\d+)/); return n ? parseInt(n[1]) : 0; });
            shortCamera = Math.max(...mpVals) + 'MP';
          }
          if (!cameraArr.includes(shortCamera) && !cameraArr.includes(rawCamera)) return false;
        }

        // Storage spec match
        const specStorageMatches = storageArr.length > 0 && specs['storage'] && storageArr.includes(specs['storage']);
        const requiresVariantStorage = storageArr.length > 0 && !specStorageMatches;

        // 2. Check Variant-Level Filters with SAME-VARIANT MATCHING
        const hasVariantFilters =
          colorArr.length > 0 || sizeArr.length > 0 ||
          connArr.length > 0 || matArr.length > 0 ||
          requiresVariantStorage || hasMinPrice || hasMaxPrice;

        if (hasVariantFilters) {
          if (!Array.isArray(p.variants) || p.variants.length === 0) {
            return false;
          }

          const hasMatchingVariant = p.variants.some((v: any) => {
            const vPrice = v.salePrice || v.price || 0;
            if (vPrice < minP || vPrice > maxP) return false;

            const vAttrs: Record<string, string> = {};
            if (v.attributes && typeof v.attributes === 'object') {
              for (const [k, val] of Object.entries(v.attributes)) {
                if (val) vAttrs[normalizeKey(k).toLowerCase()] = String(val).trim().toLowerCase();
              }
            }

            if (colorArr.length > 0) {
              const vColor = vAttrs['colors'] || vAttrs['color'] || '';
              if (!vColor || !colorArr.some(c => vColor === c || vColor.startsWith(c) || vColor.includes(c) || c.includes(vColor))) return false;
            }

            if (sizeArr.length > 0) {
              const vSize = vAttrs['sizes'] || vAttrs['size'] || '';
              if (!vSize || !sizeArr.includes(vSize)) return false;
            }

            if (connArr.length > 0) {
              const vConn = vAttrs['connectivities'] || vAttrs['connectivity'] || '';
              if (!vConn || !connArr.includes(vConn)) return false;
            }

            if (matArr.length > 0) {
              const vMat = vAttrs['materials'] || vAttrs['material'] || '';
              if (!vMat || !matArr.includes(vMat)) return false;
            }

            if (requiresVariantStorage) {
              const vStorage = vAttrs['storage'] || '';
              if (!vStorage || !storageArr.includes(vStorage)) return false;
            }

            return true;
          });

          if (!hasMatchingVariant) return false;
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

    // Fetch active campaigns
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    const paginatedProductsWithReviews = paginatedProducts.map(p => {
      const pReviews = _reviews.filter(r => r.productId === p.id);
      const reviewCount = pReviews.length;
      const ratingAverage = reviewCount > 0 
        ? Number((pReviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1))
        : 0;
      const campaign = getBestCampaign(p, activeCampaigns);
      return { ...p, ratingAverage, reviewCount, activeCampaign: campaign || null };
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

    const campaign = getBestCampaign(product, activeCampaigns);

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

// Helper to normalize variant attributes
function normalizeVariantAttributes(attrs: any): Record<string, string> {
  if (!attrs || typeof attrs !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (k && v !== undefined && v !== null) {
      const trimmedKey = k.trim();
      const trimmedVal = String(v).trim();
      if (trimmedKey && trimmedVal) {
        result[trimmedKey] = trimmedVal;
      }
    }
  }
  return result;
}

// POST create product with variants
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, brand, image, images, categoryId, status, variants, specifications } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });
    }

    // Validate variants
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ message: 'Sản phẩm cần ít nhất 1 biến thể' });
    }

    // Validate category & brand consistency if applicable
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (category && brand) {
        const catSlug = category.slug.toLowerCase();
        const brandLower = brand.trim().toLowerCase();
        if (catSlug === 'apple-watch' && brandLower !== 'apple') {
          return res.status(400).json({ message: 'Sản phẩm thuộc danh mục Apple Watch phải có thương hiệu Apple' });
        } else if (catSlug === 'samsung-watch' && brandLower !== 'samsung') {
          return res.status(400).json({ message: 'Sản phẩm thuộc danh mục Samsung Watch phải có thương hiệu Samsung' });
        } else if (catSlug === 'xiaomi-watch' && brandLower !== 'xiaomi') {
          return res.status(400).json({ message: 'Sản phẩm thuộc danh mục Xiaomi Watch phải có thương hiệu Xiaomi' });
        }
      }
    }

    // Validate variant fields and check SKU uniqueness in payload
    const payloadSkus = new Set<string>();
    for (const v of variants) {
      if (!v.sku || !String(v.sku).trim()) {
        return res.status(400).json({ message: 'Mã SKU không được để trống' });
      }
      const trimmedSku = String(v.sku).trim();
      if (payloadSkus.has(trimmedSku)) {
        return res.status(400).json({ message: `Mã SKU "${trimmedSku}" bị trùng lặp trong danh sách biến thể` });
      }
      payloadSkus.add(trimmedSku);

      const price = Number(v.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ message: `Giá bán của SKU "${trimmedSku}" không hợp lệ` });
      }

      if (v.salePrice !== undefined && v.salePrice !== null && v.salePrice !== '') {
        const salePrice = Number(v.salePrice);
        if (isNaN(salePrice) || salePrice < 0) {
          return res.status(400).json({ message: `Giá khuyến mãi của SKU "${trimmedSku}" không hợp lệ` });
        }
        if (salePrice > price) {
          return res.status(400).json({ message: `Giá khuyến mãi của SKU "${trimmedSku}" không được lớn hơn giá bán` });
        }
      }

      const stock = parseInt(v.stock, 10);
      if (isNaN(stock) || stock < 0) {
        return res.status(400).json({ message: `Tồn kho của SKU "${trimmedSku}" phải là số không âm` });
      }

      // Check global SKU uniqueness in DB
      const existing = await prisma.productVariant.findUnique({ where: { sku: trimmedSku } });
      if (existing) {
        return res.status(400).json({ message: `Mã SKU "${trimmedSku}" đã tồn tại trên hệ thống` });
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        brand: brand ? String(brand).trim() : null,
        image: image || null,
        images: Array.isArray(images) ? images.filter(Boolean) : [],
        categoryId: categoryId || null,
        status: status || 'active',
        specifications: specifications || null,
        variants: {
          create: variants.map((v: any) => ({
            sku: String(v.sku).trim(),
            price: Number(v.price),
            salePrice: v.salePrice !== undefined && v.salePrice !== null && v.salePrice !== '' ? Number(v.salePrice) : null,
            stock: Math.max(0, parseInt(v.stock, 10) || 0),
            attributes: normalizeVariantAttributes(v.attributes),
            colorCode: v.colorCode ? String(v.colorCode).trim() : null,
            image: v.image || null
          }))
        }
      },
      include: { category: true, variants: true }
    });

    res.status(201).json({ message: 'Thêm sản phẩm thành công', product: newProduct });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Lỗi server: ' + (error.message || '') });
  }
});

// PUT update product (safe variant diff, reference check, and transaction)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    const { name, description, brand, image, images, categoryId, status, variants, specifications } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Validate category & brand consistency if applicable
    const targetCategoryId = categoryId !== undefined ? categoryId : existingProduct.categoryId;
    const targetBrand = brand !== undefined ? brand : existingProduct.brand;
    if (targetCategoryId) {
      const category = await prisma.category.findUnique({ where: { id: targetCategoryId } });
      if (category && targetBrand) {
        const catSlug = category.slug.toLowerCase();
        const brandLower = String(targetBrand).trim().toLowerCase();
        if (catSlug === 'apple-watch' && brandLower !== 'apple') {
          return res.status(400).json({ message: 'Sản phẩm thuộc danh mục Apple Watch phải có thương hiệu Apple' });
        } else if (catSlug === 'samsung-watch' && brandLower !== 'samsung') {
          return res.status(400).json({ message: 'Sản phẩm thuộc danh mục Samsung Watch phải có thương hiệu Samsung' });
        } else if (catSlug === 'xiaomi-watch' && brandLower !== 'xiaomi') {
          return res.status(400).json({ message: 'Sản phẩm thuộc danh mục Xiaomi Watch phải có thương hiệu Xiaomi' });
        }
      }
    }

    // Prepare product info update payload
    const productData: any = {};
    if (name !== undefined) productData.name = String(name).trim();
    if (description !== undefined) productData.description = description ? String(description).trim() : null;
    if (brand !== undefined) productData.brand = brand ? String(brand).trim() : null;
    if (image !== undefined) productData.image = image || null;
    if (images !== undefined) productData.images = Array.isArray(images) ? images.filter(Boolean) : [];
    if (categoryId !== undefined) productData.categoryId = categoryId || null;
    if (status !== undefined) productData.status = status;
    if (specifications !== undefined) productData.specifications = specifications;

    // If variants are not provided, only update product basic info
    if (!variants || !Array.isArray(variants)) {
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: productData,
        include: { category: true, variants: true }
      });
      return res.json({ message: 'Cập nhật sản phẩm thành công', product: updatedProduct });
    }

    if (variants.length === 0) {
      return res.status(400).json({ message: 'Sản phẩm cần ít nhất 1 biến thể' });
    }

    // Validate incoming variants & uniqueness
    const payloadSkus = new Set<string>();
    const incomingVariantIds = new Set<string>();

    for (const v of variants) {
      if (!v.sku || !String(v.sku).trim()) {
        return res.status(400).json({ message: 'Mã SKU không được để trống' });
      }
      const trimmedSku = String(v.sku).trim();
      if (payloadSkus.has(trimmedSku)) {
        return res.status(400).json({ message: `Mã SKU "${trimmedSku}" bị trùng lặp trong danh sách biến thể` });
      }
      payloadSkus.add(trimmedSku);

      const price = Number(v.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ message: `Giá bán của SKU "${trimmedSku}" không hợp lệ` });
      }

      if (v.salePrice !== undefined && v.salePrice !== null && v.salePrice !== '') {
        const salePrice = Number(v.salePrice);
        if (isNaN(salePrice) || salePrice < 0) {
          return res.status(400).json({ message: `Giá khuyến mãi của SKU "${trimmedSku}" không hợp lệ` });
        }
        if (salePrice > price) {
          return res.status(400).json({ message: `Giá khuyến mãi của SKU "${trimmedSku}" không được lớn hơn giá bán` });
        }
      }

      const stock = parseInt(v.stock, 10);
      if (isNaN(stock) || stock < 0) {
        return res.status(400).json({ message: `Tồn kho của SKU "${trimmedSku}" phải là số không âm` });
      }

      if (v.id) {
        const belongsToProduct = existingProduct.variants.some(ev => ev.id === v.id);
        if (!belongsToProduct) {
          return res.status(400).json({ message: `Biến thể ID "${v.id}" không thuộc sản phẩm này.` });
        }
        incomingVariantIds.add(v.id);

        // Check if SKU changed and conflicts with another variant in DB
        const conflict = await prisma.productVariant.findFirst({
          where: { sku: trimmedSku, id: { not: v.id } }
        });
        if (conflict) {
          return res.status(400).json({ message: `Mã SKU "${trimmedSku}" đã tồn tại ở sản phẩm khác.` });
        }
      } else {
        // New variant - check global SKU
        const conflict = await prisma.productVariant.findUnique({ where: { sku: trimmedSku } });
        if (conflict) {
          return res.status(400).json({ message: `Mã SKU "${trimmedSku}" đã tồn tại trên hệ thống.` });
        }
      }
    }

    // Determine removed variants
    const removedVariants = existingProduct.variants.filter(ev => !incomingVariantIds.has(ev.id));

    // Check OrderItem references for all removed variants
    for (const removedVar of removedVariants) {
      const refCount = await prisma.orderItem.count({
        where: { variantId: removedVar.id }
      });
      if (refCount > 0) {
        return res.status(409).json({
          message: `Không thể xóa biến thể (SKU: ${removedVar.sku}) đã phát sinh trong đơn hàng.`
        });
      }
    }

    // Execute atomic transaction for safe variant diff
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Product basic fields
      await tx.product.update({
        where: { id },
        data: productData
      });

      // 2. Delete safe unreferenced removed variants
      for (const removedVar of removedVariants) {
        await tx.productVariant.delete({
          where: { id: removedVar.id }
        });
      }

      // 3. Update existing variants by id
      for (const v of variants) {
        const trimmedSku = String(v.sku).trim();
        const salePriceVal = v.salePrice !== undefined && v.salePrice !== null && v.salePrice !== '' ? Number(v.salePrice) : null;
        const normalizedAttrs = normalizeVariantAttributes(v.attributes);
        const colorCodeVal = v.colorCode ? String(v.colorCode).trim() : null;

        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              sku: trimmedSku,
              price: Number(v.price),
              salePrice: salePriceVal,
              stock: Math.max(0, parseInt(v.stock, 10) || 0),
              attributes: normalizedAttrs,
              colorCode: colorCodeVal,
              image: v.image || null
            }
          });
        } else {
          // 4. Create new variant
          await tx.productVariant.create({
            data: {
              productId: id,
              sku: trimmedSku,
              price: Number(v.price),
              salePrice: salePriceVal,
              stock: Math.max(0, parseInt(v.stock, 10) || 0),
              attributes: normalizedAttrs,
              colorCode: colorCodeVal,
              image: v.image || null
            }
          });
        }
      }

      // 5. Return updated product with all variants
      return await tx.product.findUnique({
        where: { id },
        include: { category: true, variants: true }
      });
    });

    res.json({ message: 'Cập nhật sản phẩm thành công', product: result });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Lỗi server: ' + (error.message || '') });
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
