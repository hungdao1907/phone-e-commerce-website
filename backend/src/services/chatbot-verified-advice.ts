import type { resolveChatbotCatalogProducts } from './chatbot-catalog.service';
import { groundedCatalogResponseText, normalizeGroundedText } from './chatbot-grounded-constraints';

type Products = Awaited<ReturnType<typeof resolveChatbotCatalogProducts>>;
type Variant = { id: string; sku?: string; stock: number; attributes: Record<string, string | number | boolean> };

/** Format only server-observed questions and freshly verified catalog fields, never workflow prose. */
export function verifiedCatalogAdvice(message: string, products: Products): string | null {
  if (!products.length) return null;
  const text = normalizeGroundedText(message);
  const colors = /co nhung mau nao|neu mau .+ het hang thi con mau nao khac/.test(text);
  const inventory = /con bao nhieu.*(?:kho|chiec)/.test(text);
  const ramBattery = /ram bao nhieu|pin bao nhieu mah/.test(text);
  const camera = /camera.*chup ban dem/.test(text);
  const fiveG = /ho tro 5g/.test(text);
  const drawbacks = /nhuoc diem/.test(text);
  const battery = /pin tot|pin.*hon/.test(text);
  const gaming = /choi game|lien quan|pubg/.test(text);
  const programming = /hoc lap trinh|hoc it/.test(text);
  const online = /hoc online/.test(text);
  const value = /cung tam gia.*dang mua/.test(text);
  if (![colors, inventory, ramBattery, camera, fiveG, drawbacks, battery, gaming, programming, online, value].some(Boolean)) return null;
  const lines: string[] = [];
  for (const product of products) {
    const facts: Array<{ key: string; value: string }> = [];
    const visit = (input: unknown, depth = 0) => {
      if (depth > 8) return;
      if (Array.isArray(input)) { input.slice(0, 100).forEach(v => visit(v, depth + 1)); return; }
      if (!input || typeof input !== 'object') return;
      const row = input as Record<string, unknown>;
      if ((typeof row.key === 'string' || typeof row.label === 'string') && typeof row.value === 'string') {
        facts.push({ key: String(row.key || row.label).slice(0, 100), value: row.value.slice(0, 1000) });
      } else for (const [key, val] of Object.entries(row).slice(0, 100)) {
        if (typeof val === 'string' && key !== 'title') facts.push({ key: key.slice(0, 100), value: val.slice(0, 1000) });
        else if (val && typeof val === 'object') visit(val, depth + 1);
      }
    };
    visit(product.specifications);
    const matching = (re: RegExp) => facts.filter(f => re.test(normalizeGroundedText(f.key))).map(f => `${f.key}: ${f.value}`);
    if (colors) {
      const available = [...new Set<string>(product.variants.filter((v: Variant) => v.stock > 0).flatMap((v: Variant) => Object.entries(v.attributes)
        .filter(([k]) => /mau|color/.test(normalizeGroundedText(k))).map(([, v]) => String(v))))];
      const alternative = text.match(/^neu mau (.+) het hang thi/);
      lines.push(`${product.name}: ` + (alternative
        ? (available.some(c => normalizeGroundedText(c) === alternative[1]) ? `${alternative[1]} hiện vẫn còn hàng. ` : '')
          + `Màu khác còn hàng: ${available.filter(c => normalizeGroundedText(c) !== alternative[1]).join(', ') || 'chưa có'}.`
        : `Các màu còn hàng: ${available.join(', ') || 'chưa có'}.`));
      continue;
    }
    if (inventory) {
      lines.push(`${product.name}: ${product.stock} chiếc đáp ứng lựa chọn hiện tại. ` + product.variants.map((v: Variant) =>
        `${Object.values(v.attributes).join(' · ') || v.sku || 'Phiên bản'}: ${v.stock} chiếc`).join('; '));
      continue;
    }
    let details: string[];
    if (ramBattery) {
      details = matching(/ram|pin|battery/);
      if (!details.some(v => /ram/i.test(v))) {
        const ram = [...new Set(product.variants.flatMap((v: Variant) => Object.entries(v.attributes).filter(([k]) => /ram/.test(normalizeGroundedText(k))).map(([, v]) => String(v))))];
        if (ram.length) details.unshift(`RAM: ${ram.join(', ')}`);
      }
      if (!details.some(v => /mah/i.test(v))) details.push('Catalog chưa cung cấp dung lượng pin mAh; không suy ra mAh từ thời lượng sử dụng.');
    } else if (camera) details = [...matching(/camera/), 'Chưa có đánh giá chụp ban đêm được xác minh trong catalog; chưa đủ dữ liệu kết luận chất lượng chụp đêm.'];
    else if (fiveG) {
      details = facts.filter(f => /5g/i.test(f.value)).map(f => `${f.key}: ${f.value}`);
      if (!details.length) details = /\b5g\b/i.test(product.name)
        ? ['Tên sản phẩm trong catalog ghi 5G.'] : ['Catalog chưa có thông tin xác nhận hỗ trợ 5G; cần kiểm tra tài liệu chính hãng.'];
    } else if (drawbacks) details = [...matching(/man hinh|tan so|pin/), 'Catalog chưa có đánh giá nhược điểm độc lập. Bạn ưu tiên màn hình, pin hay camera để đối chiếu giới hạn thông số?'];
    else details = matching(battery ? /pin|battery/ : /cpu|chip|gpu|ram|bo nho|do hoa|pin/);
    lines.push(`${product.name}: ${details.join('; ') || 'Chưa có đủ thông số cho tiêu chí này trong catalog.'}`);
  }
  if (battery) lines.push('Dung lượng mAh và thời lượng công bố không phải phép đo cùng điều kiện; chưa đủ dữ liệu kết luận thời lượng thực tế.');
  if (gaming) lines.push('Chưa có benchmark FPS trong catalog; hiệu năng thực tế phụ thuộc trò chơi, thiết lập và điều kiện sử dụng.');
  if (value) lines.push('Bạn ưu tiên CPU, GPU, màn hình hay tính di động để chọn giữa các cấu hình này?');
  if (programming) lines.push('Bạn học web, ứng dụng hay đồ họa/game? Cấu hình cần chọn phụ thuộc công cụ và mức tải.');
  return lines.join('\n') + '\n' + groundedCatalogResponseText(products);
}
