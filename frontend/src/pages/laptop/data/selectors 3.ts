import { LAPTOP_BRAND_CONFIGS } from './laptopConfigs';
import { LAPTOP_PRODUCTS } from './mockLaptopProducts';
import type { LaptopBrandConfig, LaptopBrandId, LaptopModel } from '../types/laptop';

export const getLaptopBrandConfig = (brandId: LaptopBrandId): LaptopBrandConfig => {
  const config = LAPTOP_BRAND_CONFIGS[brandId];
  if (!config) {
    throw new Error(`Unknown laptop brand: ${brandId}`);
  }
  return config;
};

export const getLaptopProductsByBrand = (brandId: LaptopBrandId): LaptopModel[] => {
  return LAPTOP_PRODUCTS.filter((product) => product.brand === brandId);
};

export const getAllLaptopProducts = (): LaptopModel[] => {
  return LAPTOP_PRODUCTS;
};
