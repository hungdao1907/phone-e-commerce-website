import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Normalization mappings
const SPEC_MAPPINGS: Record<string, string> = {
  // RAM
  'ram': 'ram',
  'dung lượng ram': 'ram',
  
  // Storage
  'ssd': 'storage',
  'ổ cứng': 'storage',
  'dung lượng lưu trữ': 'storage',
  'dung lượng': 'storage',
  'rom': 'storage',
  
  // CPU
  'cpu': 'cpu',
  'bộ xử lý': 'cpu',
  'chip': 'cpu',
  
  // GPU
  'gpu': 'gpu',
  'card đồ họa': 'gpu',
  
  // Screen
  'màn hình': 'screenSize',
  'kích thước màn hình': 'screenSize',
  
  // Color
  'màu sắc': 'colors',
  'color': 'colors',

  // OS
  'hệ điều hành': 'os',
  'os': 'os',

  // Camera
  'camera': 'camera',
  'máy ảnh': 'camera',
};

/**
 * Normalize a specification or attribute key
 */
export function normalizeKey(key: string): string {
  const lowerKey = key.trim().toLowerCase();
  return SPEC_MAPPINGS[lowerKey] || lowerKey; // return mapped or fallback to lowercase
}

/**
 * Extract a short screen size value from raw spec string.
 * e.g. "6.1 inch Super Retina XDR OLED, 2532 x 1170" → "6.1\""
 */
function extractShortScreenSize(raw: string): string {
  const match = raw.match(/([\d,.]+)\s*(?:inch|inches|"|″)/i);
  if (match) return match[1].replace(',', '.') + '"';
  const numMatch = raw.match(/^([\d,.]+)/);
  if (numMatch) return numMatch[1].replace(',', '.') + '"';
  return raw.length > 15 ? raw.substring(0, 12) + '…' : raw;
}

/**
 * Extract short chip name from raw spec string.
 * e.g. "Apple A18, CPU 6 lõi" → "A18"
 */
function extractShortChipName(raw: string): string {
  const aMatch = raw.match(/A(\d+)\s*(Pro|Bionic|Max)?/i);
  if (aMatch) {
    let r = 'A' + aMatch[1];
    if (aMatch[2]) r += ' ' + aMatch[2].charAt(0).toUpperCase() + aMatch[2].slice(1).toLowerCase();
    return r;
  }
  const snapMatch = raw.match(/Snapdragon\s+(\d+(?:\s+Gen\s+\d+)?)/i);
  if (snapMatch) return 'Snapdragon ' + snapMatch[1];
  const dimMatch = raw.match(/Dimensity\s+(\d+)/i);
  if (dimMatch) return 'Dimensity ' + dimMatch[1];
  const exyMatch = raw.match(/Exynos\s+(\d+)/i);
  if (exyMatch) return 'Exynos ' + exyMatch[1];
  // M-series chips for Mac
  const mMatch = raw.match(/M(\d+)\s*(Pro|Max|Ultra)?/i);
  if (mMatch) {
    let r = 'M' + mMatch[1];
    if (mMatch[2]) r += ' ' + mMatch[2];
    return r;
  }
  const short = raw.split(/[,;]/)[0].trim();
  return short.length > 20 ? short.substring(0, 18) + '…' : short;
}

/**
 * Extract camera MP from raw spec string.
 * e.g. "Sau: 48MP Fusion + 12MP Ultra Wide" → "48MP"
 */
function extractShortCamera(raw: string): string {
  const matches = raw.match(/(\d+)\s*MP/gi);
  if (matches && matches.length > 0) {
    const mpValues = matches.map(m => {
      const n = m.match(/(\d+)/);
      return n ? parseInt(n[1]) : 0;
    });
    return Math.max(...mpValues) + 'MP';
  }
  const short = raw.split(/[,;]/)[0].trim();
  return short.length > 20 ? short.substring(0, 18) + '…' : short;
}

/**
 * Extract short RAM value.
 * e.g. "12GB RAM" → "12GB"
 */
function extractShortRAM(raw: string): string {
  const match = raw.match(/(\d+)\s*GB/i);
  return match ? match[1] + 'GB' : raw.trim();
}

/**
 * Shorten a spec value based on its normalized key.
 */
function shortenSpecValue(normKey: string, raw: string): string {
  const trimmed = raw.trim();
  switch (normKey) {
    case 'screenSize': return extractShortScreenSize(trimmed);
    case 'cpu': return extractShortChipName(trimmed);
    case 'camera': return extractShortCamera(trimmed);
    case 'ram': return extractShortRAM(trimmed);
    default: return trimmed;
  }
}

/**
 * Extract dynamic filters from a list of products
 */
export function extractFiltersFromProducts(products: any[]) {
  const filters: Record<string, Set<string>> = {
    brands: new Set(),
    ram: new Set(),
    storage: new Set(),
    cpu: new Set(),
    gpu: new Set(),
    screenSize: new Set(),
    colors: new Set(),
    os: new Set(),
    camera: new Set()
  };

  // Map to track: shortValue -> set of original raw values (for backend filtering)
  let minPrice = Infinity;
  let maxPrice = 0;

  // Track color codes for the color filter
  const colorCodesMap: Record<string, string> = {};

  for (const product of products) {
    if (product.brand) filters.brands.add(product.brand);

    // Extract from specifications
    if (Array.isArray(product.specifications)) {
      for (const spec of product.specifications) {
        if (!spec.key || !spec.value) continue;
        const normKey = normalizeKey(spec.key);
        
        // Add SHORTENED value to corresponding filter set
        if (filters[normKey]) {
          const shortVal = shortenSpecValue(normKey, spec.value);
          if (shortVal) filters[normKey].add(shortVal);
        }
      }
    }

    // Extract from variants
    if (Array.isArray(product.variants)) {
      for (const variant of product.variants) {
        // Price Range
        const price = variant.salePrice || variant.price;
        if (price > 0) {
          if (price < minPrice) minPrice = price;
          if (price > maxPrice) maxPrice = price;
        }

        // Attributes
        if (variant.attributes && typeof variant.attributes === 'object') {
          for (const [key, value] of Object.entries(variant.attributes)) {
            if (!value) continue;
            const normKey = normalizeKey(key);
            if (filters[normKey]) {
              // Storage and colors from variants don't need shortening (already short values like "128GB", "Đen")
              filters[normKey].add((value as string).trim());
            }
          }
        }

        // Track color codes
        if (variant.colorCode && variant.attributes?.['Màu sắc']) {
          const colorName = (variant.attributes['Màu sắc'] as string).trim();
          if (!colorCodesMap[colorName]) {
            colorCodesMap[colorName] = variant.colorCode;
          }
        }
      }
    }
  }

  // Convert sets to arrays
  return {
    brands: Array.from(filters.brands).sort(),
    ram: Array.from(filters.ram).sort(),
    storage: Array.from(filters.storage).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    }),
    cpu: Array.from(filters.cpu).sort(),
    gpu: Array.from(filters.gpu).sort(),
    screenSize: Array.from(filters.screenSize).sort((a, b) => {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numA - numB;
    }),
    colors: Array.from(filters.colors).sort(),
    colorCodes: colorCodesMap,
    os: Array.from(filters.os).sort(),
    camera: Array.from(filters.camera).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    }),
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice
    }
  };
}

/**
 * Extract dynamic filters for Admin with counts (reads all keys dynamically)
 */
export function extractAdminFiltersFromProducts(products: any[]) {
  const filters: Record<string, Map<string, number>> = {
    brands: new Map()
  };

  let minPrice = Infinity;
  let maxPrice = 0;
  let hasValidPrice = false;

  const incrementCount = (groupKey: string, value: string) => {
    if (!filters[groupKey]) {
      filters[groupKey] = new Map();
    }
    const currentCount = filters[groupKey].get(value) || 0;
    filters[groupKey].set(value, currentCount + 1);
  };

  for (const product of products) {
    if (product.brand) incrementCount('brands', product.brand.trim());

    // Extract from specifications
    if (Array.isArray(product.specifications)) {
      for (const spec of product.specifications) {
        if (!spec.key || !spec.value) continue;
        const normKey = normalizeKey(spec.key);
        incrementCount(`spec_${normKey}`, spec.value.trim());
      }
    }

    // Extract from variants
    if (Array.isArray(product.variants)) {
      for (const variant of product.variants) {
        const price = variant.salePrice || variant.price;
        if (price > 0) {
          hasValidPrice = true;
          if (price < minPrice) minPrice = price;
          if (price > maxPrice) maxPrice = price;
        }

        if (variant.attributes && typeof variant.attributes === 'object') {
          for (const [key, value] of Object.entries(variant.attributes)) {
            if (!value) continue;
            const normKey = normalizeKey(key);
            incrementCount(`attr_${normKey}`, (value as string).trim());
          }
        }
      }
    }
  }

  const result: Record<string, { value: string; count: number }[] | any> = {};
  for (const [key, map] of Object.entries(filters)) {
    result[key] = Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }
  
  result.priceRange = {
    min: hasValidPrice ? minPrice : 0,
    max: hasValidPrice ? maxPrice : 0
  };

  return result;
}
