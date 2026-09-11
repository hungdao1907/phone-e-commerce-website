import { getSmartphoneBrandConfig, getSmartphoneProductsByBrand, type SmartphoneBrandId } from './data';
import { SmartphoneCatalogPage } from './SmartphoneCatalogPage';

interface SmartphonePageProps {
  brand: SmartphoneBrandId;
}

export function SmartphonePage({ brand }: SmartphonePageProps) {
  const config = getSmartphoneBrandConfig(brand);
  const products = getSmartphoneProductsByBrand(brand);

  return <SmartphoneCatalogPage config={config} products={products} />;
}

export default SmartphonePage;