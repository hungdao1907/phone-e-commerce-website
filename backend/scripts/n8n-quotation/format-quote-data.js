
const apiItems = $input.all();
const source = $('Prepare Quote Filters').first().json;
const requests = Array.isArray(source.requests) ? source.requests : [];

// Check ambiguous follow-up from Prepare Quote Filters
if (source.ambiguous_followup) {
  return [
    {
      json: {
        result_type: 'quotation',
        quote_status: 'needs_variant_selection',
        ready_to_quote: false,
        ambiguous_followup: true,
        ambiguous_products: source.ambiguous_products || [],
        total_requested: requests.length,
        total_resolved: 0,
        request_results: [],
        products: [],

        requests,
        unresolved_indexes: [],
        chatInput: source.chatInput || '',
        sessionId: source.sessionId || '',
        source: source.source || 'web_chat'
      }
    }
  ];
}

// HELPERS
function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
    .replace(/Ă„â€˜/g, 'd')
    .replace(/Ă„Â/g, 'D')
    .toLowerCase()
    .trim();
}

function compactText(value) {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function tokenize(text) {
  const norm = normalizeText(text);
  return norm.split(/[^a-z0-9]+/).filter(Boolean);
}

function extractNumericModelTokens(text) {
  const norm = normalizeText(text);
  const tokens = tokenize(norm);
  const numericTokens = [];
  for (const t of tokens) {
    if (/^\d+$/.test(t)) {
      numericTokens.push(t);
    } else {
      const m = t.match(/^([a-z]+)(\d+)$/);
      if (m) {
        numericTokens.push(t);
        numericTokens.push(m[2]);
      }
    }
  }
  return [...new Set(numericTokens)];
}

function parseCapacity(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = normalizeText(value).replace(/\s+/g, '');
  const tb = text.match(/([\d.]+)tb/);
  if (tb) {
    const n = Number(tb[1]);
    return Number.isFinite(n) ? Math.round(n * 1024) : null;
  }
  const gb = text.match(/([\d.]+)gb/);
  if (gb) {
    const n = Number(gb[1]);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  if (/^\d+$/.test(text)) return Number(text);
  return null;
}

function findAttribute(attributes, possibleNames) {
  if (!attributes || typeof attributes !== 'object') return null;
  const wanted = possibleNames.map(normalizeText);
  for (const [key, value] of Object.entries(attributes)) {
    if (wanted.includes(normalizeText(key))) return value;
  }
  return null;
}

function getAttribute(variant, names) {
  return findAttribute(variant?.attributes, names);
}

function extractVersionInfo(attributes) {
  const version = findAttribute(attributes, ['Phiên bản', 'Phien ban', 'Version']);
  if (!version) return { ramGb: null, storageGb: null };
  const normalized = normalizeText(version);

  let storageGb = null;
  const tbMatch = normalized.match(/([\d.]+)\s*tb/);
  if (tbMatch) {
    const n = Number(tbMatch[1]);
    if (Number.isFinite(n)) storageGb = Math.round(n * 1024);
  }

  const gbMatches = [...normalized.matchAll(/([\d.]+)\s*gb/g)];
  let ramGb = null;

  if (storageGb !== null) {
    if (gbMatches.length > 0) {
      const n = Number(gbMatches[0][1]);
      if (Number.isFinite(n)) ramGb = Math.round(n);
    }
  } else {
    if (gbMatches.length >= 2) {
      const n1 = Number(gbMatches[0][1]);
      const n2 = Number(gbMatches[1][1]);
      if (Number.isFinite(n1)) ramGb = Math.round(n1);
      if (Number.isFinite(n2)) storageGb = Math.round(n2);
    } else if (gbMatches.length === 1) {
      const val = Number(gbMatches[0][1]);
      if (Number.isFinite(val)) {
        if (val >= 64) storageGb = Math.round(val);
        else ramGb = Math.round(val);
      }
    }
  }

  return { ramGb, storageGb };
}

function getSpecification(product, names) {
  const specs = product?.specifications;
  if (!specs) return null;
  const wanted = names.map(normalizeText);

  if (typeof specs === 'object' && !Array.isArray(specs)) {
    for (const [key, value] of Object.entries(specs)) {
      if (wanted.includes(normalizeText(key))) return value;
    }
    return null;
  }

  if (Array.isArray(specs)) {
    for (const spec of specs) {
      if (!spec || typeof spec !== 'object') continue;
      const key = spec?.key ?? spec?.name ?? spec?.label ?? '';
      if (key && wanted.includes(normalizeText(key))) return spec?.value ?? null;
      if (Array.isArray(spec?.items)) {
        for (const item of spec.items) {
          if (!item || typeof item !== 'object') continue;
          const itemKey = item?.key ?? item?.name ?? item?.label ?? '';
          if (itemKey && wanted.includes(normalizeText(itemKey))) return item?.value ?? null;
        }
      }
    }
  }
  return null;
}

function getProductRamForVariant(product, variantStorageGb) {
  const directRamSpec = getSpecification(product, ['RAM', 'Ram']);
  if (!directRamSpec) return null;

  const specText = normalizeText(directRamSpec);

  if (variantStorageGb) {
    const storagePattern = variantStorageGb >= 1024
      ? `(?:${Math.round(variantStorageGb / 1024)}\\s*tb|${variantStorageGb}\\s*gb)`
      : `${variantStorageGb}\\s*gb`;

    const specificRegex = new RegExp(`(?:phien ban|ban)?\\s*${storagePattern}\\s*:\\s*ram\\s*(\\d+)\\s*gb`, 'i');
    const match = specText.match(specificRegex);
    if (match) {
      const ram = Number(match[1]);
      if (Number.isFinite(ram) && ram > 0) return ram;
    }
  }

  const ramDirectMatch = specText.match(/ram\s*:\s*(\d+)\s*gb/i);
  if (ramDirectMatch) {
    const ram = Number(ramDirectMatch[1]);
    if (Number.isFinite(ram) && ram > 0) return ram;
  }

  const singleGbMatch = specText.match(/^(\d+)\s*gb$/i);
  if (singleGbMatch) {
    const ram = Number(singleGbMatch[1]);
    if (Number.isFinite(ram) && ram <= 64) return ram;
  }

  return null;
}

function isColorMatch(variantColorRaw, requestedColorNorm) {
  if (!requestedColorNorm) return true;
  if (!variantColorRaw) return false;
  const variantColorNorm = normalizeText(variantColorRaw);
  if (!variantColorNorm) return false;
  return (
    variantColorNorm === requestedColorNorm ||
    variantColorNorm.includes(requestedColorNorm) ||
    requestedColorNorm.includes(variantColorNorm)
  );
}

function normalizeImageUrl(value) {
  if (!value) return null;
  return String(value).trim().replace(/^https?:\/\/(?:localhost|127\.0\.0\.1|host\.docker\.internal):3001/i, '');
}

function getProductImage(product) {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    const first = product.images[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') return first.url ?? first.imageUrl ?? first.path ?? null;
  }
  return product?.image ?? product?.imageUrl ?? null;
}

function getVariantImage(product, variant) {
  return normalizeImageUrl(variant?.image ?? variant?.imageUrl ?? getProductImage(product));
}

function getCampaign(product) {
  return product?.activeCampaign ?? product?.campaign ?? null;
}

function calculatePrice(product, variant) {
  return { original_price: variant.original_price, price: variant.price, discount_amount: null };
}

// SAFE PRODUCT MATCHER CONTRACT
function matchProducts(products, requestedBrandRaw, requestedModelRaw) {
  const reqBrand = normalizeText(requestedBrandRaw);
  const reqModelNorm = normalizeText(requestedModelRaw);
  const reqModelCompact = compactText(requestedModelRaw);

  if (!reqModelCompact) return [];

  let brandCandidates = products;
  if (reqBrand) {
    brandCandidates = products.filter(p => {
      const pBrand = normalizeText(p.brand);
      return !pBrand || pBrand === reqBrand;
    });
  }

  // STAGE A Ă¢â‚¬â€ EXACT FULL NAME
  const exactCandidates = brandCandidates.filter(p => {
    const pNameNorm = normalizeText(p.name);
    const pNameCompact = compactText(p.name);
    const pBrand = normalizeText(p.brand);

    if (pNameNorm === reqModelNorm || pNameCompact === reqModelCompact) return true;
    if (pBrand && reqModelNorm === `${pBrand} ${pNameNorm}`) return true;
    if (pBrand && pNameNorm === `${pBrand} ${reqModelNorm}`) return true;
    if (pBrand && reqModelCompact === `${compactText(pBrand)}${pNameCompact}`) return true;
    if (pBrand && pNameCompact === `${compactText(pBrand)}${reqModelCompact}`) return true;

    return false;
  });

  if (exactCandidates.length > 0) {
    return exactCandidates;
  }

  // STAGE B Ă¢â‚¬â€ SAFE TOKEN MATCH WITH NUMERIC TOKEN PROTECTION
  const reqTokens = tokenize(reqModelNorm).filter(t => {
    if (reqBrand && t === reqBrand) return false;
    if (['gb', 'tb', '128gb', '256gb', '512gb', '1tb', '2tb', 'mau', 'color'].includes(t)) return false;
    return true;
  });

  const storageNumbers = new Set(['64', '128', '256', '512', '1024', '2048']);
  const reqNumericModelTokens = extractNumericModelTokens(reqModelNorm).filter(n => !storageNumbers.has(n));

  const scoredCandidates = [];

  for (const p of brandCandidates) {
    const pNameNorm = normalizeText(p.name);
    const pTokens = tokenize(pNameNorm);
    const pNumericTokens = extractNumericModelTokens(pNameNorm).filter(n => !storageNumbers.has(n));

    // Numeric Token Protection
    let numericMismatch = false;
    for (const reqNum of reqNumericModelTokens) {
      if (!pNumericTokens.includes(reqNum)) {
        numericMismatch = true;
        break;
      }
    }
    if (numericMismatch) continue;

    if (reqNumericModelTokens.length > 0 && pNumericTokens.length > 0) {
      const reqPureDigits = reqNumericModelTokens.filter(t => /^\d+$/.test(t));
      const pPureDigits = pNumericTokens.filter(t => /^\d+$/.test(t));
      if (reqPureDigits.length > 0 && pPureDigits.length > 0) {
        if (!reqPureDigits.some(d => pPureDigits.includes(d))) {
          continue;
        }
      }
    }

    const reqHasE = reqTokens.includes('16e') || (reqTokens.includes('16') && reqTokens.includes('e'));
    const pHasE = pTokens.includes('16e') || (pTokens.includes('16') && pTokens.includes('e'));
    if (reqHasE !== pHasE && (reqTokens.includes('16') || reqTokens.includes('16e'))) {
      continue;
    }

    const importantModifiers = ['pro', 'max', 'ultra', 'air', 'plus', 'mini', 'fe'];
    let modifierMismatch = false;
    for (const mod of importantModifiers) {
      const reqHasMod = reqTokens.includes(mod);
      const pHasMod = pTokens.includes(mod);
      if (reqHasMod && !pHasMod) {
        modifierMismatch = true;
        break;
      }
    }
    if (modifierMismatch) continue;

    const matchedTokensCount = reqTokens.filter(t => pTokens.includes(t) || pNameNorm.includes(t)).length;
    if (matchedTokensCount < reqTokens.length) {
      continue;
    }

    const extraTokensCount = Math.max(0, pTokens.length - reqTokens.length);
    const score = matchedTokensCount * 10 - extraTokensCount;

    scoredCandidates.push({ product: p, score });
  }

  scoredCandidates.sort((a, b) => b.score - a.score);
  if (scoredCandidates.length === 0) return [];
  const topScore = scoredCandidates[0].score;
  return scoredCandidates.filter(c => c.score === topScore).map(c => c.product);
}

// API RESPONSE
let products = [];
for (const item of apiItems) {
  const json = item?.json;
  if (Array.isArray(json)) { products.push(...json); continue; }
  if (json && Array.isArray(json.products)) { products.push(...json.products); continue; }
  if (json && Array.isArray(json.data)) { products.push(...json.data); continue; }
  if (json && typeof json === 'object' && (json.id || json.name || json.variants)) { products.push(json); }
}

products = products.filter(product => {
  if (product?.status !== undefined && product?.status !== null && normalizeText(product.status) !== 'active') return false;
  if (product?.isActive === false) return false;
  if (product?.category?.isActive === false) return false;
  return true;
});

const requestResults = [];
const quoteProducts = [];

for (const request of requests) {
  const requestedBrand = normalizeText(request?.brand);
  const requestedModelRaw = normalizeText(request?.model);
  const requestedColor = normalizeText(request?.color);
  let requestedStorage = toNumber(request?.storage_gb);
  const requestedRam = toNumber(request?.ram_gb);
  let quantity = Number(request?.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) quantity = 1;

  if (!requestedModelRaw) {
    requestResults.push({
      request_index: request?.request_index ?? null,
      status: 'invalid_request',
      requested: request,
      message: 'Chưa xác định được sản phẩm cần báo giá.'
    });
    continue;
  }

  const matchedProducts = request.product_id ? products.filter(p => p.id === request.product_id) : matchProducts(products, requestedBrand, requestedModelRaw);

  if (matchedProducts.length === 0) {
    requestResults.push({
      request_index: request.request_index,
      status: 'not_found',
      requested: request,
      message: 'Không tìm thấy sản phẩm phù hợp.'
    });
    continue;
  }

  if (matchedProducts.length > 1) {
    requestResults.push({
      request_index: request.request_index,
      status: 'not_found',
      requested: request,
      matching_products: matchedProducts.map(p => ({ id: p.id, name: p.name, brand: p.brand })),
      message: 'Tên sản phẩm chưa đủ rõ ràng để xác định chính xác.'
    });
    continue;
  }

  const product = matchedProducts[0];
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const matchedVariants = [];

  for (const variant of variants) {
    if (variant?.isActive === false || !Number.isSafeInteger(variant.price) || variant.price < 0) continue;
    if (request.variant_id && variant.id !== request.variant_id) continue;
    const directStorage = getAttribute(variant, ['Dung lượng', 'Dung luong', 'Storage', 'Bộ nhớ', 'Bo nho', 'Capacity', 'SSD']);
    const directRam = getAttribute(variant, ['RAM', 'Ram']);
    const versionInfo = extractVersionInfo(variant?.attributes);

    let storage = parseCapacity(directStorage);
    if (storage === null) storage = versionInfo.storageGb;
    if (storage === null) storage = parseCapacity(variant?.name);

    let color = getAttribute(variant, ['Màu sắc', 'Mau sac', 'Color', 'Màu', 'Mau']);
    if (color === null || color === undefined || color === '') color = variant?.color ?? null;
    color = color === null || color === undefined ? null : String(color).trim();

    let variantRam = parseCapacity(directRam);
    if (variantRam === null) variantRam = versionInfo.ramGb;
    if (variantRam === null) variantRam = getProductRamForVariant(product, storage);

    if (requestedStorage !== null && storage !== requestedStorage) continue;
    if (requestedRam !== null && variantRam !== requestedRam) continue;
    if (requestedColor && !isColorMatch(color, requestedColor)) continue;

    const prices = calculatePrice(product, variant);
    const rawStock = Number(variant?.stock ?? 0);
    const stock = Number.isFinite(rawStock) ? Math.max(0, rawStock) : 0;

    matchedVariants.push({
      id: variant.id,
      variant_id: variant.id,
      name: variant.name ?? null,
      sku: variant.sku ?? null,
      storage_gb: storage,
      ram_gb: variantRam,
      color,
      color_code: variant.colorCode ?? null,
      original_price: prices.original_price,
      price: prices.price,
      discount_amount: prices.discount_amount,
      stock,
      image_url: getVariantImage(product, variant)
    });
  }

  if (matchedVariants.length === 0) {
    requestResults.push({
      request_index: request.request_index,
      status: 'not_found',
      requested: request,
      product: { id: product.id, name: product.name, brand: product.brand },
      message: 'Không tìm thấy phiên bản phù hợp với yêu cầu.'
    });
    continue;
  }

  const inStockVariants = matchedVariants.filter(v => v.stock >= quantity);

  if (inStockVariants.length === 0) {
    requestResults.push({
      request_index: request.request_index,
      status: 'insufficient_stock',
      requested: request,
      product: { id: product.id, name: product.name, brand: product.brand },
      matched_variants: matchedVariants.map(v => ({ id: v.id, storage_gb: v.storage_gb, ram_gb: v.ram_gb, color: v.color, price: v.price, stock: v.stock })),
      quantity_requested: quantity,
      stock_available: 0,
      message: 'Các phiên bản phù hợp với yêu cầu hiện đều hết hàng.'
    });
    continue;
  }

  if (inStockVariants.length > 1) {
    const availableVariants = inStockVariants.map(v => ({
      id: v.id,
      variant_id: v.variant_id,
      sku: v.sku,
      storage_gb: v.storage_gb,
      ram_gb: v.ram_gb,
      color: v.color,
      original_price: v.original_price,
      price: v.price,
      stock: v.stock
    })).sort((a, b) => {
      const storageA = Number(a.storage_gb ?? 0);
      const storageB = Number(b.storage_gb ?? 0);
      if (storageA !== storageB) return storageA - storageB;
      const ramA = Number(a.ram_gb ?? 0);
      const ramB = Number(b.ram_gb ?? 0);
      if (ramA !== ramB) return ramA - ramB;
      return String(a.color ?? '').localeCompare(String(b.color ?? ''), 'vi');
    });

    requestResults.push({
      request_index: request.request_index,
      status: 'needs_variant_selection',
      requested: request,
      product: { id: product.id, name: product.name, brand: product.brand },
      available_variants: availableVariants,
      message: 'Cần chọn chính xác phiên bản trước khi tạo báo giá.'
    });
    continue;
  }

  const variant = inStockVariants[0];

  if (variant.stock < quantity) {
    requestResults.push({
      request_index: request.request_index,
      status: 'insufficient_stock',
      requested: request,
      product: { id: product.id, name: product.name, brand: product.brand },
      variant: { id: variant.id, variant_id: variant.variant_id, sku: variant.sku, storage_gb: variant.storage_gb, ram_gb: variant.ram_gb, color: variant.color, original_price: variant.original_price, price: variant.price, stock: variant.stock },
      quantity_requested: quantity,
      stock_available: variant.stock,
      message: `Khách yêu cầu ${quantity} sản phẩm nhưng hiện chỉ còn ${variant.stock}.`
    });
    continue;
  }

  const subtotal = undefined;
  const quoteProduct = {
    request_index: request.request_index,
    id: product.id,
    product_id: product.id,
    variant_id: variant.id,
    sku: variant.sku,
    brand: product.brand ?? '',
    model: product.name ?? product.model ?? '',
    storage_gb: variant.storage_gb,
    ram_gb: variant.ram_gb,
    color: variant.color,
    original_price: variant.original_price,
    unit_price: variant.price,
    discount_amount: variant.discount_amount,
    quantity,
    stock: variant.stock,
    enough_stock: true,
    subtotal,
    campaign: getCampaign(product),
    image_url: variant.image_url,
    description: product.description ?? null
  };

  quoteProducts.push(quoteProduct);
  requestResults.push({ request_index: request.request_index, status: 'ready', requested: request, resolved_product: quoteProduct });
}

let quoteStatus = 'ready';
if (requests.length === 0) quoteStatus = 'invalid_request';
else if (requestResults.some(item => item.status === 'invalid_request')) quoteStatus = 'invalid_request';
else if (requestResults.some(item => item.status === 'not_found')) quoteStatus = 'not_found';
else if (requestResults.some(item => item.status === 'needs_variant_selection')) quoteStatus = 'needs_variant_selection';
else if (requestResults.some(item => item.status === 'insufficient_stock')) quoteStatus = 'insufficient_stock';

const readyToQuote = quoteStatus === 'ready' && requests.length > 0 && quoteProducts.length === requests.length;
const subtotal = undefined;

const unresolvedIdxs = requestResults
  .filter(r => r.status === 'needs_variant_selection')
  .map(r => r.request_index);

return [
  {
    json: {
      result_type: 'quotation',
      quote_status: quoteStatus,
      ready_to_quote: readyToQuote,
      total_requested: requests.length,
      total_resolved: quoteProducts.length,
      request_results: requestResults,
      products: quoteProducts,

      requests,
      unresolved_indexes: unresolvedIdxs,
      chatInput: source.chatInput || '',
      sessionId: source.sessionId || '',
      source: source.source || 'web_chat'
    }
  }
];
