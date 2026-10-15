type Product = { id: string; name: string; brand?: string | null; price?: number; original_price?: number; stock: number;
  category?: { name?: string; slug?: string }; specifications?: unknown[];
  variants: Array<{ id: string; sku?: string; attributes: Record<string, unknown>; price: number | null; original_price: number | null; stock: number }> };

export function chatbotProductHints(record: Record<string, unknown>): string[] {
  const candidates = [...(Array.isArray(record.products) ? record.products : []),
    ...(record.product && typeof record.product === 'object' ? [record.product] : [])];
  return [...new Set(candidates.flatMap(value => {
    if (!value || typeof value !== 'object') return [];
    const id = (value as any).id;
    return typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id) ? [id] : [];
  }))].slice(0, 12);
}

function normalize(value: string): string {
  return value.replace(/[đĐ]/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
}

function facts(product: Product): string[] {
  return [product.name, product.brand || '', ...product.variants.flatMap(v => [v.sku || '', ...Object.values(v.attributes).map(String)]),
    ...((product.specifications || []).flatMap((s: any) => [s?.value, ...(s?.items || []).map((i: any) => i?.value)]).filter((v: unknown): v is string => typeof v === 'string'))].map(normalize);
}

/** Variant hints narrow prose facts only; the cards retain the complete current Backend variants. */
export function scopeChatbotFactProducts(products: Product[], rawProducts: any[], selectedVariantId?: unknown): Product[] {
  return products.map(p => {
    const raw = rawProducts.find(candidate => candidate?.id === p.id);
    const hints = Array.isArray(raw?.variants) ? raw.variants.map((v: any) => v?.id).filter((id: unknown) => typeof id === 'string') : [];
    const requested = typeof selectedVariantId === 'string' && p.variants.some(v => v.id === selectedVariantId) ? [selectedVariantId] : hints;
    if (!requested.length) return p;
    const variants = p.variants.filter(v => requested.includes(v.id));
    const prices = variants.map(v => v.price).filter((price): price is number => Number.isSafeInteger(price));
    const originalPrices = variants.map(v => v.original_price).filter((price): price is number => Number.isSafeInteger(price));
    return { ...p, variants, price: prices.length ? Math.min(...prices) : undefined,
      original_price: originalPrices.length ? Math.min(...originalPrices) : undefined, stock: variants.reduce((n, v) => n + v.stock, 0) };
  });
}

function money(value: string, unit: string): number {
  const compact = value.replace(/\s/g, '');
  if (/trieu|triệu|tr/i.test(unit)) return Number(compact.replace(',', '.')) * 1000000;
  if (/nghin|nghìn|ngan|ngàn/i.test(unit)) return Number(compact.replace(',', '.')) * 1000;
  return Number(compact.replace(/[.,]/g, ''));
}

/** Conservative sentence/line grounding: unverified facts are removed, not the surrounding conversation. */
function isGrounded(line: string, products: Product[], rawProducts: any[]): boolean {
  const normalized = normalize(line);
  if (/(?:https?:\/\/\S+\.pdf|\/uploads\/quotations\/|bao gia.{0,30}da (?:tao|duyet)|pdf.{0,30}(?:tai|san sang))/.test(normalized)) return false;
  if (rawProducts.some(p => typeof p?.name === 'string' && normalized.includes(normalize(p.name)) && !products.some(v => v.id === p.id))) return false;
  const mentioned = products.filter(p => normalized.includes(normalize(p.name)));
  const relevant = mentioned.length ? mentioned : products.length === 1 ? products : [];
  const models = [...normalized.matchAll(/\b(?:iphone|ipad|macbook|galaxy|pixel|redmi|poco)\s*[a-z-]*\s*\d+[a-z\d]*/g)].map(m => m[0].replace(/\s/g, ''));
  if (models.some(model => !products.some(p => normalize(p.name).replace(/\s/g, '').includes(model)))) return false;
  const prices = new Set(relevant.flatMap(p => [p.price, p.original_price, ...p.variants.flatMap(v => [v.price, v.original_price])]).filter(Number.isSafeInteger));
  const monetary = [...line.matchAll(/(\d[\d.,]*(?:\s\d{3})*)\s*(VND|VNĐ|đ|₫|đồng|dong|triệu|trieu|tr|nghìn|nghin|ngàn|ngan)(?!\p{L})/giu)];
  if (monetary.some(m => !prices.has(money(m[1], m[2])))) return false;
  if (monetary.length === 2 && /(?:giam tu|original|was)/.test(normalized)
    && !relevant.some(p => p.variants.some(v => v.price === money(monetary[0][1], monetary[0][2]) && v.original_price === money(monetary[1][1], monetary[1][2])))) return false;
  if (/(?:[$€£]\s*\d|\d\s*USD|\d\s*%)/i.test(line)) return false;
  const stock = normalized.match(/(?:ton kho|stock|chi con|con)\s*[:=]?\s*(\d+)\s*(?:may|san pham|chiec|units)?/);
  if (stock && (relevant.length !== 1 || relevant[0].stock !== Number(stock[1]))) return false;
  if (/(?:het hang|out of stock)/.test(normalized) && (!relevant.length || relevant.some(p => p.stock > 0))) return false;
  if (/(?:con hang|in stock|san co|hien (?:dang )?co (?:ban|san)|dang co tai cua hang)/.test(normalized) && (!products.length || (relevant.length ? relevant : products).some(p => p.stock <= 0))) return false;
  const colorOption = normalized.match(/^[-*]\s*(.+?)\s*\((?:con hang|het hang|in stock|out of stock)\)/);
  if (colorOption) {
    const variants = relevant.flatMap(p => p.variants).filter(v => Object.entries(v.attributes).some(([key, value]) => /^(?:color|mau sac)$/.test(normalize(key)) && normalize(String(value)) === colorOption[1].trim()));
    if (!variants.length || (/(?:con hang|in stock)/.test(normalized) ? !variants.some(v => v.stock > 0) : variants.some(v => v.stock > 0))) return false;
  }
  const capacities = [...normalized.matchAll(/\b\d+(?:[.,]\d+)?\s*(?:gb|tb)\b/g)].map(m => m[0].replace(/\s/g, ''));
  const allowedFacts = relevant.flatMap(facts);
  if (capacities.some(c => !allowedFacts.some(f => f.replace(/\s/g, '').includes(c)))) return false;
  const technicalValues = [...normalized.matchAll(/\b\d+(?:[.,]\d+)?\s*(?:mp|mah|hz|watt|inch|cores)\b/g)].map(m => m[0].replace(/\s/g, ''));
  if (technicalValues.some(c => !allowedFacts.some(f => f.replace(/\s/g, '').includes(c)))) return false;
  const chips = [...normalized.matchAll(/\b(?:a\d{1,3}|dimensity\s*\d+|exynos\s*\d+|tensor\s*g\d+)\b/g)].map(m => m[0]);
  if (chips.some(chip => !allowedFacts.some(f => new RegExp(`\\b${chip}\\b`).test(f)))) return false;
  // Names are supported by Backend. Other concrete technical claims need catalog evidence.
  if (/^(?:[-*]\s*)?(?:#{1,6}\s*)?(?:cpu|chip|camera|pin|battery|man hinh|screen|he dieu hanh|sku|mau sac|color)\s*[:：]/.test(normalized)) {
    const value = normalized.split(/[:：]/).slice(1).join(':').trim();
    const values = value.split(/[,;]/).map(v => v.trim()).filter(Boolean);
    if (!values.length || values.some(v => !allowedFacts.some(f => v.length > 1 && f.includes(v)))) return false;
  }
  if (/(?:gia|price|cost)\s*(?:chi|tu|la|is|:|=)\s*\S/.test(normalized) && !monetary.length && !/[?？]\s*$/.test(line.trim())) return false;
  return true;
}

export function groundChatbotProse(text: string, products: Product[], rawProducts: any[], resultType: string) {
  let productSection = false;
  let tableProducts: Product[] = [];
  let sectionProducts = products;
  let colorList = false;
  const removeLists = resultType === 'product_search' || resultType === 'recommendation';
  const lines: string[] = [];
  const names = [...rawProducts, ...products].map(p => normalize(p?.name || '')).filter(Boolean);
  for (const line of text.trim().slice(0, 12000).split(/\r?\n/)) {
    const normalized = normalize(line);
    const mentioned = products.filter(p => normalized.includes(normalize(p.name)));
    if (!removeLists && /^\s*#{1,6}\s/.test(line)) sectionProducts = mentioned.length ? mentioned : products;
    if (!removeLists && /(?:mau sac sau|cac mau sau|cac mau sac)/.test(normalized)) colorList = true;
    else if (colorList && /^\s*[-*]\s/.test(line)) {
      const color = normalized.replace(/^[-*]\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').replace(/[.,;]$/, '').trim();
      const allowed = sectionProducts.flatMap(p => p.variants).some(v => Object.entries(v.attributes).some(([key, value]) => /^(?:color|mau sac)$/.test(normalize(key)) && normalize(String(value)) === color));
      if (!allowed) continue;
    } else if (colorList && line.trim()) colorList = false;
    const listHeading = /^(?:#{1,6}\s*)?\d+[.)]\s/.test(normalized)
      || /^(?:#{1,6}\s+|[-*]\s+)/.test(normalized) && names.some(name => normalized.includes(name));
    if (removeLists && listHeading) { productSection = true; continue; }
    if (removeLists && productSection) {
      if (!line.trim() || /^\s*[-*|#]/.test(line) || /^(?:gia|dung luong|phien ban|mau sac|tinh trang|ton kho|stock|price)\s*[:：]/.test(normalized)) continue;
      // Leave a product section only for actual conversational follow-up, not its fact lines.
      if (!/[?？]\s*$/.test(line.trim()) && !/^(?:ban |hay |neu |toi co the |minh co the )/.test(normalized)) continue;
      productSection = false;
    }
    if (/^\s*\|/.test(line)) {
      if (removeLists) continue;
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      const columns = cells.slice(1).map(cell => products.find(p => normalize(cell).includes(normalize(p.name))));
      if (columns.length && columns.every(Boolean)) { tableProducts = columns as Product[]; lines.push(line); continue; }
      if (/^\s*\|\s*:?-+/.test(line)) { if (tableProducts.length) lines.push(line); continue; }
      if (tableProducts.length && cells.length === tableProducts.length + 1
        && cells.slice(1).every((cell, i) => isGrounded(`${cells[0]}: ${cell}`, [tableProducts[i]], rawProducts))) lines.push(line);
      continue;
    }
    tableProducts = [];
    const segments = line.split(/(?<=[.!?])\s+(?=[\p{Lu}])/u);
    const safe = segments.filter(segment => {
      const matching = products.filter(p => normalize(segment).includes(normalize(p.name)));
      return isGrounded(segment, matching.length ? matching : sectionProducts, rawProducts);
    });
    if (safe.length) lines.push(safe.join(' '));
  }
  return lines.filter((line, index) => {
    if (!/^\s*#{1,6}\s/.test(line)) return true;
    const next = lines.slice(index + 1).find(value => value.trim());
    return Boolean(next && !/^\s*#{1,6}\s/.test(next));
  }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** State positions/prices/names are rebuilt from the same ordered catalog used by cards. */
export function reconcileChatbotCatalogState(state: Record<string, any>, products: Product[], replaceResults: boolean) {
  const byId = new Map(products.map(p => [p.id, p]));
  const ids: string[] = replaceResults ? products.map(p => p.id) : (Array.isArray(state.last_result_set) ? state.last_result_set : []).map((p: any) => p?.id);
  const last_result_set = ids.flatMap(id => {
    const p = byId.get(id); if (!p) return [];
    const prices = p.variants.map(v => v.price).filter((n): n is number => Number.isSafeInteger(n));
    return [{ id: p.id, name: p.name, brand: p.brand || null, category: p.category?.name || p.category?.slug || state.category || null,
      price_min: prices.length ? Math.min(...prices) : null, price_max: prices.length ? Math.max(...prices) : null }];
  }).map((p, index) => ({ ...p, position: index + 1 }));
  const selected = byId.get(state.selected_product_id);
  return { ...state, last_result_set, selected_product_id: selected?.id || null,
    selected_variant_id: selected?.variants.some(v => v.id === state.selected_variant_id) ? state.selected_variant_id : null };
}
