type SearchableProduct = {
  name?: unknown;
  brand?: unknown;
  variants?: Array<{ sku?: unknown }>;
};

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Match all meaningful name tokens, allowing accents and punctuation to differ. */
export function matchesProductNameSearch(product: SearchableProduct, query: string): boolean {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return false;

  const searchable = normalizeSearchText([
    typeof product.name === 'string' ? product.name : '',
    typeof product.brand === 'string' ? product.brand : '',
    ...(Array.isArray(product.variants) ? product.variants.map(variant =>
      typeof variant?.sku === 'string' ? variant.sku : '',
    ) : []),
  ].join(' '));

  return terms.every(term => searchable.includes(term));
}
