import { WATCH_BRAND_CONFIGS } from './watchConfigs';
import { WATCH_BRAND_PRODUCTS } from './mockWatchBrandProducts';
import type { WatchBrandConfig, WatchBrandId, WatchBrandModel } from '../../../../types/watch/brand/types/watch';

export const getWatchBrandConfig = (brandId: WatchBrandId): WatchBrandConfig => {
  const config = WATCH_BRAND_CONFIGS[brandId];
  if (!config) {
    throw new Error(`Unknown watch brand: ${brandId}`);
  }
  return config;
};

export const getWatchBrandProductsByBrand = (brandId: WatchBrandId): WatchBrandModel[] => {
  return WATCH_BRAND_PRODUCTS.filter((product) => product.brand === brandId);
};

export const getAllWatchBrandProducts = (): WatchBrandModel[] => {
  return WATCH_BRAND_PRODUCTS;
};
