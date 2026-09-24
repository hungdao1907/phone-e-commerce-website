import type { ProductVariant, PurchaseProduct, PurchaseProductColor, PurchaseProductOption } from '../types';
import { getAllSmartphoneProducts } from '../../smartphone/data';
import { getAllTabletProducts } from '../../tablet/data';
import { getAllLaptopProducts } from '../../laptop/data';

interface StorageConfiguration extends PurchaseProductOption {
  price: number;
  originalPrice?: number;
  stockByColor: number[];
}

const parsePriceToNumber = (val?: string | number): number | undefined => {
  if (val === undefined) return undefined;
  if (typeof val === 'number') return val;
  const num = Number.parseInt(val.replace(/\D/g, ''), 10);
  return Number.isNaN(num) ? undefined : num;
};

const BRAND_DISPLAY_NAMES: Record<string, string> = {
  iphone: 'Apple',
  apple: 'Apple',
  xiaomi: 'Xiaomi',
  oppo: 'OPPO',
  samsung: 'Samsung',
  dell: 'Dell',
  asus: 'ASUS',
  hp: 'HP',
};

const createVariants = (
  productId: string,
  colors: PurchaseProductColor[],
  storageConfigurations: StorageConfiguration[],
): ProductVariant[] => (
  colors.flatMap((color, colorIndex) => (
    storageConfigurations.map((storage) => ({
      id: productId + '-' + color.id + '-' + storage.id,
      sku: productId.toUpperCase() + '-' + color.id.toUpperCase() + '-' + storage.id.toUpperCase(),
      colorId: color.id,
      storageId: storage.id,
      price: storage.price,
      originalPrice: storage.originalPrice,
      stock: storage.stockByColor[colorIndex] ?? 0,
    }))
  ))
);

const s26Colors: PurchaseProductColor[] = [
  { id: 'phantom-black', name: 'Phantom Black', hex: '#1E2022' },
  { id: 'cream', name: 'Cream', hex: '#F4F0EA' },
  { id: 'lavender', name: 'Lavender', hex: '#D8CEFA' },
];

const s26Storage: StorageConfiguration[] = [
  { id: '128gb', label: '128GB', price: 22990000, originalPrice: 24490000, stockByColor: [10, 6, 3] },
  { id: '256gb', label: '256GB', price: 24990000, originalPrice: 26490000, stockByColor: [8, 5, 0] },
  { id: '512gb', label: '512GB', price: 27990000, originalPrice: 29490000, stockByColor: [0, 4, 2] },
];

const s26PlusColors: PurchaseProductColor[] = [
  { id: 'phantom-black', name: 'Phantom Black', hex: '#1E2022' },
  { id: 'cream', name: 'Cream', hex: '#F4F0EA' },
  { id: 'mint', name: 'Mint', hex: '#C5E0D8' },
  { id: 'cobalt-violet', name: 'Cobalt Violet', hex: '#C4B5FD' },
];

const s26PlusStorage: StorageConfiguration[] = [
  { id: '256gb', label: '256GB', price: 26990000, originalPrice: 28490000, stockByColor: [8, 6, 4, 3] },
  { id: '512gb', label: '512GB', price: 29990000, originalPrice: 31490000, stockByColor: [5, 4, 2, 2] },
  { id: '1tb', label: '1TB', price: 33990000, originalPrice: 35490000, stockByColor: [2, 1, 0, 1] },
];

const s26UltraColors: PurchaseProductColor[] = [
  { id: 'titanium-black', name: 'Titanium Black', hex: '#232428' },
  { id: 'titanium-gray', name: 'Titanium Gray', hex: '#686A6E' },
  { id: 'titanium-silver', name: 'Titanium Silver', hex: '#C5C8CF' },
  { id: 'titanium-blue', name: 'Titanium Blue', hex: '#4B5E78' },
];

const s26UltraStorage: StorageConfiguration[] = [
  { id: '256gb', label: '256GB', price: 31990000, originalPrice: 33990000, stockByColor: [7, 6, 5, 3] },
  { id: '512gb', label: '512GB', price: 34990000, originalPrice: 36990000, stockByColor: [4, 3, 2, 2] },
  { id: '1tb', label: '1TB', price: 39990000, originalPrice: 41990000, stockByColor: [1, 1, 1, 0] },
];

const customS26Products: PurchaseProduct[] = [
  {
    id: 'samsung-galaxy-s26',
    slug: 'galaxy-s26',
    brand: 'Samsung',
    name: 'Galaxy S26',
    tagline: 'Gọn gàng, mạnh mẽ và sẵn sàng cho mọi ngày.',
    badge: 'Galaxy AI',
    defaultImage: '/images/samsung/samsung-card-s26.jpg',
    galleryImages: [
      '/images/samsung/samsung-card-s26.jpg',
      '/images/samsung/samsung-banner-s26.png',
    ],
    colors: s26Colors,
    storageOptions: s26Storage.map(({ id, label }) => ({ id, label })),
    specifications: [
      { label: 'Màn hình', value: '6.2 inch Dynamic AMOLED 2X, 120Hz' },
      { label: 'Vi xử lý', value: 'Snapdragon 8 Elite for Galaxy' },
      { label: 'Camera', value: '50MP + 12MP + 10MP' },
      { label: 'Pin', value: '4.000 mAh, sạc nhanh 25W' },
      { label: 'Kết nối', value: '5G, Wi‑Fi 7, Bluetooth' },
    ],
    variants: createVariants('s26', s26Colors, s26Storage),
  },
  {
    id: 'samsung-galaxy-s26-plus',
    slug: 'galaxy-s26-plus',
    brand: 'Samsung',
    name: 'Galaxy S26+',
    tagline: 'Màn hình rộng hơn, năng lượng bền bỉ hơn.',
    badge: 'Galaxy AI',
    defaultImage: '/images/samsung/samsung-card-s26-plus.jpg',
    galleryImages: [
      '/images/samsung/samsung-card-s26-plus.jpg',
      '/images/samsung/samsung-banner-s26-plus.png',
    ],
    colors: s26PlusColors,
    storageOptions: s26PlusStorage.map(({ id, label }) => ({ id, label })),
    specifications: [
      { label: 'Màn hình', value: '6.7 inch Dynamic AMOLED 2X QHD+, 120Hz' },
      { label: 'Vi xử lý', value: 'Snapdragon 8 Elite for Galaxy' },
      { label: 'Camera', value: '50MP + 12MP + 10MP' },
      { label: 'Pin', value: '4.900 mAh, sạc nhanh 45W' },
      { label: 'Kết nối', value: '5G, Wi‑Fi 7, Bluetooth' },
    ],
    variants: createVariants('s26-plus', s26PlusColors, s26PlusStorage),
  },
  {
    id: 'samsung-galaxy-s26-ultra',
    slug: 'galaxy-s26-ultra',
    brand: 'Samsung',
    name: 'Galaxy S26 Ultra',
    tagline: 'Đỉnh cao trải nghiệm Galaxy, tinh gọn cho quyết định mua sắm.',
    badge: 'Flagship Galaxy',
    defaultImage: '/images/samsung/samsung-card-s26-ultra.jpg',
    galleryImages: [
      '/images/samsung/samsung-card-s26-ultra.jpg',
      '/images/samsung/samsung-banner-s26-ultra.png',
    ],
    colors: s26UltraColors,
    storageOptions: s26UltraStorage.map(({ id, label }) => ({ id, label })),
    specifications: [
      { label: 'Màn hình', value: '6.9 inch Dynamic AMOLED 2X, 120Hz' },
      { label: 'Vi xử lý', value: 'Snapdragon 8 Elite for Galaxy' },
      { label: 'Camera', value: '200MP + 50MP + 50MP + 12MP' },
      { label: 'Pin', value: '5.000 mAh, sạc nhanh 45W' },
      { label: 'Điểm nhấn', value: 'S Pen tích hợp, khung Titanium' },
      { label: 'Kết nối', value: '5G, Wi‑Fi 7, Bluetooth' },
    ],
    variants: createVariants('s26-ultra', s26UltraColors, s26UltraStorage),
  },
];

const customSlugs = new Set(customS26Products.map((p) => p.slug));

const createSmartphonePurchaseProducts = (): PurchaseProduct[] => (
  getAllSmartphoneProducts()
    .filter((product) => !customSlugs.has(product.slug ?? product.id))
    .map((product) => {
      const numericPrice = parsePriceToNumber(product.price) ?? 0;
      const numericOriginalPrice = parsePriceToNumber(product.originalPrice);

      const colors: PurchaseProductColor[] = product.colors.map((color, index) => ({
        id: 'color-' + index,
        name: color.name,
        hex: color.hex,
        images: [product.image],
      }));
      const storageConfigurations: StorageConfiguration[] = [
        { id: '128gb', label: '128GB', price: numericPrice, originalPrice: numericOriginalPrice, stockByColor: colors.map(() => 8) },
        { id: '256gb', label: '256GB', price: numericPrice + 2500000, originalPrice: numericOriginalPrice ? numericOriginalPrice + 2500000 : undefined, stockByColor: colors.map(() => 5) },
        { id: '512gb', label: '512GB', price: numericPrice + 5000000, originalPrice: numericOriginalPrice ? numericOriginalPrice + 5000000 : undefined, stockByColor: colors.map(() => 3) },
      ];

      return {
        id: product.id,
        slug: product.slug ?? product.id,
        brand: BRAND_DISPLAY_NAMES[product.brand] ?? String(product.brand),
        name: product.name,
        tagline: product.tagline,
        badge: product.badge,
        defaultImage: product.image,
        galleryImages: [product.image],
        colors,
        storageOptions: storageConfigurations.map(({ id, label }) => ({ id, label })),
        specifications: [
          { label: 'Màn hình', value: product.specs.display },
          { label: 'Vi xử lý', value: product.specs.chipset },
          { label: 'Camera', value: product.specs.camera },
          { label: 'Pin', value: product.specs.battery },
          { label: 'Kết nối', value: '5G, Wi-Fi, Bluetooth' },
        ],
        variants: createVariants(product.id, colors, storageConfigurations),
      };
    })
);

const dynamicSmartphonePurchaseProducts = createSmartphonePurchaseProducts();

const createTabletPurchaseProducts = (): PurchaseProduct[] => (
  getAllTabletProducts().map((tablet) => {
    const colors: PurchaseProductColor[] = tablet.colors.map((color, index) => ({
      id: 'color-' + index,
      name: color.name,
      hex: color.hex,
      images: [tablet.image],
    }));
    const storageConfigurations: StorageConfiguration[] = [
      { id: '128gb', label: '128GB', price: tablet.price, originalPrice: tablet.originalPrice, stockByColor: colors.map(() => 8) },
      { id: '256gb', label: '256GB', price: tablet.price + 2500000, originalPrice: tablet.originalPrice ? tablet.originalPrice + 2500000 : undefined, stockByColor: colors.map(() => 5) },
      { id: '512gb', label: '512GB', price: tablet.price + 5000000, originalPrice: tablet.originalPrice ? tablet.originalPrice + 5000000 : undefined, stockByColor: colors.map(() => 3) },
    ];

    return {
      id: tablet.id,
      slug: tablet.slug,
      category: 'tablet' as const,
      brand: BRAND_DISPLAY_NAMES[tablet.brand] ?? tablet.brand,
      name: tablet.name,
      tagline: tablet.tagline,
      badge: tablet.badge,
      defaultImage: tablet.image,
      galleryImages: [tablet.image],
      colors,
      storageOptions: storageConfigurations.map(({ id, label }) => ({ id, label })),
      specifications: [
        { label: 'Màn hình', value: tablet.specs.display },
        { label: 'Hiệu năng', value: tablet.specs.chipset },
        { label: 'Pin', value: tablet.specs.battery },
        { label: 'Lưu trữ', value: tablet.specs.storage },
        { label: 'Ghi chú', value: 'Thông tin frontend prototype' },
      ],
      variants: createVariants(tablet.id, colors, storageConfigurations),
    };
  })
);

const tabletPurchaseProducts = createTabletPurchaseProducts();

const createLaptopPurchaseProducts = (): PurchaseProduct[] => (
  getAllLaptopProducts().map((laptop) => {
    const colors: PurchaseProductColor[] = laptop.colors.map((color, index) => ({
      id: 'color-' + index,
      name: color.name,
      hex: color.hex,
      images: [laptop.image],
    }));
    const storageConfigurations: StorageConfiguration[] = [
      { id: '512gb', label: '512GB SSD', price: laptop.price, originalPrice: laptop.originalPrice, stockByColor: colors.map(() => 6) },
      { id: '1tb', label: '1TB SSD', price: laptop.price + 4500000, originalPrice: laptop.originalPrice ? laptop.originalPrice + 4500000 : undefined, stockByColor: colors.map(() => 4) },
      { id: '2tb', label: '2TB SSD', price: laptop.price + 9000000, originalPrice: laptop.originalPrice ? laptop.originalPrice + 9000000 : undefined, stockByColor: colors.map(() => 2) },
    ];

    return {
      id: laptop.id,
      slug: laptop.slug,
      category: 'laptop' as const,
      brand: BRAND_DISPLAY_NAMES[laptop.brand] ?? laptop.brand,
      name: laptop.name,
      tagline: laptop.tagline,
      badge: laptop.badge,
      defaultImage: laptop.image,
      galleryImages: [laptop.image],
      colors,
      storageOptions: storageConfigurations.map(({ id, label }) => ({ id, label })),
      specifications: [
        { label: 'Màn hình', value: laptop.specs.display },
        { label: 'Vi xử lý', value: laptop.specs.processor },
        ...(laptop.specs.gpu ? [{ label: 'Đồ họa', value: laptop.specs.gpu }] : []),
        { label: 'Bộ nhớ & Ổ cứng', value: `${laptop.specs.ram} • ${laptop.specs.storage}` },
        { label: 'Pin & Nguồn', value: laptop.specs.battery },
      ],
      variants: createVariants(laptop.id, colors, storageConfigurations),
    };
  })
);

const laptopPurchaseProducts = createLaptopPurchaseProducts();

export const mockPurchaseProducts: PurchaseProduct[] = [
  ...customS26Products,
  ...dynamicSmartphonePurchaseProducts,
  ...tabletPurchaseProducts,
  ...laptopPurchaseProducts,
];

export function getPurchaseProductBySlug(slug?: string) {
  return mockPurchaseProducts.find((product) => product.slug === slug);
}

export const formatPurchasePrice = (price: number) => (
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
);