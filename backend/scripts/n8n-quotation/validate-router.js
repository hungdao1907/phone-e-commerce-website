
const input = $json;

let rawText = "";
if (Array.isArray(input.content?.parts)) {
  rawText = input.content.parts.map(p => p.text || "").join("");
} else if (typeof input.content?.parts?.[0]?.text === "string") {
  rawText = input.content.parts[0].text;
} else if (typeof input.text === "string") {
  rawText = input.text;
}

rawText = String(rawText).trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

let data;
try {
  data = JSON.parse(rawText);
} catch (error) {
  try {
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      data = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
    } else {
      throw new Error("Không tìm thấy JSON object");
    }
  } catch (secondError) {
    data = { intent: "default", brand: "", model: "", storage: "", ram: "", color: "", price_max: null, condition: "", use_case: "", faq_topic: "", faq_topics: [], products: [] };
  }
}

const validIntents = ["product_search", "product_detail", "product_compare", "recommendation", "faq", "quotation", "default"];
let rawIntent = String(data.intent || "").trim().toLowerCase();
let intent = validIntents.includes(rawIntent) ? rawIntent : "default";

const normalizeInput = $("Normalize Input").first().json;
const chatInput = normalizeInput?.chatInput || "";
const sessionId = normalizeInput?.sessionId || "";
const source = normalizeInput?.source || "web_chat";

let pendingRow = null;
try {
  const dtItems = $("Pending Quote - Lookup").all();
  if (dtItems && dtItems.length > 0 && dtItems[0].json && dtItems[0].json.session_id) {
    pendingRow = dtItems[0].json;
  }
} catch (e) {}

const now = Date.now();
let isPendingValid = false;
let pendingRequests = [];

if (pendingRow && pendingRow.session_id) {
  const expiresAt = Number(pendingRow.expires_at || 0);
  if (expiresAt > now) {
    try {
      pendingRequests = typeof pendingRow.requests_json === "string" ? JSON.parse(pendingRow.requests_json) : (pendingRow.requests || []);
      if (Array.isArray(pendingRequests) && pendingRequests.length > 0) {
        isPendingValid = true;
      }
    } catch (e) {}
  }
}

function normalizePendingMatchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLowerCase()
    .trim();
}

function pendingRequestHasMissingField(request) {
  return [request?.color, request?.storage_gb, request?.ram_gb]
    .some(value => value === null || value === undefined || String(value).trim() === "");
}

function hasFollowupAttribute(text) {
  return [
    /\b(?:mau|color)\b/i,
    /\b(?:bac|den|trang|vang|tim|hong|xanh|titan|silver|black|white|gold|jet black)\b/i,
    /\bram\s*\d+\b/i,
    /\b\d+\s*gb\s*ram\b/i,
    /\b\d+(?:[.,]\d+)?\s*tb\b/i,
    /\b(?:64|128|256|512|1024|2048)\s*gb\b/i,
    /\b\d+\s*(?:inch|mm)\b/i,
    /\b(?:gps|cellular|wifi|5g|4g)\b/i,
    /\b(?:nhom|titanium|chat lieu|material)\b/i
  ].some(pattern => pattern.test(text));
}

let isFollowup = false;
if (isPendingValid) {
  const normalizedChat = String(chatInput || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const isProductInfoQuestion = /\b(?:chong nuoc|waterproof|bao hanh|thong so|thong tin|camera|pin|man hinh)\b/i.test(normalizedChat)
    && /\b(?:co|khong|nao|the nao|nhu the nao)\b/i.test(normalizedChat);
  if (isProductInfoQuestion && intent !== "faq") {
    // An unrelated product-info question must be answered without consuming
    // or retargeting the pending quotation.
    intent = "product_detail";
  }
  const isExplicitOther = intent === "faq" || intent === "product_compare" || intent === "product_detail" || isProductInfoQuestion;
  if (!isExplicitOther) {
    const hasAttributeMention = /(?:ram|\d+\s*(?:gb|tb)|mau|color|bac|den|trang|vang|tim|hong|xanh|titan|silver|black|white|gold|\b36\b|\b48\b|\b16\b|\b32\b|\b256\b|\b512\b|\b1tb\b|\b2tb\b)/i.test(normalizedChat);
    if (hasAttributeMention || intent === "quotation") {
      intent = "quotation";
      isFollowup = true;
    }
  }
}
function parseExplicitUserBudget(value) {
  const normalized = String(value || '')
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const match = normalized.match(/\b(?:duoi|toi da|tam|khoang|ngan sach|budget|khong qua|gia duoi|gia khoang)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|million|m|nghin|ngan|k)\b/i);
  if (!match) return null;
  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const unit = match[2].toLowerCase();
  const multiplier = ['trieu', 'tr', 'million', 'm'].includes(unit) ? 1000000 : 1000;
  return Math.round(amount * multiplier);
}

const explicitUserBudget = parseExplicitUserBudget(chatInput);
let priceMax = data.price_max;
if (priceMax === '' || priceMax === undefined || priceMax === null) {
  priceMax = null;
} else {
  if (typeof priceMax === 'string') priceMax = priceMax.replace(/\./g, '').replace(/,/g, '').trim();
  priceMax = Number(priceMax);
  if (!Number.isFinite(priceMax) || priceMax < 0) priceMax = null;
}


function normalizeStorageGb(value, rawText) {
  if (typeof value === 'string' && value.trim()) {
    const v = value.trim().toLowerCase();
    const tbMatch = v.match(/(\d+(?:[.,]\d+)?)\s*tb/i);
    if (tbMatch) {
      const num = Number(tbMatch[1].replace(',', '.'));
      if (Number.isFinite(num) && num > 0) return Math.round(num * 1024);
    }
    const gbMatch = v.match(/(\d+)\s*gb/i);
    if (gbMatch) {
      const num = Number(gbMatch[1]);
      if (Number.isFinite(num) && num > 0) return num;
    }
  }

  let rawStorageGb = null;
  if (rawText && typeof rawText === 'string') {
    const raw = rawText.toLowerCase();
    const rawTbMatches = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*tb/gi)];
    if (rawTbMatches.length > 0) {
      const num = Number(rawTbMatches[0][1].replace(',', '.'));
      if (Number.isFinite(num) && num > 0) {
        rawStorageGb = Math.round(num * 1024);
      }
    } else {
      const withoutRam = raw
        .replace(/ram\s*[:\s]?\s*\d+\s*gb/gi, '')
        .replace(/\d+\s*gb\s*ram/gi, '');
      const rawGbMatches = [...withoutRam.matchAll(/(\d+)\s*gb/gi)];
      for (const m of rawGbMatches) {
        const num = Number(m[1]);
        if (num >= 64) {
          rawStorageGb = num;
          break;
        }
      }
    }
  }

  if (rawStorageGb !== null) {
    return rawStorageGb;
  }

  if (value !== null && value !== undefined && value !== '') {
    const num = Number(String(value).replace(/[^\d.]/g, ''));
    if (Number.isFinite(num) && num > 0) {
      return Math.round(num);
    }
  }

  return null;
}

function normalizeRamGb(value, rawText) {
  if (typeof value === 'string' && value.trim()) {
    const v = value.trim().toLowerCase();
    const ramMatch = v.match(/(\d+)\s*gb/i) || v.match(/(\d+)/);
    if (ramMatch) {
      const num = Number(ramMatch[1]);
      if (Number.isFinite(num) && num <= 64) return num;
    }
  }

  if (typeof value === 'number' && Number.isFinite(value) && value <= 64) {
    return value;
  }

  if (rawText && typeof rawText === 'string') {
    const raw = rawText.toLowerCase();
    const ramMatch1 = raw.match(/ram\s*[:\s]?\s*(\d+)\s*(?:gb)?/i);
    const ramMatch2 = raw.match(/(\d+)\s*gb\s*ram/i);
    if (ramMatch1) {
      const num = Number(ramMatch1[1]);
      if (Number.isFinite(num) && num <= 64) return num;
    }
    if (ramMatch2) {
      const num = Number(ramMatch2[1]);
      if (Number.isFinite(num) && num <= 64) return num;
    }
  }

  return null;
}


function getProductRawText(product, index, products, fullText) {
  const text = String(fullText || "");
  if (!Array.isArray(products) || products.length <= 1) return text;
  const lower = text.toLowerCase();
  const model = typeof product?.model === "string" ? product.model.trim() : "";
  const brand = typeof product?.brand === "string" ? product.brand.trim() : "";
  const currentHints = [model, brand && model ? `${brand} ${model}` : ""]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  let start = -1;
  for (const hint of currentHints) {
    const pos = lower.indexOf(hint.toLowerCase());
    if (pos !== -1 && (start === -1 || pos < start)) start = pos;
  }
  if (start === -1) return "";
  let end = text.length;
  products.forEach((other, otherIndex) => {
    if (otherIndex === index) return;
    const otherModel = typeof other?.model === "string" ? other.model.trim() : "";
    const otherBrand = typeof other?.brand === "string" ? other.brand.trim() : "";
    const otherHints = [otherModel, otherBrand && otherModel ? `${otherBrand} ${otherModel}` : ""]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    for (const hint of otherHints) {
      const pos = lower.indexOf(hint.toLowerCase(), start + 1);
      if (pos > start && pos < end) end = pos;
    }
  });
  return text.slice(start, end);
}

function parseExplicitQuantity(rawText) {
  const normalized = String(rawText || '')
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const match = normalized.match(/\b(?:so luong|sl|mua|lay|can)\s*(\d+)\b/i) ||
    normalized.match(/(?:^|\s)(\d+)\s*(?:cai|chiec|may)\b/i);
  const parsed = match ? Number(match[1]) : null;
  return Number.isInteger(parsed) && parsed > 0
    ? { quantity: parsed, quantity_explicit: true }
    : { quantity: 1, quantity_explicit: false };
}

const topLevelQuantity = parseExplicitQuantity(chatInput);

let products = [];
if ((intent === "product_compare" || intent === "quotation") && Array.isArray(data.products)) {
  products = data.products
    .map((product, index) => {
      const scopedRawText = getProductRawText(product, index, data.products, chatInput);
      const quantityInfo = parseExplicitQuantity(scopedRawText);
      return {
        index: Number.isInteger(product?.index) ? product.index : index + 1,
        brand: typeof product?.brand === "string" ? product.brand.trim() : "",
        model: typeof product?.model === "string" ? product.model.trim() : "",
        storage_gb: normalizeStorageGb(product?.storage_gb ?? product?.storage, scopedRawText),
        ram_gb: normalizeRamGb(product?.ram_gb ?? product?.ram, scopedRawText),
        color: typeof product?.color === "string" && product.color.trim() ? product.color.trim() : null,
        quantity: quantityInfo.quantity,
        quantity_explicit: quantityInfo.quantity_explicit
      };
    })
    .filter(product => product.model || product.brand);
}


// LIVE-17: recover names the customer EXPLICITLY gave if the router
// shortens a model suffix. Extract only independently recognizable device
// families. Do not infer products from history or invent catalog facts.
if (intent === 'product_compare') {
  const explicitModels = [];
  const namedPattern = /\b(?:iphone\s+\d+(?:\s+(?:pro\s+max|pro|plus|mini|e))?|samsung\s+galaxy\s+(?:s|z\s*fold|z\s*flip)\s*\d+(?:\s+(?:ultra|plus|fe))?|galaxy\s+(?:s|z\s*fold|z\s*flip)\s*\d+(?:\s+(?:ultra|plus|fe))?)\b/gi;
  for (const found of String(chatInput).matchAll(namedPattern)) {
    const raw = found[0].trim();
    const key = raw.toLowerCase().replace(/\s+/g,'');
    if (explicitModels.some(item => item.key === key)) continue;
    const brand = /^iphone\b/i.test(raw) ? 'Apple' : 'Samsung';
    explicitModels.push({key, brand, model:raw});
  }
  if (explicitModels.length >= 2) {
    products = explicitModels.map((item,index) => ({
      index:index+1, brand:item.brand, model:item.model,
      storage_gb:null, ram_gb:null, color:null, quantity:1,
      quantity_explicit:false
    }));
  }
}

// ============================================================
// DIALOGUE STATE / TURN ACTION NORMALIZATION
// The router proposes semantics; this block validates and merges
// only safe, structured values before any branch runs.
// ============================================================

let previousConversationState =
  normalizeInput?.conversationState &&
  typeof normalizeInput.conversationState === 'object' &&
  !Array.isArray(normalizeInput.conversationState)
    ? normalizeInput.conversationState
    : {};

let previousActiveFilters =
  previousConversationState.active_filters &&
  typeof previousConversationState.active_filters === 'object'
    ? previousConversationState.active_filters
    : {};

function dialogueNormalize(value) {
  return String(value ?? '')
    // Runtime execution data contains replacement/mis-decoded Vietnamese bytes
    // (for example: kh�ng, khÃ´ng, khĂ´ng). Keep chatInput untouched, but make
    // deterministic routing tolerant of those representations.
    .replace(/kh(?:\uFFFD|\?|Ã´|Ă´)ng/giu, 'khong')
    .replace(/(?:đ|d)i[?]n\s+tho[?]i/giu, 'dien thoai')
    .replace(/kho[?]ng/giu, 'khoang')
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const dialogueAliases = {
  Apple: ['apple', 'iphone', 'ipad', 'macbook'],
  Samsung: ['samsung', 'galaxy'],
  Xiaomi: ['xiaomi', 'redmi', 'poco'],
  Oppo: ['oppo'],
  OnePlus: ['oneplus', 'one plus'],
  Vivo: ['vivo'],
  Honor: ['honor']
};

function dialogueBrands(text) {
  const value = dialogueNormalize(text);
  return Object.entries(dialogueAliases)
    .filter(([, aliases]) => aliases.some(alias => value.includes(alias)))
    .map(([brand]) => brand);
}

function dialogueProductMatchesBrand(product, brand) {
  if (!product || !brand) return false;
  return [product.brand, product.category, product.name]
    .filter(Boolean)
    .some(value => dialogueBrands(value).includes(brand));
}

function dialogueCategory(text) {
  const value = dialogueNormalize(text);
  if (/dong ho|smartwatch|watch/.test(value)) return 'watch';
  if (/laptop|macbook|may tinh xach tay/.test(value)) return 'laptop';
  if (/tablet|ipad|may tinh bang/.test(value)) return 'tablet';
  if (/dien thoai|smartphone|iphone|galaxy|samsung|xiaomi|redmi|poco|oppo|oneplus/.test(value)) return 'phone';
  return null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const dialogueText = dialogueNormalize(chatInput);
const dialogueCurrentBrands = dialogueBrands(dialogueText);
const dialogueCurrentCategory = dialogueCategory(dialogueText);
const dialoguePreviousCategory = previousConversationState.category || null;
const dialogueTopicScopeChanged = Boolean(
  dialogueCurrentCategory &&
  dialoguePreviousCategory &&
  dialogueCurrentCategory !== dialoguePreviousCategory
);
if (dialogueTopicScopeChanged) {
  // Keep session infrastructure outside this object, but do not carry
  // shopping constraints/referents into a different product category.
  previousConversationState = { category: dialogueCurrentCategory, state_version: 2 };
  previousActiveFilters = {};
}
const dialogueOtherBrand =
  /\b(hang|thuong hieu|brand)\b.*\b(khac|other)\b/.test(dialogueText) ||
  /\b(doi|chuyen|chon)\b.*\b(hang|thuong hieu|brand)\b.*\b(khac|other)\b/.test(dialogueText) ||
  /\b(mau|con|cai|loai)\b.*\b(khac|other)\b/.test(dialogueText);
const dialogueHasNegative = /\b(khong|khong thich|bo|khong muon|khong dung|dung lay|khong lay|khong can)\b/.test(dialogueText);
const dialogueReject = /^(khong|khong phai|khong can|khong muon)$/.test(dialogueText);
const dialogueNegativeBrands = (() => {
  const result = [];
  const brandNegation = /\b(?:khong|bo|dung)\s+(?:(?:muon|thich|lay|chon|can|thuoc|hang|thuong|hieu|brand)\s+)*(apple|iphone|ipad|macbook|samsung|galaxy|xiaomi|redmi|poco|oppo|oneplus|vivo|honor)\b/g;
  for (const match of dialogueText.matchAll(brandNegation)) {
    result.push(...dialogueBrands(match[1]));
  }
  return unique(result);
})();
const dialoguePriceDirection =
  /re hon|gia thap hon|dat qua|giam gia/.test(dialogueText)
    ? 'lower'
    : /dat hon|gia cao hon/.test(dialogueText)
      ? 'higher'
      : null;
const dialogueCancel = /^(?:thoi|dung|huy|huy bao gia|huy yeu cau|bo qua|khong can|khong can nua|khong can bao gia)$/.test(dialogueText);
const dialogueConfirm = /^(ok|uh|u|duoc|duoc roi|dung|co|yes)$/.test(dialogueText);
const dialogueNumberWords = {
  mot: 1,
  nhat: 1,
  hai: 2,
  ba: 3,
  bon: 4,
  tu: 4,
  nam: 5
};
const selectedIndexMatch = dialogueText.match(/(?:mau|con|cai|so)\s*(?:thu|so)?\s*(\d+)/i);
const selectedFirstMatch = dialogueText.match(/(?:mau|con|cai)\s+(?:dau tien|dau|thu nhat)\b/i);
const selectedWordMatch = dialogueText.match(/(?:mau|con|cai)\s*(?:thu)?\s*(mot|nhat|hai|ba|bon|tu|nam)\b/i);
const dialogueSelectedIndex = selectedIndexMatch
  ? Number(selectedIndexMatch[1])
  : (selectedFirstMatch || selectedWordMatch && ['mot', 'nhat'].includes(selectedWordMatch[1]))
    ? 1
    : selectedWordMatch
      ? dialogueNumberWords[selectedWordMatch[1]]
      : null;
const dialogueComparisonIndexes = [...dialogueText.matchAll(/(?:mau|con|cai|so)\s*(?:thu|so)?\s*(\d+)/gi)]
  .map(match => Number(match[1]))
  .filter(index => Number.isInteger(index) && index > 0);
const pendingQuestion = previousConversationState.pending_question || null;
const hasPendingAction = Boolean(pendingQuestion && typeof pendingQuestion === 'object');

let resolvedIntent = intent;
let resolvedBrand = typeof data.brand === 'string' ? data.brand.trim() : '';
let resolvedModel = typeof data.model === 'string' ? data.model.trim() : '';
let resolvedStorage = typeof data.storage === 'string' ? data.storage.trim() : '';
let resolvedRam = typeof data.ram === 'string' ? data.ram.trim() : '';
let resolvedColor = typeof data.color === 'string' ? data.color.trim() : '';
let resolvedUseCase = typeof data.use_case === 'string' ? data.use_case.trim() : '';

// Only explicit user wording may create a new positive preference. A product
// returned by the model is conversational output, not a user-selected brand
// or configuration. Existing state remains valid when it was already explicit.
const previousBrandContext = unique([
  previousActiveFilters.brand,
  ...(Array.isArray(previousConversationState.preferred_brands)
    ? previousConversationState.preferred_brands
    : [])
].flatMap(value => dialogueBrands(value)));
const resolvedBrandCanonical = dialogueBrands(resolvedBrand)[0] || dialogueNormalize(resolvedBrand);
const hasExplicitCurrentBrand = dialogueCurrentBrands.includes(resolvedBrandCanonical);
const hasPreviousBrandContext = previousBrandContext.includes(resolvedBrandCanonical);

const dialogueTextWithoutRam = dialogueText
  .replace(/\bram\s*[:\s]?\s*\d+\s*gb\b/gi, ' ')
  .replace(/\b\d+\s*gb\s*ram\b/gi, ' ');
const dialogueHasExplicitStorage =
  /\b(?:dung luong|bo nho|storage)\b/i.test(dialogueText) ||
  /\b\d+(?:[.,]\d+)?\s*(?:tb|gb)\b/i.test(dialogueTextWithoutRam);
const dialogueHasExplicitRam = /\bram\b|\b\d+\s*gb\s*ram\b/i.test(dialogueText);
const dialogueHasExplicitColor =
  /\b(?:mau|color|den|trang|bac|xam|vang|tim|hong|xanh|titan|silver|black|white|gold|green|blue|red)\b/i.test(dialogueText);

if (
  resolvedBrand &&
  !hasExplicitCurrentBrand &&
  !hasPreviousBrandContext
) {
  resolvedBrand = '';
}

// Do not persist model-inferred product attributes from a clean, budget-only
// request. They become active filters only when the user actually mentioned
// them (or when an earlier explicit filter is being continued).
if (!dialogueHasExplicitStorage && !previousActiveFilters.storage_gb) resolvedStorage = '';
if (!dialogueHasExplicitRam && !previousActiveFilters.ram_gb) resolvedRam = '';
if (!dialogueHasExplicitColor && !previousActiveFilters.color) resolvedColor = '';


// An explicit negative brand preference wins over any brand/model emitted by the LLM.
// Keep the existing category and budget context, but never turn "không iPhone"
// into a positive Apple filter.
if (dialogueNegativeBrands.length > 0) {
  resolvedBrand = '';
  if (dialogueBrands(resolvedModel).some(brand => dialogueNegativeBrands.includes(brand))) {
    resolvedModel = '';
  }
  if (resolvedIntent === 'default' || resolvedIntent === 'faq' || resolvedIntent === 'product_detail') {
    resolvedIntent = previousConversationState.last_intent === 'recommendation'
      ? 'recommendation'
      : 'product_search';
  }
}

if (!resolvedUseCase) {
  if (/uu tien pin|pin tot hon/.test(dialogueText)) resolvedUseCase = 'battery';
  else if (/choi game|gaming/.test(dialogueText)) resolvedUseCase = 'gaming';
  else if (/hieu nang|performance/.test(dialogueText)) resolvedUseCase = 'performance';
  else if (/camera tot|chup anh/.test(dialogueText)) resolvedUseCase = 'camera';
}

if (
  !resolvedBrand &&
  dialogueCurrentBrands.length === 1 &&
  !dialogueOtherBrand &&
  !dialogueNegativeBrands.includes(dialogueCurrentBrands[0])
) {
  resolvedBrand = dialogueCurrentBrands[0];
}

const dialogueComparisonRequested =
  resolvedIntent === 'product_compare' &&
  dialogueComparisonIndexes.length >= 2;
const selectedFromPrevious =
  !dialogueComparisonRequested &&
  Number.isInteger(dialogueSelectedIndex) &&
  dialogueSelectedIndex > 0 &&
  Array.isArray(previousConversationState.last_result_set)
    ? previousConversationState.last_result_set[dialogueSelectedIndex - 1]
    : null;
const dialogueSelectionRequested =
  !dialogueComparisonRequested &&
  (
    Number.isInteger(dialogueSelectedIndex) ||
    /\b(?:chon|lay)\b.*\b(?:mau|san pham|con|cai)\b/.test(dialogueText)
  );
const invalidSelection = dialogueSelectionRequested && !selectedFromPrevious;

const priorDisplayed = Array.isArray(previousConversationState.last_result_set)
  ? previousConversationState.last_result_set : [];
const selectedPrior = priorDisplayed.find(product =>
  product?.id && String(product.id) === String(previousConversationState.selected_product_id || '')
) || null;
const brandFilteredPrior = dialoguePriceDirection === 'lower' && dialogueCurrentBrands.length === 1
  ? priorDisplayed.filter(product => dialogueProductMatchesBrand(product,dialogueCurrentBrands[0]))
  : [];
// Prefer a unique explicitly selected product, then a unique displayed result.
// No arbitrary highest-price fallback when several distinct products are shown.
const referencedProduct = dialoguePriceDirection === 'lower'
  ? (selectedPrior || (brandFilteredPrior.length === 1 ? brandFilteredPrior[0] : null) ||
      (priorDisplayed.length === 1 ? priorDisplayed[0] : null))
  : null;
const referencedProductPriceRaw = Number(referencedProduct?.price_min ?? referencedProduct?.price);
const referencedProductPrice = Number.isFinite(referencedProductPriceRaw) && referencedProductPriceRaw > 0
  ? referencedProductPriceRaw : null;
const selectedReferenceProduct = selectedFromPrevious || selectedPrior;
const selectedReferencePriceRaw = Number(selectedReferenceProduct?.price_min ?? selectedReferenceProduct?.price);
const selectedReferencePrice = Number.isFinite(selectedReferencePriceRaw) && selectedReferencePriceRaw > 0
  ? selectedReferencePriceRaw : null;
const refinementPriceBelow = dialoguePriceDirection === 'lower'
  ? (referencedProductPrice ?? selectedReferencePrice)
  : null;

if (referencedProduct && dialoguePriceDirection === 'lower') {
  // A price rejection is not a positive brand preference. Keep the
  // referenced product only in the explicit rejection state below.
  resolvedBrand = '';
  resolvedModel = '';
}

if (selectedFromPrevious) {
  // The canonical presented result-set ID and its product descriptor win
  // over a model/name inferred by the router.
  resolvedBrand = selectedFromPrevious.brand || '';
  resolvedModel = selectedFromPrevious.name || '';
  if (hasPendingAction && pendingQuestion.type === 'quotation') {
    resolvedIntent = 'quotation';
  } else {
    resolvedIntent = 'product_detail';
  }
}

if (invalidSelection) {
  resolvedIntent = 'default';
  resolvedBrand = '';
  resolvedModel = '';
  resolvedStorage = '';
  resolvedRam = '';
  resolvedColor = '';
}

if (isPendingValid && dialogueConfirm) {
  resolvedIntent = 'quotation';
  isFollowup = true;
}

if (hasPendingAction && dialogueConfirm && pendingQuestion.product_id) {
  resolvedIntent = pendingQuestion.type === 'quotation' ? 'quotation' : 'product_detail';
  resolvedModel = resolvedModel || pendingQuestion.product_name || '';
}

if (dialogueCancel || (dialogueReject && hasPendingAction)) {
  resolvedIntent = 'default';
}

const dialogueCriteriaContinuation =
  /(?:nhung mau|cac mau|mau dien thoai|dien thoai).*(?:theo tieu chi|tieu chi truoc do|nhu tieu chi truoc|nhu tren)/.test(dialogueText);
if (
  dialogueCriteriaContinuation &&
  (previousConversationState.category || Object.keys(previousActiveFilters).length > 0)
) {
  resolvedIntent = 'recommendation';
  resolvedModel = '';
  if (dialogueCurrentBrands.length === 0) resolvedBrand = '';
  if (!dialogueHasExplicitStorage) resolvedStorage = '';
  if (!dialogueHasExplicitRam) resolvedRam = '';
  if (!dialogueHasExplicitColor) resolvedColor = '';
}

if (
  (resolvedIntent === 'product_compare' || resolvedIntent === 'quotation') &&
  Array.isArray(previousConversationState.last_result_set)
) {
  const indexes = resolvedIntent === 'product_compare'
    ? unique(dialogueComparisonIndexes)
    : (dialogueSelectedIndex ? [dialogueSelectedIndex] : []);
  const resolvedProducts = indexes
    .map(index => previousConversationState.last_result_set[index - 1])
    .filter(Boolean)
    .map((product, index) => ({
      index: indexes[index],
      brand: product.brand || '',
      model: product.name || '',
      storage_gb: null,
      ram_gb: null,
      color: null,
      quantity: 1
    }));
  if (resolvedProducts.length > 0) products = resolvedProducts;
}


// CONTEXTUAL COMPARE FALLBACK
if (resolvedIntent === 'product_compare' && products.length < 2) {
  const previousLastResults = Array.isArray(previousConversationState.last_result_set)
    ? previousConversationState.last_result_set
    : [];
  const previousRejectedReferences = Array.isArray(previousConversationState.rejected_products)
    ? previousConversationState.rejected_products
    : [];
  const historicalReferences = [...previousLastResults, ...previousRejectedReferences];
  const compareProducts = [];
  const compareKeys = new Set();

  function compareProductKey(product) {
    const brand = dialogueNormalize(product?.brand || '');
    const model = dialogueNormalize(product?.model || product?.name || '');
    return `${brand}::${model}`;
  }

  function appendCompareDescriptor(product, preferredIndex = null) {
    if (!product) return;
    const brand = typeof product.brand === 'string' ? product.brand.trim() : '';
    const model = typeof product.model === 'string' && product.model.trim()
      ? product.model.trim()
      : (typeof product.name === 'string' ? product.name.trim() : '');
    if (!brand && !model) return;

    const descriptor = {
      index: Number.isInteger(preferredIndex) && preferredIndex > 0
        ? preferredIndex
        : compareProducts.length + 1,
      brand,
      model,
      storage_gb: null,
      ram_gb: null,
      color: null,
      quantity: 1
    };
    const key = compareProductKey(descriptor);
    if (!key || key === '::' || compareKeys.has(key)) return;
    compareKeys.add(key);
    compareProducts.push(descriptor);
  }

  for (const existingProduct of products) {
    appendCompareDescriptor(
      existingProduct,
      Number.isInteger(existingProduct?.index) ? existingProduct.index : null
    );
  }

  const previousSelectedProductId = previousConversationState.selected_product_id
    ? String(previousConversationState.selected_product_id)
    : null;
  let previousSelectedProduct = previousSelectedProductId
    ? historicalReferences.find(product =>
        product?.id && String(product.id) === previousSelectedProductId
      ) || null
    : null;

  if (!previousSelectedProduct && selectedReferenceProduct) {
    previousSelectedProduct = selectedReferenceProduct;
  }
  if (previousSelectedProduct) appendCompareDescriptor(previousSelectedProduct);

  const historicalSearchPool = [...previousRejectedReferences, ...previousLastResults];
  for (const currentBrand of dialogueCurrentBrands) {
    const matchingHistoricalProduct = historicalSearchPool.find(product => {
      if (!product) return false;
      if (
        previousSelectedProductId &&
        product.id &&
        String(product.id) === previousSelectedProductId
      ) return false;
      return dialogueProductMatchesBrand(product, currentBrand);
    });
    if (matchingHistoricalProduct) appendCompareDescriptor(matchingHistoricalProduct);
  }

  if (compareProducts.length < 2) {
    const normalizedCurrentText = dialogueNormalize(chatInput);
    for (const historicalProduct of historicalSearchPool) {
      if (!historicalProduct) continue;
      if (
        previousSelectedProductId &&
        historicalProduct.id &&
        String(historicalProduct.id) === previousSelectedProductId
      ) continue;
      const historicalName = dialogueNormalize(
        historicalProduct.name || historicalProduct.model || ''
      );
      if (historicalName && normalizedCurrentText.includes(historicalName)) {
        appendCompareDescriptor(historicalProduct);
      }
    }
  }

  if (compareProducts.length > products.length) products = compareProducts;
}

const resolvedCategory =
  dialogueCurrentCategory ||
  previousConversationState.category ||
  null;

const previousExcluded = Array.isArray(previousConversationState.excluded_brands)
  ? previousConversationState.excluded_brands
  : [];
const previousPreferred = Array.isArray(previousConversationState.preferred_brands)
  ? previousConversationState.preferred_brands
  : [];
const fallbackPreviousBrand =
  previousActiveFilters.brand ||
  previousPreferred[previousPreferred.length - 1] ||
  null;
const resolvedExcludedBrands = unique([
  ...previousExcluded,
  ...dialogueNegativeBrands,
  ...(dialogueOtherBrand && fallbackPreviousBrand ? [fallbackPreviousBrand] : [])
]).filter(brand => !resolvedBrand || dialogueNormalize(brand) !== dialogueNormalize(resolvedBrand));

let turnAction = 'CONTINUE';
if (dialogueCancel) {
  turnAction = 'CANCEL';
} else if (dialogueReject && hasPendingAction) {
  turnAction = 'REJECT';
} else if (dialogueSelectionRequested || selectedFromPrevious) {
  turnAction = 'SELECT';
} else if (resolvedIntent === 'product_compare' || /so sanh|so hai|khac nhau/.test(dialogueText)) {
  turnAction = 'COMPARE';
} else if (dialogueOtherBrand || dialogueNegativeBrands.length) {
  turnAction = 'EXCLUDE';
} else if (dialoguePriceDirection || /uu tien|can hieu nang|de hoc|lam viec|choi game|camera khong quan trong/.test(dialogueText)) {
  turnAction = dialoguePriceDirection === 'lower' && /\bdat qua\b/.test(dialogueText) ? 'REJECT' : 'REFINE';
} else if (
  (dialogueCurrentCategory && dialoguePreviousCategory && dialogueCurrentCategory !== dialoguePreviousCategory) ||
  (dialogueCurrentBrands.length === 1 && previousActiveFilters.brand && dialogueNormalize(dialogueCurrentBrands[0]) !== dialogueNormalize(previousActiveFilters.brand))
) {
  turnAction = 'SWITCH';
} else if (dialogueConfirm && (hasPendingAction || isPendingValid)) {
  turnAction = 'CONFIRM';
} else if (!previousConversationState.last_intent && !previousConversationState.category) {
  turnAction = 'NEW_TOPIC';
}

// LIVE-10: explicit brand switch must defeat stale product recommendations.
if (dialogueCurrentBrands.length === 1 && previousActiveFilters.brand &&
    dialogueNormalize(dialogueCurrentBrands[0]) !== dialogueNormalize(previousActiveFilters.brand) &&
    dialogueNegativeBrands.length === 0 && !dialogueOtherBrand) {
  turnAction = 'SWITCH';
  resolvedBrand = dialogueCurrentBrands[0];
  resolvedModel = resolvedModel || '';
}

const contextMode =
  dialogueTopicScopeChanged
    ? 'reset'
    : turnAction === 'SWITCH'
      ? 'replace'
      : turnAction === 'NEW_TOPIC'
      ? 'replace'
      : turnAction === 'EXCLUDE' || turnAction === 'REFINE' || turnAction === 'SELECT'
        ? 'continue'
        : 'continue';

// Only a budget stated by the user changes the explicit constraint.
// Otherwise continue the current topic's prior budget, or clear it on a
// cross-category reset. Gemini's inferred price_max is not authoritative.
const priorExplicitBudget = previousActiveFilters.price_max;
if (explicitUserBudget !== null) {
  priceMax = explicitUserBudget;
} else if (contextMode === 'reset') {
  priceMax = null;
} else if (priorExplicitBudget !== null && priorExplicitBudget !== undefined && Number.isFinite(Number(priorExplicitBudget))) {
  priceMax = Number(priorExplicitBudget);
} else {
  priceMax = null;
}

if ((resolvedIntent === 'product_compare' || turnAction === 'COMPARE')) {
  // Referenced comparison brands are not shopping preferences/filters.
  resolvedBrand = '';
  resolvedModel = '';
}

const requiresClarification = Boolean(
  invalidSelection ||
  (hasPendingAction && !dialogueSelectedIndex && !dialogueConfirm && !dialogueCancel) ||
  (dialoguePriceDirection === 'lower' && !Number.isFinite(refinementPriceBelow))
);
const clarificationField = invalidSelection
  ? 'product_selection'
  : (requiresClarification ? pendingQuestion?.field || (dialoguePriceDirection ? 'price_max' : null) : null);

// Keep the state contract coherent before Prepare Recommendation Filters.
// A current-turn exclusion removes the same canonical brand from the prior
// positive preference and from the active positive brand filter.
const resolvedPreferredBrands = unique([
  ...(['replace','reset'].includes(contextMode) ? [] : previousPreferred),
  ...(resolvedBrand && turnAction !== 'SELECT' ? [resolvedBrand] : [])
]).filter(brand => !dialogueNegativeBrands.some(negative => dialogueNormalize(negative) === dialogueNormalize(brand)));
const resolvedActiveFilters = { ...previousActiveFilters };

// Excluding a brand refreshes the candidate pool. Product-specific attributes
// from the excluded result are not user constraints unless this turn repeats
// them explicitly; keep only the conversation-level category and budget.
if (turnAction === 'EXCLUDE' && dialogueNegativeBrands.length > 0) {
  if (!dialogueHasExplicitStorage) {
    resolvedStorage = '';
    delete resolvedActiveFilters.storage_gb;
  }
  if (!dialogueHasExplicitRam) {
    resolvedRam = '';
    delete resolvedActiveFilters.ram_gb;
  }
  if (!dialogueHasExplicitColor) {
    resolvedColor = '';
    delete resolvedActiveFilters.color;
  }
}

if (resolvedBrand && turnAction !== 'SELECT') {
  resolvedActiveFilters.brand = resolvedBrand;
} else if (dialogueNegativeBrands.length ||
           (dialoguePriceDirection === 'lower' && referencedProduct)) {
  delete resolvedActiveFilters.brand;
}
if (priceMax !== null && priceMax !== undefined) {
  resolvedActiveFilters.price_max = priceMax;
}
const previousRejectedProducts = Array.isArray(previousConversationState.rejected_products)
    ? previousConversationState.rejected_products
    : [];
  const rejectedProductsById = new Map(
    previousRejectedProducts
      .filter(product => product && product.id)
      .map(product => [String(product.id), product])
  );
  if (referencedProduct?.id) {
    rejectedProductsById.set(String(referencedProduct.id), {
      id: referencedProduct.id,
      name: referencedProduct.name || referencedProduct.model || '',
      brand: referencedProduct.brand || null,
      price_min: Number.isFinite(referencedProductPrice)
        ? referencedProductPrice
        : (referencedProduct.price_min ?? referencedProduct.price ?? null),
      price_max: Number.isFinite(referencedProductPrice)
        ? referencedProductPrice
        : (referencedProduct.price_max ?? referencedProduct.price ?? null)
    });
  }
  const resolvedRejectedProducts = [...rejectedProductsById.values()];

  const resolvedConversationState = {
    ...previousConversationState,
    category: resolvedCategory,
    active_filters: resolvedActiveFilters,
    preferred_brands: resolvedPreferredBrands,
    excluded_brands: resolvedExcludedBrands,
    rejected_products: resolvedRejectedProducts,
    last_intent: resolvedIntent,
    last_turn_action: turnAction
  };


// FAQ V1 canonicalization is intentionally isolated at the Validate Router boundary.
const allowedFaqTopics = [
  "shipping", "payment", "cod", "installment", "warranty", "return",
  "address", "working_time", "contact", "order_cancellation", "delivery_inspection"
];
function normalizeFaqText(value) {
  return String(value ?? "")
    .replace(/[đĐ]/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function extractExplicitFaqTopics(value) {
  const text = normalizeFaqText(value);
  const rules = [
    ["shipping", ["giao hang", "van chuyen", "shipping", "ship"]],
    ["payment", ["thanh toan", "payment"]],
    ["cod", ["cod", "thanh toan khi nhan hang", "tra tien khi nhan hang"]],
    ["installment", ["tra gop", "installment"]],
    ["warranty", ["bao hanh", "warranty"]],
    ["return", ["doi tra", "doi hang", "tra hang", "return"]],
    ["address", ["dia chi", "o dau", "den cua hang", "tai cua hang", "showroom"]],
    ["working_time", ["gio lam viec", "gio mo cua", "mo cua", "dong cua"]],
    ["contact", ["lien he", "hotline", "email", "contact"]],
    ["order_cancellation", ["huy don", "cancel order"]],
    ["delivery_inspection", ["kiem tra may", "kiem tra hang", "kiem tra san pham", "kiem tra khi nhan", "mo hop khi nhan"]]
  ];
  return rules.map(([topic, patterns]) => {
    const positions = patterns.map(phrase => text.indexOf(phrase)).filter(index => index >= 0);
    if (topic === "order_cancellation" && positions.length === 0 && text.includes("huy") && text.includes("don")) {
      positions.push(Math.min(text.indexOf("huy"), text.indexOf("don")));
    }
    return { topic, index: positions.length ? Math.min(...positions) : -1 };
  }).filter(item => item.index >= 0)
    .sort((a, b) => a.index - b.index || allowedFaqTopics.indexOf(a.topic) - allowedFaqTopics.indexOf(b.topic))
    .map(item => item.topic);
}
function canonicalizeFaqTopics(intentValue, currentMessage, routerTopics, routerPrimary) {
  if (intentValue !== "faq") return [];
  const explicit = extractExplicitFaqTopics(currentMessage);
  const candidates = explicit.length ? explicit : [
    ...(Array.isArray(routerTopics) ? routerTopics : []),
    routerPrimary
  ];
  const seen = new Set();
  return candidates.map(value => String(value ?? "").trim().toLowerCase())
    .filter(value => allowedFaqTopics.includes(value) && !seen.has(value) && seen.add(value));
}
const canonicalFaqTopics = canonicalizeFaqTopics(
  resolvedIntent,
  chatInput,
  data.faq_topics,
  data.faq_topic
);

const resolvedSelectedProductId =
  dialogueSelectionRequested
    ? (selectedFromPrevious?.id || null)
    : (
        resolvedIntent === 'product_compare' ||
        turnAction === 'COMPARE'
      )
      ? (previousConversationState.selected_product_id || null)
      : (pendingQuestion?.product_id || null);

return [
  {
    json: {
      intent: resolvedIntent,
      brand: resolvedBrand,
      model: resolvedModel,
      storage: resolvedStorage,
      ram: resolvedRam,
      color: resolvedColor,
      price_max: priceMax,
      condition: typeof data.condition === 'string' ? data.condition.trim() : '',
      use_case: resolvedUseCase,
      faq_topic: canonicalFaqTopics[0] || "",
      faq_topics: canonicalFaqTopics,
      products,
      quantity: topLevelQuantity.quantity,
      quantity_explicit: topLevelQuantity.quantity_explicit,
      is_followup: isFollowup,
      pending_quote_exists: isPendingValid,
      pending_quote_requests: pendingRequests,
      turn_action: turnAction,
      context_mode: contextMode,
      category: resolvedCategory,
      exclude_brands: resolvedExcludedBrands,
      excluded_brands: resolvedExcludedBrands,
      preferred_brands: resolvedPreferredBrands,
      rejected_products: resolvedRejectedProducts,
      selected_result_index: Number.isInteger(dialogueSelectedIndex) ? dialogueSelectedIndex : null,
      selected_product_id: resolvedSelectedProductId,
      price_direction: dialoguePriceDirection,
      refinement_price_below: Number.isFinite(refinementPriceBelow) ? refinementPriceBelow : null,
      requires_clarification: requiresClarification,
      clarification_field: clarificationField,
      conversationState: resolvedConversationState,
      chatInput,
      sessionId,
      source
    }
  }
];
