import * as xlsx from 'xlsx';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'products');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface GroupedProduct {
  key: string;
  name: string;
  categorySlug: string;
  categoryId: string;
  brand: string;
  description: string;
  status: string;
  specifications: { key: string; value: string }[];
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
    const storagePrices = parseArray(raw['Storage Price']);
    const storageSalePrices = parseArray(raw['Storage Sale Price']);
    
    const rams = parseArray(raw['RAM']);
    const ssds = parseArray(raw['SSD']);

    const cList = colors.length > 0 ? colors.map((c, idx) => ({ Color: c, ColorCode: colorCodes[idx] || '', ColorImage: colorImages[idx] || '' })) : [null];
    const sList = storages.length > 0 ? storages.map((s, idx) => ({ Storage: s, Price: parseInt(storagePrices[idx]) || 0, SalePrice: parseInt(storageSalePrices[idx]) || 0 })) : [null];
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

    const specifications: Record<string, string> = {};
    const specKeys = ['Screen', 'CPU', 'GPU', 'RAM', 'SSD', 'Camera', 'Battery', 'OS', 'Resolution'];
    for (const key of specKeys) {
      if (raw[key]) specifications[key] = String(raw[key]).trim();
    }
    const specsArr = Object.entries(specifications).map(([key, value]) => ({
      key: key === 'Screen' ? 'Màn hình' :
           key === 'Storage' ? 'Dung lượng' :
           key === 'Battery' ? 'Pin' :
           key === 'Resolution' ? 'Độ phân giải' : key,
      value
    }));

    groupedProducts.push({
      key: `prod-${i}`,
      name: productName,
      categorySlug: categories.find(c => c.id === matchedCategoryId)!.slug,
      categoryId: matchedCategoryId,
      brand,
      description: (raw['Description'] || '').toString().trim(),
      status: (raw['Status'] || 'active').toString().toLowerCase().trim(),
      specifications: specsArr,
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

const downloadImage = async (url: string, prefix: string): Promise<string | null> => {
  if (!url || !url.startsWith('http')) return null;
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 10000,
      maxContentLength: 5 * 1024 * 1024,
    });

    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    
    const uniqueSuffix = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}.${safeExt}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/uploads/products/${filename}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to download image: ${url}`, (error as Error).message);
    return null;
  }
};

export const processImport = async (groupedProducts: GroupedProduct[]) => {
  const results = {
    productsCreated: 0,
    variantsCreated: 0,
    imagesDownloaded: 0,
    errors: [] as string[]
  };

  const imageCache = new Map<string, string | null>();

  const getOrDownloadImage = async (url: string, prefix: string) => {
    if (!url) return null;
    if (imageCache.has(url)) return imageCache.get(url);
    const localPath = await downloadImage(url, prefix);
    if (localPath) results.imagesDownloaded++;
    imageCache.set(url, localPath);
    return localPath;
  };

  for (const group of groupedProducts) {
    if (group.error) continue;
    try {
      const productSlug = group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const mainImagePath = await getOrDownloadImage(group.imageUrl, productSlug);
      
      const galleryPaths: string[] = [];
      for (const url of group.galleryUrls) {
        const p = await getOrDownloadImage(url, productSlug);
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
            image: mainImagePath || null,
            images: galleryPaths,
          }
        });

        results.productsCreated++;

        for (const v of group.variants) {
          const varImagePath = await getOrDownloadImage(v.image, `${productSlug}-var`);
          
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
