import * as xlsx from 'xlsx';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { downloadAndProcessImage } from '../utils/image-downloader';

const prisma = new PrismaClient();
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'products');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const parseSpecificationJSON = (rawValue: any, productName: string): { specs: any[], error: string | null } => {
  if (!rawValue) return { specs: [], error: null };
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(String(rawValue).trim()) : rawValue;
    if (!Array.isArray(parsed)) {
      return { specs: [], error: `Sản phẩm [${productName}]: Specification JSON không phải là một Array hợp lệ.` };
    }
    
    const finalSpecs = [];
    for (let i = 0; i < parsed.length; i++) {
      const group = parsed[i];
      if (!group || typeof group !== 'object') continue;
      
      const title = group.title ? String(group.title).trim() : '';
      if (!title) {
         return { specs: [], error: `Sản phẩm [${productName}]: Nhóm thông số thứ ${i + 1} thiếu title.` };
      }
      
      if (!Array.isArray(group.items)) {
         return { specs: [], error: `Sản phẩm [${productName}]: Nhóm [${title}] có items không hợp lệ.` };
      }
      
      const validItems = [];
      for (const item of group.items) {
         if (!item || typeof item !== 'object') continue;
         const label = item.label ? String(item.label).trim() : '';
         const value = item.value ? String(item.value).trim() : '';
         if (!label || !value) {
            return { specs: [], error: `Sản phẩm [${productName}]: Nhóm [${title}] có thông số không hợp lệ (thiếu label hoặc value).` };
         }
         validItems.push({ label, value });
      }
      
      if (validItems.length > 0) {
         finalSpecs.push({
           title,
           items: validItems
         });
      }
    }
    return { specs: finalSpecs, error: null };
  } catch (err) {
    return { specs: [], error: `Sản phẩm [${productName}]: Specification JSON không phải JSON hợp lệ.` };
  }
};

export interface GroupedProduct {
  key: string;
  name: string;
  categorySlug: string;
  categoryId: string;
  brand: string;
  description: string;
  status: string;
  specifications: any[];
  variants: any[];
  imageUrl: string;
  galleryUrls: string[];
  error?: string;
}

export const parseExcelPreview = async (buffer: Buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet) as any[];

  const categories = await prisma.category.findMany();
  const existingSkus = await prisma.productVariant.findMany({ select: { sku: true } });
  const skuSet = new Set(existingSkus.map(v => v.sku));
  const newSkuSet = new Set<string>();

  const groupedProducts: GroupedProduct[] = [];
  let errorRows = 0;
  let validRows = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    let rowError = '';

    const productName = (raw['Product Name'] || '').toString().trim();
    const catRaw = (raw['Category'] || '').toString().trim();
    const brand = (raw['Brand'] || '').toString().trim();
    const basePriceStr = (raw['Base Price'] || raw['Price'] || '').toString().trim();
    const basePrice = parseInt(basePriceStr, 10) || 0;

    if (!productName) rowError += 'Thiếu Product Name; ';
    if (!catRaw) rowError += 'Thiếu Category; ';
    if (!brand) rowError += 'Thiếu Brand; ';

    // Normalize category
    let matchedCategoryId = '';
    if (catRaw) {
      const normalizedCat = catRaw.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const matchedCat = categories.find(c => 
        c.name.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() === normalizedCat ||
        c.slug.includes(normalizedCat.replace(/\s+/g, '-')) ||
        normalizedCat.includes(c.slug.replace(/-/g, ' '))
      );
      if (matchedCat) {
        matchedCategoryId = matchedCat.id;
      } else {
        rowError += `Category '${catRaw}' không tìm thấy; `;
      }
    }

    const parseArray = (str: any) => str ? String(str).split('|').map(s => s.trim()) : [];
    
    const colors = parseArray(raw['Color']);
    const colorCodes = parseArray(raw['Color Code']);
    const colorImages = parseArray(raw['Color Image URL']);
    
    const storages = parseArray(raw['Storage']);
    
    const parsePriceMap = (str: any, fieldName: string) => {
      const map: Record<string, number> = {};
      if (!str) return map;
      const pairs = String(str).split('|').map(s => s.trim()).filter(Boolean);
      for (const pair of pairs) {
        const colonIdx = pair.lastIndexOf(':');
        if (colonIdx !== -1) {
          const key = pair.substring(0, colonIdx).trim();
          const valueStr = pair.substring(colonIdx + 1).replace(/\D/g, '');
          const value = parseInt(valueStr, 10);
          if (!isNaN(value)) {
            map[key] = value;
          } else {
            rowError += `Giá của Storage '${key}' trong ${fieldName} không hợp lệ; `;
          }
        } else {
          rowError += `${fieldName} '${pair}' sai định dạng (thiếu dấu :); `;
        }
      }
      return map;
    };

    const storagePriceMap = parsePriceMap(raw['Storage Price'], 'Storage Price');
    const storageSalePriceMap = parsePriceMap(raw['Storage Sale Price'], 'Storage Sale Price');

    for (const key of Object.keys(storagePriceMap)) {
      if (!storages.includes(key)) {
         rowError += `Storage Price chứa giá cho '${key}' nhưng không tìm thấy trong cột Storage; `;
      }
    }

    const cList = colors.length > 0 ? colors.map((c, idx) => ({ Color: c, ColorCode: colorCodes[idx] || '', ColorImage: colorImages[idx] || '' })) : [null];
    
    const sList = storages.length > 0 ? storages.map(s => {
      let price = storagePriceMap[s];
      let salePrice = storageSalePriceMap[s] || 0;
      
      if (price === undefined) {
         if (basePrice > 0) {
            price = basePrice;
         } else {
            rowError += `Thiếu giá cho Storage '${s}' và không có Base Price; `;
            price = 0;
         }
      }
      return { Storage: s, Price: price, SalePrice: salePrice };
    }) : [null];

    const rams = parseArray(raw['RAM']);
    const ssds = parseArray(raw['SSD']);
    const rList = rams.length > 0 ? rams.map(r => ({ RAM: r })) : [null];
    const dList = ssds.length > 0 ? ssds.map(d => ({ SSD: d })) : [null];

    const generateSku = (pName: string, attrs: any[]) => {
       const prefix = pName.split(' ').map(w => {
           if (/\d+/.test(w)) return w;
           return w[0];
       }).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
       const suffix = attrs.map(a => {
           const val = Object.values(a)[0]?.toString() || '';
           return val.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3);
       }).join('-');
       return suffix ? `${prefix}-${suffix}` : `${prefix}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;
    };

    const variants: any[] = [];
    let variantHasError = false;

    for (const c of cList) {
      for (const s of sList) {
        for (const r of rList) {
          for (const d of dList) {
             const attrs: Record<string, string> = {};
             const rawAttrs = [];
             if (c) { attrs['Màu sắc'] = c.Color; rawAttrs.push({Color: c.Color}); }
             if (s) { attrs['Dung lượng'] = s.Storage; rawAttrs.push({Storage: s.Storage}); }
             if (r) { attrs['RAM'] = r.RAM; rawAttrs.push({RAM: r.RAM}); }
             if (d) { attrs['SSD'] = d.SSD; rawAttrs.push({SSD: d.SSD}); }

             const finalPrice = s && s.Price > 0 ? s.Price : basePrice;
             const finalSalePrice = s && s.SalePrice > 0 ? s.SalePrice : null;
             const finalImage = c && c.ColorImage ? c.ColorImage : null;
             const finalColorCode = c && c.ColorCode ? c.ColorCode : null;

             let sku = generateSku(productName, rawAttrs);
             let counter = 1;
             while (skuSet.has(sku) || newSkuSet.has(sku)) {
                 sku = `${generateSku(productName, rawAttrs)}-${counter}`;
                 counter++;
                 if (counter > 100) {
                     rowError += `Không thể sinh SKU unique cho ${sku}; `;
                     variantHasError = true;
                     break;
                 }
             }
             newSkuSet.add(sku);

             variants.push({
               sku,
               price: finalPrice,
               salePrice: finalSalePrice,
               stock: 0,
               colorCode: finalColorCode,
               attributes: attrs,
               image: finalImage
             });
          }
        }
      }
    }

    let finalSpecs: any[] = [];
    
    const specJsonRaw = raw['Specification JSON'];
    if (specJsonRaw) {
      const { specs: parsedSpecs, error: specError } = parseSpecificationJSON(specJsonRaw, productName || `Row ${i+2}`);
      if (specError) {
         rowError += specError + ' ';
      } else {
         finalSpecs = parsedSpecs;
      }
    } else {
      // Backward Compatibility Priority 2: Specification Groups + Specifications
      const specGroupsRaw = raw['Specification Groups'] ? String(raw['Specification Groups']).trim() : '';
      const specsRaw = raw['Specifications'] ? String(raw['Specifications']).trim() : '';

      if (specGroupsRaw && specsRaw) {
        const groups = specGroupsRaw.split('|').map(s => s.trim()).filter(Boolean);
        const specsBlocks = specsRaw.split('|').map(s => s.trim());

        for (let g = 0; g < groups.length; g++) {
          const title = groups[g];
          const block = specsBlocks[g] || '';
          const items = block.split(';').map(itemStr => {
            const colonIdx = itemStr.indexOf(':');
            if (colonIdx === -1) return null;
            const label = itemStr.substring(0, colonIdx).trim();
            const value = itemStr.substring(colonIdx + 1).trim();
            if (!label || !value) return null;
            return { label, value };
          }).filter(Boolean);

          if (items.length > 0) {
            finalSpecs.push({
              title,
              items
            });
          }
        }
      } else {
        // Backward Compatibility Priority 3: Legacy fields
        const specifications: Record<string, string> = {};
        const specKeys = ['Screen', 'CPU', 'GPU', 'RAM', 'SSD', 'Camera', 'Battery', 'OS', 'Resolution'];
        for (const key of specKeys) {
          if (raw[key]) specifications[key] = String(raw[key]).trim();
        }
        finalSpecs = Object.entries(specifications).map(([key, value]) => ({
          key: key === 'Screen' ? 'Màn hình' :
               key === 'Storage' ? 'Dung lượng' :
               key === 'Battery' ? 'Pin' :
               key === 'Resolution' ? 'Độ phân giải' : key,
          value
        }));
      }
    }

    if (rowError || variantHasError) {
       errorRows++;
       groupedProducts.push({
          key: `row-${i}`,
          name: productName || `Row ${i+2}`,
          categorySlug: '',
          categoryId: '',
          brand: '',
          description: '',
          status: 'error',
          specifications: [],
          error: rowError || 'Lỗi sinh Variant',
          variants: [],
          imageUrl: '',
          galleryUrls: []
       });
       continue;
    }

    validRows++;

    groupedProducts.push({
      key: `prod-${i}`,
      name: productName,
      categorySlug: categories.find(c => c.id === matchedCategoryId)!.slug,
      categoryId: matchedCategoryId,
      brand,
      description: (raw['Description'] || '').toString().trim(),
      status: (raw['Status'] || 'active').toString().toLowerCase().trim(),
      specifications: finalSpecs,
      variants,
      imageUrl: (raw['Product Image URL'] || '').toString().trim(),
      galleryUrls: raw['Gallery Image URLs'] ? String(raw['Gallery Image URLs']).split('|').map((u: string) => u.trim()).filter(Boolean) : []
    });
  }

  return {
    totalRows: rawRows.length,
    validRows,
    errorRows,
    productsCount: validRows,
    groupedProducts
  };
};

// We are using the new downloadAndProcessImage from utils

export const processImport = async (groupedProducts: GroupedProduct[]) => {
  const results = {
    productsCreated: 0,
    variantsCreated: 0,
    imagesDownloaded: 0,
    imagesReused: 0,
    imagesFailed: 0,
    failedImages: [] as { url: string; reason: string }[],
    errors: [] as string[]
  };

  const imageCache = new Map<string, string | null>();

  const getOrDownloadImage = async (url: string) => {
    if (!url || !url.startsWith('http')) return null;
    if (imageCache.has(url)) {
      const cached = imageCache.get(url);
      if (cached) results.imagesReused++;
      return cached;
    }
    try {
      const localPath = await downloadAndProcessImage(url);
      if (localPath) results.imagesDownloaded++;
      imageCache.set(url, localPath);
      return localPath;
    } catch (e: any) {
      console.error(`[IMAGE IMPORT ERROR] Failed to download image ${url}:`, e.message);
      results.imagesFailed++;
      results.failedImages.push({ url, reason: e.message });
      results.errors.push(`Image Download Failed (${url}): ${e.message}`);
      imageCache.set(url, null); // Cache the failure too
      return null;
    }
  };

  for (const group of groupedProducts) {
    if (group.error) continue;
    try {
      const productSlug = group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const mainImagePath = await getOrDownloadImage(group.imageUrl);
      
      const galleryPaths: string[] = [];
      const uniqueGalleryUrls = Array.from(new Set(group.galleryUrls));
      for (const url of uniqueGalleryUrls) {
        const p = await getOrDownloadImage(url);
        if (p) galleryPaths.push(p);
      }

      await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name: group.name,
            categoryId: group.categoryId,
            brand: group.brand,
            description: group.description,
            status: group.status,
            specifications: group.specifications as any,
            image: mainImagePath || (galleryPaths.length > 0 ? galleryPaths[0] : null),
            images: galleryPaths,
          }
        });

        results.productsCreated++;

        for (const v of group.variants) {
          const varImagePath = await getOrDownloadImage(v.image);
          
          await tx.productVariant.create({
            data: {
              sku: v.sku,
              price: Number(v.price) || 0,
              salePrice: v.salePrice ? Number(v.salePrice) : null,
              stock: Number(v.stock) || 0,
              colorCode: v.colorCode || null,
              attributes: v.attributes as any,
              image: varImagePath || null,
              productId: product.id
            }
          });
          results.variantsCreated++;
        }
      });
      
    } catch (e: any) {
      console.error('Error importing product group:', group.name, e);
      results.errors.push(`Group ${group.name}: ${e.message}`);
    }
  }

  return results;
};
