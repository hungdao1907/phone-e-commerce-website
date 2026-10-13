const source = $('Prepare Product Detail').first().json;

// ============================================================
// HELPERS
// ============================================================

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ă„â€˜/g, 'd')
    .replace(/Ă„Â/g, 'D')
    .toLowerCase()
    .trim();
}

function compactText(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]/g, '');
}

function parseCapacity(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const text = normalizeText(value).replace(/\s+/g, '');

  const match = text.match(/(\d+(?:\.\d+)?)(tb|gb)?/i);

  if (!match) return null;

  let number = Number(match[1]);

  if (!Number.isFinite(number)) {
    return null;
  }

  if ((match[2] || '').toLowerCase() === 'tb') {
    number *= 1024;
  }

  return number;
}

function findAttribute(attributes, possibleNames) {
  if (!attributes || typeof attributes !== 'object') {
    return null;
  }

  for (const [key, value] of Object.entries(attributes)) {
    const normalizedKey = normalizeText(key);

    if (
      possibleNames.some(
        name => normalizedKey === normalizeText(name)
      )
    ) {
      return value;
    }
  }

  return null;
}

function getSpecification(specifications, keyword) {
  if (!Array.isArray(specifications)) {
    return null;
  }

  const target = normalizeText(keyword);

  const item = specifications.find(spec => {
    const key =
      spec?.key ??
      spec?.name ??
      spec?.label ??
      '';

    return normalizeText(key).includes(target);
  });

  return item?.value ?? null;
}

function extractVersionInfo(attributes) {
  const version = findAttribute(
    attributes,
    ['Phiên bản', 'Phien ban', 'Version']
  );

  if (!version) {
    return {
      storageGb: null,
      ramGb: null
    };
  }

  const matches = [
    ...String(version).matchAll(
      /(\d+(?:\.\d+)?)\s*(TB|GB)/gi
    )
  ];

  if (!matches.length) {
    return {
      storageGb: null,
      ramGb: null
    };
  }

  const values = matches.map(match => ({
    value: Number(match[1]),
    unit: match[2].toUpperCase()
  }));

  const tb = values.find(v => v.unit === 'TB');

  if (tb) {
    const gb = values.filter(v => v.unit === 'GB');

    return {
      storageGb: tb.value * 1024,
      ramGb: gb.length ? gb[0].value : null
    };
  }

  const gb = values
    .filter(v => v.unit === 'GB')
    .map(v => v.value);

  if (gb.length >= 2) {
    return {
      ramGb: gb[0],
      storageGb: gb[gb.length - 1]
    };
  }

  return {
    storageGb: gb.length === 1 ? gb[0] : null,
    ramGb: null
  };
}

function normalizeImageUrl(value) {
  if (!value) return null;

  let text = String(value).trim();

  const markdownMatch = text.match(
    /^\[([^\]]+)\]\(([^)]+)\)$/
  );

  if (markdownMatch) {
    text = markdownMatch[2] || markdownMatch[1];
  }

  text = text.replace(
    /^https?:\/\/localhost:3001/,
    ''
  );

  text = text.replace(
    /^https?:\/\/127\.0\.0\.1:3001/,
    ''
  );

  text = text.replace(
    /^https?:\/\/host\.docker\.internal:3001/,
    ''
  );

  return text || null;
}

function calculateCampaignPrice(price, campaign) {
  const originalPrice = Number(price);

  if (!Number.isFinite(originalPrice)) {
    return 0;
  }

  if (!campaign) {
    return originalPrice;
  }

  const discountValue =
    Number(campaign.discountValue) || 0;

  if (campaign.discountType === 'percentage') {
    return Math.max(
      0,
      Math.round(
        originalPrice -
        originalPrice * discountValue / 100
      )
    );
  }

  return Math.max(
    0,
    originalPrice - discountValue
  );
}

// ============================================================
// API INPUT
// ============================================================

const items = $input.all();

let apiProducts = [];

if (
  items.length === 1 &&
  Array.isArray(items[0].json)
) {
  apiProducts = items[0].json;
} else {
  apiProducts = items.map(item => item.json);
}

// ============================================================
// REQUEST FILTERS
// ============================================================

const brandFilter =
  normalizeText(source.brand);

const canonicalFilters = source.conversationState?.active_filters || {};
const effectiveBrandFilter = brandFilter || normalizeText(canonicalFilters.brand);
const selectedProductId = source.selected_product_id ? String(source.selected_product_id)
  : (!source.model && source.conversationState?.selected_product_id ? String(source.conversationState.selected_product_id) : '');
const maxPriceFilter = source.price_max !== null && source.price_max !== undefined
  ? Number(source.price_max)
  : (canonicalFilters.price_max !== null && canonicalFilters.price_max !== undefined
      ? Number(canonicalFilters.price_max)
      : null);
const excludedBrandFilters = Array.isArray(source.conversationState?.excluded_brands)
  ? source.conversationState.excluded_brands.map(normalizeText)
  : [];

const modelFilter =
  compactText(source.model);

const colorFilter =
  normalizeText(source.color);

const storageFilter =
  source.storage_gb !== null &&
  source.storage_gb !== undefined
    ? Number(source.storage_gb)
    : null;

const ramFilter =
  source.ram_gb !== null &&
  source.ram_gb !== undefined
    ? Number(source.ram_gb)
    : null;

// ============================================================
// FIND PRODUCT
// ============================================================

const eligibleProducts = apiProducts.filter(product => {
  if (normalizeText(product.status) !== 'active' || product.category?.isActive === false) return false;
  const productBrands = [product.brand, product.category?.name, product.category?.slug]
    .filter(Boolean)
    .map(normalizeText);
  if (effectiveBrandFilter && !productBrands.includes(effectiveBrandFilter)) return false;
  if (excludedBrandFilters.some(brand => productBrands.includes(brand))) return false;
  return true;
});

let matchedProduct = null;
if (selectedProductId) {
  // A supplied canonical ID is authoritative. Do not fall back to a sibling SKU.
  matchedProduct = eligibleProducts.find(product => String(product.id) === selectedProductId) || null;
} else if (!modelFilter) {
  // An unreferenced detail request must not become a first-item catalog lookup.
  matchedProduct = null;
} else if (modelFilter) {
  const exactMatches = eligibleProducts.filter(product => compactText(product.name) === modelFilter);
  if (exactMatches.length === 1) {
    matchedProduct = exactMatches[0];
  } else if (exactMatches.length === 0) {
    const fuzzyMatches = eligibleProducts.filter(product => compactText(product.name).includes(modelFilter));
    if (fuzzyMatches.length === 1) matchedProduct = fuzzyMatches[0];
  }
} else {
  matchedProduct = null;
}

// ============================================================
// NO PRODUCT
// ============================================================

if (!matchedProduct) {
  return [
    {
      json: {
        result_type: 'no_result',
        total: 0,
        intent: 'product_detail',

        chatInput:
          source.chatInput ?? '',

        sessionId:
          source.sessionId ?? '',

        product: null
      }
    }
  ];
}

// ============================================================
// FILTER VARIANTS
// ============================================================

const matchedVariants = [];

const variants = Array.isArray(matchedProduct.variants)
  ? matchedProduct.variants
  : [];

for (const variant of variants) {

  const storageRaw = findAttribute(
    variant.attributes,
    [
      'Dung lÆ°á»£ng',
      'Dung luong',
      'Storage',
      'SSD'
    ]
  );

  const colorRaw = findAttribute(
    variant.attributes,
    [
      'Màu sắc',
      'Mau sac',
      'Color'
    ]
  );

  const directRam = findAttribute(
    variant.attributes,
    ['RAM']
  );

  const versionInfo =
    extractVersionInfo(variant.attributes);

  let storageGb =
    parseCapacity(storageRaw);

  let ramGb =
    parseCapacity(directRam);

  if (storageGb === null) {
    storageGb =
      versionInfo.storageGb;
  }

  if (ramGb === null) {
    ramGb =
      versionInfo.ramGb;
  }

  if (ramGb === null) {
    ramGb = parseCapacity(
      getSpecification(
        matchedProduct.specifications,
        'RAM'
      )
    );
  }

  // Requested storage
  if (
    storageFilter !== null &&
    storageGb !== storageFilter
  ) {
    continue;
  }

  // Requested RAM
  if (
    ramFilter !== null &&
    ramGb !== ramFilter
  ) {
    continue;
  }

  // Requested color
  if (colorFilter) {
    if (
      !normalizeText(colorRaw)
        .includes(colorFilter)
    ) {
      continue;
    }
  }

  const stock =
    Number(variant.stock) || 0;

  const originalPrice =
    Number(variant.price) || 0;

  const effectivePrice =
    calculateCampaignPrice(
      originalPrice,
      matchedProduct.activeCampaign
    );

  if (Number.isFinite(maxPriceFilter) && effectivePrice > maxPriceFilter) {
    continue;
  }

  matchedVariants.push({
    id: variant.id,

    sku: variant.sku,

    attributes:
      variant.attributes ?? {},

    storage_gb:
      storageGb,

    ram_gb:
      ramGb,

    color:
      colorRaw ?? null,

    color_code:
      variant.colorCode ?? null,

    original_price:
      originalPrice,

    price:
      effectivePrice,

    sale_price:
      variant.salePrice ?? null,

    stock,

    availability:
      stock > 0
        ? 'in_stock'
        : 'out_of_stock',

    image_url:
      normalizeImageUrl(
        variant.image ||
        matchedProduct.image ||
        matchedProduct.images?.[0]
      )
  });
}

// ============================================================
// PRODUCT EXISTS BUT REQUESTED VARIANT DOES NOT
// ============================================================

if (matchedVariants.length === 0) {
  return [
    {
      json: {
        result_type: 'no_result',
        total: 0,
        intent: 'product_detail',

        chatInput:
          source.chatInput ?? '',

        sessionId:
          source.sessionId ?? '',

        product: null
      }
    }
  ];
}

// ============================================================
// SORT
// in-stock first, then price
// ============================================================

matchedVariants.sort((a, b) => {
  if (
    a.availability !== b.availability
  ) {
    return a.availability === 'in_stock'
      ? -1
      : 1;
  }

  return a.price - b.price;
});

const inStockVariants =
  matchedVariants.filter(
    v => v.stock > 0
  );

const totalStock =
  matchedVariants.reduce(
    (sum, v) => sum + v.stock,
    0
  );

const prices =
  matchedVariants.map(v => v.price);

const selectedVariant =
  matchedVariants[0];

// ============================================================
// FINAL PRODUCT
// ============================================================

const product = {
  id:
    matchedProduct.id,

  name:
    matchedProduct.name,

  model:
    matchedProduct.name,

  brand:
    matchedProduct.brand ?? null,

  category:
    matchedProduct.category
      ? {
          id: matchedProduct.category.id,
          name: matchedProduct.category.name,
          slug: matchedProduct.category.slug
        }
      : null,

  description:
    matchedProduct.description ?? null,

  image_url:
    normalizeImageUrl(
      selectedVariant.image_url ||
      matchedProduct.image ||
      matchedProduct.images?.[0]
    ),

  images:
    Array.isArray(matchedProduct.images)
      ? matchedProduct.images
          .map(normalizeImageUrl)
          .filter(Boolean)
      : [],

  specifications:
    matchedProduct.specifications ?? [],

  screen:
    getSpecification(
      matchedProduct.specifications,
      'Màn hình'
    ),

  cpu:
    getSpecification(
      matchedProduct.specifications,
      'CPU'
    ) ||
    getSpecification(
      matchedProduct.specifications,
      'Chip'
    ),

  camera:
    getSpecification(
      matchedProduct.specifications,
      'Camera'
    ),

  battery:
    getSpecification(
      matchedProduct.specifications,
      'Pin'
    ),

  operating_system:
    getSpecification(
      matchedProduct.specifications,
      'Hệ điều hành'
    ),

  price:
    Math.min(...prices),

  price_min:
    Math.min(...prices),

  price_max:
    Math.max(...prices),

  stock:
    totalStock,

  availability:
    inStockVariants.length > 0
      ? 'in_stock'
      : 'out_of_stock',

  campaign:
    matchedProduct.activeCampaign
      ? {
          id:
            matchedProduct.activeCampaign.id,

          name:
            matchedProduct.activeCampaign.name,

          discountType:
            matchedProduct.activeCampaign.discountType,

          discountValue:
            matchedProduct.activeCampaign.discountValue
        }
      : null,

  variants:
    matchedVariants
};

// ============================================================
// OUTPUT
// ============================================================

return [
  {
    json: {
      result_type:
        'product_detail',

      total: 1,

      intent:
        'product_detail',

      chatInput:
        source.chatInput ?? '',

      sessionId:
        source.sessionId ?? '',

      product
    }
  }
];
