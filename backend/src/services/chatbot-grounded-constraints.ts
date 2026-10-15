export const MAX_GROUNDED_VND = 1_000_000_000_000;
export const GROUNDED_STATE_TTL_MS = 30 * 60 * 1000;
export type GroundedBudget = { min?: number; max?: number; minInclusive?: boolean; maxInclusive?: boolean; toleranceBps?: number };
export type GroundedConstraints = {
  brands: string[]; categoryIds: string[]; modelIds: string[]; modelTokens: string[];
  attrTerms: Array<{ kind: 'capacity' | 'ram' | 'color'; term: string }>;
  inStock: boolean; outOfStock: boolean; budget: GroundedBudget | null;
};
export class GroundedContractError extends Error {
  constructor() { super('Invalid grounded catalog constraints.'); this.name = 'GroundedContractError'; }
}
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
export function normalizeGroundedText(value: unknown): string {
  return String(value ?? '').normalize('NFKC').replace(/[đĐ]/g, 'd').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
export function parseGroundedBudget(value: unknown): GroundedBudget | null {
  if (value === null || value === undefined) return null;
  if (!object(value) || !Object.keys(value).length || Object.keys(value).some(k => !['min', 'max', 'minInclusive', 'maxInclusive', 'toleranceBps'].includes(k))) throw new GroundedContractError();
  const result: GroundedBudget = {};
  for (const bound of ['min', 'max'] as const) {
    if (value[bound] === undefined) continue;
    if (!Number.isSafeInteger(value[bound]) || value[bound] <= 0 || value[bound] > MAX_GROUNDED_VND) throw new GroundedContractError();
    const inclusive = bound === 'min' ? 'minInclusive' : 'maxInclusive';
    if (typeof value[inclusive] !== 'boolean') throw new GroundedContractError();
    result[bound] = value[bound]; result[inclusive] = value[inclusive];
  }
  if (result.min === undefined && result.max === undefined) throw new GroundedContractError();
  if (result.min !== undefined && result.max !== undefined && (result.min > result.max || result.min === result.max && (!result.minInclusive || !result.maxInclusive))) throw new GroundedContractError();
  if (value.min === undefined && value.minInclusive !== undefined || value.max === undefined && value.maxInclusive !== undefined) throw new GroundedContractError();
  if (value.toleranceBps !== undefined) {
    if (!Number.isInteger(value.toleranceBps) || value.toleranceBps < 0 || value.toleranceBps > 10000 || result.min === undefined || result.max === undefined) throw new GroundedContractError();
    result.toleranceBps = value.toleranceBps;
  }
  return result;
}
function strings(value: unknown, id = false): string[] {
  if (!Array.isArray(value) || value.length > 64 || value.some(v => typeof v !== 'string' || !v.trim() || v.length > (id ? 64 : 160) || id && !/^[A-Za-z0-9_-]{1,64}$/.test(v))) throw new GroundedContractError();
  return [...new Set(value.map(v => v.trim()))];
}
export function parseGroundedConstraints(record: Record<string, any>): GroundedConstraints | null {
  if (record.grounding === undefined) return null;
  if (!object(record.grounding) || !object(record.grounding.constraints)) throw new GroundedContractError();
  const c = record.grounding.constraints;
  if (c.clarification === true || !['inStock', 'outOfStock'].every(k => typeof c[k] === 'boolean') || c.inStock && c.outOfStock) throw new GroundedContractError();
  if (!Array.isArray(c.attrTerms) || c.attrTerms.length > 12) throw new GroundedContractError();
  const attrTerms = c.attrTerms.map((v: unknown) => {
    if (!object(v) || !['capacity', 'ram', 'color'].includes(v.kind) || typeof v.term !== 'string' || !v.term.trim() || v.term.length > 100) throw new GroundedContractError();
    return { kind: v.kind as 'capacity' | 'ram' | 'color', term: normalizeGroundedText(v.term) };
  });
  return { brands: strings(c.brands), categoryIds: strings(c.categoryIds, true), modelIds: strings(c.modelIds, true), modelTokens: strings(c.modelTokens),
    attrTerms, inStock: c.inStock, outOfStock: c.outOfStock, budget: parseGroundedBudget(c.budget) };
}
export function priceMatchesGroundedBudget(price: number, b: GroundedBudget | null): boolean {
  return !b || ((b.min === undefined || (b.minInclusive ? price >= b.min : price > b.min)) && (b.max === undefined || (b.maxInclusive ? price <= b.max : price < b.max)));
}
/** Request text is server-observed; workflow amounts remain untrusted restrictive hints. */
export function requestedGroundedBudget(text: string): GroundedBudget | 'clarification' | null {
  const s = text.replace(/[đĐ]/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const n = '(\\d+(?:[.,]\\d+)*)', u = '\\s*(trieu|tr|million|m|nghin|ngan|k|vnd|dong|d|₫)?';
  const amount = (raw: string, unit?: string) => {
    const scaled = /^(trieu|tr|million|m|nghin|ngan|k)$/.test(unit || '');
    const v = scaled ? Number(raw.replace(',', '.')) * (/^(nghin|ngan|k)$/.test(unit!) ? 1000 : 1000000) : Number(raw.replace(/[.,]/g, ''));
    if (!Number.isSafeInteger(v) || v <= 0 || v > MAX_GROUNDED_VND) throw new GroundedContractError();
    return v;
  };
  if (/\b(?:khoang|tam)\s*\d/.test(s)) return 'clarification';
  const range = s.match(new RegExp('\\btu\\s+' + n + u + '\\s*(?:den|toi|-)\\s*' + n + u));
  if (range) return parseGroundedBudget({ min: amount(range[1], range[2] || range[4]), max: amount(range[3], range[4] || range[2]), minInclusive: true, maxInclusive: true });
  const result: GroundedBudget = {};
  const re = new RegExp('\\b(duoi|toi da|khong qua|tren|it nhat|tu|ngan sach|budget)\\s*(?:la\\s*)?' + n + u, 'g');
  for (const m of s.matchAll(re)) {
    if (!m[3] && m[2].replace(/[.,]/g, '').length < 4) throw new GroundedContractError();
    if (['tren', 'it nhat', 'tu'].includes(m[1])) { result.min = amount(m[2], m[3]); result.minInclusive = m[1] !== 'tren'; }
    else { result.max = amount(m[2], m[3]); result.maxInclusive = m[1] !== 'duoi'; }
  }
  if (Object.keys(result).length) return parseGroundedBudget(result);
  const bare = s.match(/^\s*(\d+(?:[.,]\d+)*)\s*(trieu|tr|vnd|dong|d|₫)?\s*$/);
  return bare && (bare[2] || bare[1].replace(/[.,]/g, '').length >= 4) ? { max: amount(bare[1], bare[2]), maxInclusive: true } : null;
}
export function validatedStateTimestamp(value: unknown, now = Date.now()): string | null {
  if (typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) && time <= now && now - time <= GROUNDED_STATE_TTL_MS ? new Date(time).toISOString() : null;
}
type Product = { id: string; name: string; brand?: string | null; variants: Array<{ id: string; price: number | null; original_price: number | null; stock: number; attributes: Record<string, unknown> }>; [key: string]: any };
export function filterGroundedCatalogProducts<T extends Product>(products: T[], rawProducts: any[], c: GroundedConstraints,
  metadata: { assignments: Array<{ id: string; categoryId: string | null }>; categories: Array<{ id: string; parentId: string | null; isActive?: boolean }> } = { assignments: [], categories: [] }): T[] {
  const categories = new Map(metadata.categories.map(v => [v.id, v]));
  const assignments = new Map(metadata.assignments.map(v => [v.id, v.categoryId]));
  const belongs = (p: T) => {
    if (!c.categoryIds.length) return true;
    let id = assignments.get(p.id); const seen = new Set<string>(); let matched = false;
    while (id && !seen.has(id)) { seen.add(id); const category = categories.get(id); if (!category || category.isActive === false) return false; if (c.categoryIds.includes(id)) matched = true; id = category.parentId || undefined; }
    return matched && !id;
  };
  const hints = new Map<string, Set<string>>();
  for (const raw of rawProducts) {
    if (!object(raw) || typeof raw.id !== 'string' || !Array.isArray(raw.variants) || raw.variants.length > 256) throw new GroundedContractError();
    const set = hints.get(raw.id) || new Set<string>();
    for (const v of raw.variants) { if (!object(v) || typeof v.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(v.id)) throw new GroundedContractError(); set.add(v.id); }
    hints.set(raw.id, set);
  }
  const phrase = (name: string, token: string) => (' ' + normalizeGroundedText(name) + ' ').includes(' ' + normalizeGroundedText(token) + ' ');
  return products.flatMap(p => {
    if (!hints.has(p.id) || !belongs(p) || c.brands.length && !c.brands.some(b => normalizeGroundedText(b) === normalizeGroundedText(p.brand)) || c.modelIds.length && !c.modelIds.includes(p.id) || !c.modelTokens.every(token => phrase(p.name, token))) return [];
    const variants = p.variants.filter(v => hints.get(p.id)!.has(v.id) && Number.isSafeInteger(v.price) && Number(v.price) > 0 && priceMatchesGroundedBudget(v.price!, c.budget)
      && (!c.inStock || v.stock > 0) && (!c.outOfStock || v.stock === 0) && c.attrTerms.every(({ kind, term }) => Object.entries(v.attributes).some(([key, value]) => {
        const n = normalizeGroundedText(key), matches = kind === 'capacity' ? /dung luong|storage|capacity/.test(n) : kind === 'ram' ? /ram/.test(n) : /mau|color/.test(n);
        return matches && normalizeGroundedText(value).replace(/\s/g, '') === term.replace(/\s/g, '');
      })));
    if (!variants.length) return [];
    const cheapest = [...variants].sort((a, b) => a.price! - b.price!)[0], stocked = variants.filter(v => v.stock > 0).length;
    return [{ ...p, variants, price: cheapest.price!, original_price: cheapest.original_price, stock: variants.reduce((n, v) => n + v.stock, 0),
      availability: stocked ? 'in_stock' : 'out_of_stock', existence_status: stocked === 0 ? 'OUT_OF_STOCK' : stocked === variants.length ? 'AVAILABLE' : 'PARTIALLY_AVAILABLE' }];
  });
}
export function groundedCatalogResponseText(products: Product[]): string {
  if (!products.length) return 'Không có phiên bản đáp ứng đồng thời các điều kiện đã yêu cầu trong catalog hiện tại. Bạn có muốn điều chỉnh điều kiện không?';
  return products.map(p => `${p.name}: ${Math.min(...p.variants.map(v => v.price!)).toLocaleString('vi-VN')}–${Math.max(...p.variants.map(v => v.price!)).toLocaleString('vi-VN')} đ; ${p.stock > 0 ? 'có phiên bản còn hàng' : 'hiện hết hàng'}.`).join('\n');
}
