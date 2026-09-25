import { IPHONE_BRAND_CONFIG } from './iphoneData';
import { SAMSUNG_BRAND_CONFIG } from './samsungData';
import { XIAOMI_BRAND_CONFIG } from './xiaomiData';
import { OPPO_BRAND_CONFIG } from './oppoData';
import { SMARTPHONE_PRODUCTS } from './mockSmartphoneProducts';
import type { BrandConfig, BrandModel, SmartphoneBrandId } from '../../../types/smartphone/types/smartphone';

export type { SmartphoneBrandId };

export const SMARTPHONE_BRAND_CONFIGS: Record<SmartphoneBrandId, BrandConfig> = {
  iphone: IPHONE_BRAND_CONFIG,
  samsung: SAMSUNG_BRAND_CONFIG,
  xiaomi: XIAOMI_BRAND_CONFIG,
  oppo: OPPO_BRAND_CONFIG,
};

export const getSmartphoneBrandConfig = (brand: SmartphoneBrandId): BrandConfig => {
  const config = SMARTPHONE_BRAND_CONFIGS[brand];
  if (!config) {
    throw new Error(`Unknown smartphone brand: ${brand}`);
  }
  return config;
};

export const getSmartphoneProductsByBrand = (brand: SmartphoneBrandId): BrandModel[] => {
  return SMARTPHONE_PRODUCTS.filter((product) => product.brand === brand);
};

export const getFeaturedSmartphoneProducts = (brand: SmartphoneBrandId): BrandModel[] => {
  return SMARTPHONE_PRODUCTS.filter((product) => product.brand === brand && product.featured);
};

export const getAllSmartphoneProducts = (): BrandModel[] => {
  return SMARTPHONE_PRODUCTS;
};
