
const original = ($json && typeof $json === 'object' && !Array.isArray($json)) ? $json : {};
const input = original;
const normalizeInput = $('Normalize Input').first().json || {};
const router = $('Resolve Quotation Turn').first().json || {};

function toPlainObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to the safe empty state
    }
  }
  return {};
}

const priorConversationState = toPlainObject(
  normalizeInput.conversationState ?? input.conversation_state ?? input.context
);
const routedConversationState = toPlainObject(router.conversationState);
// Validate Router is the single source of truth for the current turn. Using
// its resolved state prevents stale positive preferences from being restored
// after an exclusion/refinement response.
const explicitDetail = router.intent === 'product_detail' && router.explicit_product_model === true;
const preserveShoppingCriteria = explicitDetail || input.result_type === 'faq' || (router.turn_action !== 'SWITCH' && (
  router.intent === 'product_detail' ||
  router.intent === 'product_compare' ||
  router.turn_action === 'SELECT' ||
  router.turn_action === 'COMPARE'
));
const previous = preserveShoppingCriteria
  ? priorConversationState
  : (Object.keys(routedConversationState).length > 0
      ? routedConversationState
      : priorConversationState);

function normalize(value) {
  return String(value ?? '')
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function safeNode(name) {
  try { return $(name).first().json || {}; } catch { return {}; }
}

function unique(values) { return [...new Set(values.filter(Boolean))]; }

const stateCategory = preserveShoppingCriteria
  ? (previous.category || null)
  : (router.category || previous.category || null);
const previousActive = previous.active_filters && typeof previous.active_filters === 'object' ? previous.active_filters : {};
const activeFilters = { ...previousActive };

if (!preserveShoppingCriteria && router.context_mode === 'reset') {
  for (const key of ['brand', 'price_max', 'storage_gb', 'ram_gb', 'color', 'use_case']) delete activeFilters[key];
}

for (const [key, value] of Object.entries({
  brand: router.brand,
  price_max: router.price_max,
  storage_gb: router.storage,
  ram_gb: router.ram,
  color: router.color,
  use_case: router.use_case
})) {
  if (preserveShoppingCriteria) continue;
  if (router.turn_action === 'SELECT' && key === 'brand') continue;
  if (value !== null && value !== undefined && value !== '') activeFilters[key] = value;
}

const resultSources = [
  safeNode('Format Product Results').products,
  safeNode('Format Recommendation Data').products,
  safeNode('Format Compare Data').products
];
let displayedProducts = resultSources.find(value => Array.isArray(value) && value.length > 0) || [];
if (!displayedProducts.length && safeNode('Format Product Detail').product) {
  displayedProducts = [safeNode('Format Product Detail').product];
}
if (!displayedProducts.length && Array.isArray(input.products) && input.products.length > 0) {
  displayedProducts = input.products;
}

const previousResults = Array.isArray(previous.last_result_set) ? previous.last_result_set : [];
const lastResultSet = displayedProducts.length
  ? displayedProducts.map((product, index) => ({
      position: index + 1,
      id: product?.id || null,
      name: product?.name || product?.model || '',
      brand: product?.brand || null,
      category: product?.category?.name || product?.category?.slug || product?.category || null,
      price_min: product?.price_min ?? product?.price ?? null,
      price_max: product?.price_max ?? product?.price ?? null
    }))
  : (preserveShoppingCriteria ? previousResults : (router.context_mode === 'reset' ? [] : previousResults));

let selectedProductId = !preserveShoppingCriteria && router.context_mode === 'reset' || router.turn_action === 'SELECT'
  ? (router.selected_product_id || null)
  : (router.selected_product_id || previous.selected_product_id || null);
const selectedIndex = Number(router.selected_result_index);
if (explicitDetail && input.result_type === 'product_detail' && displayedProducts.length === 1) {
  selectedProductId = displayedProducts[0].id || null;
}
if (Number.isInteger(selectedIndex) && selectedIndex > 0 && lastResultSet[selectedIndex - 1]) {
  selectedProductId = lastResultSet[selectedIndex - 1].id || selectedProductId;
}

const previousRejectedProducts = router.context_mode === 'reset'
  ? []
  : (Array.isArray(previous.rejected_products) ? previous.rejected_products : []);
const routedRejectedProducts = Array.isArray(router.rejected_products)
  ? router.rejected_products
  : [];
const rejectedProductsById = new Map(
  [...previousRejectedProducts, ...routedRejectedProducts]
    .filter(product => product && product.id)
    .map(product => [String(product.id), product])
);
const rejectedProducts = [...rejectedProductsById.values()];

const quotePending = input.quote_status === 'needs_variant_selection'
  ? {
      type: 'quotation',
      field: 'variant',
      product_id: input.request_results?.[0]?.product?.id || null,
      product_name: input.request_results?.[0]?.product?.name || null,
      options: input.request_results?.[0]?.available_variants || []
    }
  : null;
const quoteProductPending = input.result_type === 'quotation' && input.quote_status === 'invalid_request'
  ? {type:'quotation',field:'product',options:[]} : null;
const quoteReadyPending = input.result_type === 'quotation' && input.ready_to_quote === true && input.products?.length === 1
  ? {type:'quotation',field:'ready',product_id:input.products[0].id,product_name:input.products[0].name,
      quantity:input.products[0].quantity,options:[{id:input.products[0].variant_id,variant_id:input.products[0].variant_id}]} : null;
const pending = router.turn_action === 'CANCEL'
  ? null
  : (router.requires_clarification
    ? {
        type: 'clarification',
        field: router.clarification_field || 'unknown',
        options: []
      }
    : (quoteReadyPending || quotePending || quoteProductPending || ((input.result_type === 'quotation' && input.ready_to_quote === true) || router.turn_action === 'REJECT' || router.turn_action === 'SELECT' || router.turn_action === 'CONFIRM'
      ? null
      : (previous.pending_question || null))));

const excludedBrandSource = preserveShoppingCriteria
  ? (Array.isArray(previous.excluded_brands) ? previous.excluded_brands : [])
  : (router.context_mode === 'reset'
      ? (Array.isArray(router.excluded_brands) ? router.excluded_brands : [])
      : (Array.isArray(router.excluded_brands)
          ? router.excluded_brands
          : (Array.isArray(previous.excluded_brands) ? previous.excluded_brands : [])));
const excludedBrands = unique([
  ...excludedBrandSource,
  ...(preserveShoppingCriteria || !Array.isArray(router.exclude_brands) ? [] : router.exclude_brands)
]).filter(brand => !activeFilters.brand || normalize(brand) !== normalize(activeFilters.brand));
const preferredBrandSource = preserveShoppingCriteria
  ? (Array.isArray(previous.preferred_brands) ? previous.preferred_brands : [])
  : (router.context_mode === 'reset'
      ? (Array.isArray(router.preferred_brands) ? router.preferred_brands : [])
      : (Array.isArray(router.preferred_brands)
          ? router.preferred_brands
          : (Array.isArray(previous.preferred_brands) ? previous.preferred_brands : [])));
const preferredBrands = unique([
  ...preferredBrandSource,
  activeFilters.brand
]);

const conversationState = {
  category: stateCategory,
  active_filters: activeFilters,
  preferred_brands: preferredBrands,
  excluded_brands: excludedBrands,
  rejected_products: rejectedProducts,
  last_result_set: lastResultSet,
  selected_product_id: input.result_type === 'quotation' && input.products?.length === 1 ? input.products[0].id : selectedProductId,
  selected_variant_id: input.result_type === 'quotation' ? (input.ready_to_quote ? input.products?.[0]?.variant_id || null : null) : (explicitDetail || !preserveShoppingCriteria && router.context_mode === 'reset' ? null : (previous.selected_variant_id || null)),
  last_intent: router.intent || previous.last_intent || null,
  last_turn_action: router.turn_action || previous.last_turn_action || 'CONTINUE',
  pending_question: pending,
  state_version: 2,
  updated_at: new Date().toISOString()
};

const output = {
  json: {
    ...input,
    conversation_state: conversationState
  }
};
if (input.binary) output.binary = input.binary;
return output;
