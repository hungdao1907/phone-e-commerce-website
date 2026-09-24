import { TABLET_BRAND_CONFIGS } from './tabletConfigs';
import { TABLET_PRODUCTS } from './mockTabletProducts';
import type { TabletBrandConfig, TabletBrandId, TabletModel } from '../types/tablet';

export const getTabletBrandConfig = (brandId: TabletBrandId): TabletBrandConfig => {
  const config = TABLET_BRAND_CONFIGS[brandId];
  if (!config) {
    throw new Error(`Unknown tablet brand: ${brandId}`);
  }
  return config;
};

export const getTabletProductsByBrand = (brandId: TabletBrandId): TabletModel[] => {
  return TABLET_PRODUCTS.filter((product) => product.brand === brandId);
};

export const getAllTabletProducts = (): TabletModel[] => {
  return TABLET_PRODUCTS;
};
