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

  let minPrice = Infinity;
  let maxPrice = 0;

  for (const product of products) {
    if (product.brand) filters.brands.add(product.brand);

    // Extract from specifications
    if (Array.isArray(product.specifications)) {
      for (const spec of product.specifications) {
        if (!spec.key || !spec.value) continue;
        const normKey = normalizeKey(spec.key);
        
        // Add to corresponding filter set if it's a known filter
        if (filters[normKey]) {
          filters[normKey].add(spec.value.trim());
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
              filters[normKey].add((value as string).trim());
            }
          }
        }
      }
    }
  }

  // Convert sets to arrays
  return {
    brands: Array.from(filters.brands).sort(),
    ram: Array.from(filters.ram).sort(),
    storage: Array.from(filters.storage).sort(),
    cpu: Array.from(filters.cpu).sort(),
    gpu: Array.from(filters.gpu).sort(),
    screenSize: Array.from(filters.screenSize).sort(),
    colors: Array.from(filters.colors).sort(),
    os: Array.from(filters.os).sort(),
    camera: Array.from(filters.camera).sort(),
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

