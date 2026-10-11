import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { resolvePrivateQuotationFile } from './quotation-private-storage';

const PDFDocument = require('pdfkit') as any;

export type QuotationPdfSnapshot = {
  id: string;
  quoteNumber: string;
  version?: number;
  status: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: string;
  shippingPhone: string;
  note: string | null;
  expiresAt: Date | string;
  createdAt: Date | string;
  customer: { fullName: string | null; email: string };
  items: Array<{
    productName: string;
    variantSku: string | null;
    variantAttributes: unknown;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export type QuotationPdfStorage = {
  privateRoot: string;
  publicUploadRoots: string[];
};

export type StoredQuotationPdf = {
  storageKey: string;
  fileName: string;
  mimeType: 'application/pdf';
  sizeBytes: number;
  sha256: string;
};

const MAX_PDF_BYTES = 5 * 1024 * 1024;

function isWithin(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function text(value: unknown, maxLength = 1000): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLength)
    .replace(/[\r\n\t]+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, character => character === 'đ' ? 'd' : 'D')
    .replace(/[^\x20-\x7e]/g, '?')
    .trim();
}

function unicodeText(value: unknown, maxLength = 1000): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLength).replace(/[\r\n\t]+/g, ' ').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
}

function money(value: number, field: string, currency: string): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid quotation snapshot field: ${field}`);
  const safeCurrency = text(currency, 12);
  if (!safeCurrency) throw new Error('Invalid quotation snapshot currency.');
  return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ${safeCurrency === 'VND' ? 'đ' : safeCurrency}`;
}

function date(value: Date | string, field: string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error(`Invalid quotation snapshot field: ${field}`);
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(parsed);
}

function attributes(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return unicodeText(value, 500);
  if (Array.isArray(value)) return unicodeText(value.map(item => String(item)).join(', '), 500);
  if (typeof value === 'object') {
    return unicodeText(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${key}: ${String(item)}`).join(', '), 500);
  }
  return unicodeText(String(value), 500);
}

export function quotationPdfStatusLabel(status: string): string {
  return ({
    PENDING_CUSTOMER_CONFIRMATION: 'Chờ khách hàng xác nhận',
    CUSTOMER_CONFIRMED: 'Khách hàng đã xác nhận',
    APPROVED: 'Đã phê duyệt',
    NEEDS_REQUOTE: 'Cần xác nhận báo giá mới',
    REJECTED: 'Báo giá bị từ chối',
    CUSTOMER_REJECTED: 'Khách hàng đã từ chối',
    EXPIRED: 'Báo giá đã hết hạn',
    CONVERTED: 'Đã tạo đơn hàng',
  } as Record<string, string>)[status] || 'Trạng thái chưa xác định';
}

function resolveVietnameseFonts(): Record<string, string> {
  const candidates = [
    path.resolve(__dirname, '../../node_modules'),
    path.resolve(__dirname, '../../../node_modules'),
    path.resolve(process.cwd(), 'node_modules'),
  ];
  for (const root of candidates) {
    const files = {
      InterLatin: path.join(root, '@fontsource/inter/files/inter-latin-400-normal.woff'),
      InterVietnamese: path.join(root, '@fontsource/inter/files/inter-vietnamese-400-normal.woff'),
      InterLatinBold: path.join(root, '@fontsource/inter/files/inter-latin-600-normal.woff'),
      InterVietnameseBold: path.join(root, '@fontsource/inter/files/inter-vietnamese-600-normal.woff'),
    };
    if (Object.values(files).every(file => fs.existsSync(file))) return files;
  }
  throw new Error('Vietnamese Unicode font assets are unavailable.');
}

/** Explicit glyph-run coordinates avoid PDFKit continued-text cursor drift with subset fonts. */
function fontRuns(value: string, bold: boolean) {
  const runs: Array<{ font: string; value: string }> = [];
  for (const character of value.normalize('NFC')) {
    const font = /[\u0100-\u024f\u1e00-\u1eff]/u.test(character) ? 'InterVietnamese' : 'InterLatin';
    const name = font + (bold ? 'Bold' : '');
    const previous = runs[runs.length - 1];
    if (previous?.font === name) previous.value += character;
    else runs.push({ font: name, value: character });
  }
  return runs;
}

function createTextLayout(document: any) {
  const width = (value: string, size: number, bold = false) => fontRuns(value, bold)
    .reduce((sum, run) => sum + document.font(run.font).fontSize(size).widthOfString(run.value), 0);
  const wrap = (value: string, size: number, maxWidth: number, bold = false): string[] => {
    const lines: string[] = [];
    let current = '';
    for (const word of unicodeText(value, 3000).split(/\s+/).filter(Boolean)) {
      const candidate = current ? current + ' ' + word : word;
      if (width(candidate, size, bold) <= maxWidth) { current = candidate; continue; }
      if (current) { lines.push(current); current = ''; }
      for (const character of word) {
        if (current && width(current + character, size, bold) > maxWidth) { lines.push(current); current = ''; }
        current += character;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  };
  const line = (value: string, x: number, y: number, size: number, color: string, bold = false, maxWidth?: number, align = 'left') => {
    let offset = maxWidth === undefined ? 0 : align === 'right' ? maxWidth - width(value, size, bold)
      : align === 'center' ? (maxWidth - width(value, size, bold)) / 2 : 0;
    document.fillColor(color);
    for (const run of fontRuns(value, bold)) {
      document.font(run.font).fontSize(size).text(run.value, x + offset, y, { lineBreak: false });
      offset += document.widthOfString(run.value);
    }
  };
  const block = (value: string, x: number, y: number, maxWidth: number, size = 9, color = '#111827', bold = false, align = 'left') => {
    const lines = wrap(value, size, maxWidth, bold);
    lines.forEach((value, index) => line(value, x, y + index * size * 1.4, size, color, bold, maxWidth, align));
    return lines.length * size * 1.4;
  };
  return { width, wrap, line, block };
}

export type QuotationPdfTextRow = { text: string; fontSize: number; gapBefore?: number; gapAfter?: number };

export function buildQuotationPdfRows(snapshot: QuotationPdfSnapshot): QuotationPdfTextRow[] {
  if (!snapshot || !snapshot.id || !text(snapshot.quoteNumber, 80) || !text(snapshot.status, 80) || !text(snapshot.currency, 12)
    || !snapshot.customer || !Array.isArray(snapshot.items) || snapshot.items.length > 500) {
    throw new Error('Invalid quotation snapshot.');
  }

  const rows: QuotationPdfTextRow[] = [
    { text: '\u0042\u00c1O GI\u00c1 WEBPHONE', fontSize: 18, gapAfter: 0.4 },
    { text: `M\u00e3 b\u00e1o gi\u00e1: ${text(snapshot.quoteNumber, 80)}`, fontSize: 11 },
    ...(Number.isSafeInteger(snapshot.version) && (snapshot.version as number) > 0
      ? [{ text: `Phi\u00ean b\u1ea3n: ${snapshot.version}`, fontSize: 9 }]
      : []),
    { text: `Ng\u00e0y t\u1ea1o: ${date(snapshot.createdAt, 'createdAt')}    Hi\u1ec7u l\u1ef1c \u0111\u1ebfn: ${date(snapshot.expiresAt, 'expiresAt')}`, fontSize: 9 },
    { text: `Tr\u1ea1ng th\u00e1i: ${quotationPdfStatusLabel(snapshot.status)}    Ti\u1ec1n t\u1ec7: ${text(snapshot.currency, 12)}`, fontSize: 9 },
    { text: `Kh\u00e1ch h\u00e0ng: ${unicodeText(snapshot.customer.fullName || 'Kh\u00e1ch h\u00e0ng', 160)}`, fontSize: 9 },
    { text: `Email: ${unicodeText(snapshot.customer.email, 200)}`, fontSize: 9 },
    { text: `\u0110\u1ecba ch\u1ec9 giao h\u00e0ng: ${unicodeText(snapshot.shippingAddress, 1000)}`, fontSize: 9 },
    { text: `S\u1ed1 \u0111i\u1ec7n tho\u1ea1i: ${unicodeText(snapshot.shippingPhone, 40)}`, fontSize: 9, gapAfter: 0.7 },
    { text: 'S\u1ea2N PH\u1ea8M | S\u1ed0 L\u01af\u1ee2NG | \u0110\u01a0N GI\u00c1 | TH\u00c0NH TI\u1ec0N', fontSize: 9, gapAfter: 0.3 },
  ];

  snapshot.items.forEach((item, index) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw new Error('Invalid quotation snapshot quantity.');
    const sku = text(item.variantSku || '', 100);
    const variant = attributes(item.variantAttributes);
    rows.push({ text: `${index + 1}. ${unicodeText(item.productName, 300)}`, fontSize: 9 });
    if (sku || variant) rows.push({ text: `   Bi\u1ebfn th\u1ec3: ${[sku, variant].filter(Boolean).join(' | ')}`, fontSize: 9 });
    rows.push({
      text: `   SL ${item.quantity} | \u0110\u01a1n gi\u00e1 ${money(item.unitPrice, 'unitPrice', snapshot.currency)} | Th\u00e0nh ti\u1ec1n ${money(item.lineTotal, 'lineTotal', snapshot.currency)}`,
      fontSize: 9,
      gapAfter: 0.35,
    });
  });

  rows.push(
    { text: `T\u1ea1m t\u00ednh: ${money(snapshot.subtotal, 'subtotal', snapshot.currency)}`, fontSize: 9, gapBefore: 0.3 },
    { text: `T\u1ed5ng gi\u1ea3m gi\u00e1: ${money(snapshot.discountAmount, 'discountAmount', snapshot.currency)}`, fontSize: 9 },
    { text: `Ph\u00ed v\u1eadn chuy\u1ec3n: ${money(snapshot.shippingFee, 'shippingFee', snapshot.currency)}`, fontSize: 9 },
    { text: `T\u1ed4NG THANH TO\u00c1N: ${money(snapshot.totalAmount, 'totalAmount', snapshot.currency)}`, fontSize: 12 },
  );
  if (snapshot.note) rows.push({ text: `Ghi ch\u00fa: ${unicodeText(snapshot.note, 1000)}`, fontSize: 9, gapBefore: 0.6 });
  return rows;
}

export async function renderQuotationPdf(snapshot: QuotationPdfSnapshot): Promise<Buffer> {
  buildQuotationPdfRows(snapshot); // Validate the persisted snapshot without changing any amounts.
  const document = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true, pdfVersion: '1.4', compress: false,
    info: { Title: 'Báo giá ' + snapshot.quoteNumber, Author: 'WebPhone' } });
  const chunks: Buffer[] = [];
  const output = new Promise<Buffer>((resolve, reject) => {
    document.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    document.once('end', () => resolve(Buffer.concat(chunks)));
    document.once('error', reject);
  });
  for (const [name, file] of Object.entries(resolveVietnameseFonts())) document.registerFont(name, file);
  const t = createTextLayout(document);
  const left = 42, pageWidth = 595.28, contentWidth = pageWidth - left * 2, bottom = 754;
  const ink = '#111827', muted = '#64748B', accent = '#D4F36B', soft = '#F4F6F8';
  let y = 42;
  const header = (continued = false) => {
    document.roundedRect(left, 42, 28, 34, 5).lineWidth(1.5).strokeColor(ink).stroke();
    document.moveTo(left + 10, 70).lineTo(left + 18, 70).stroke();
    t.line('WebPhone', left + 40, 44, continued ? 19 : 23, ink, true);
    t.block(continued ? 'BÁO GIÁ - TIẾP THEO' : 'BÁO GIÁ SẢN PHẨM', 285, 46, contentWidth - 243, 14, ink, true, 'right');
    document.moveTo(left, 96).lineTo(pageWidth - left, 96).lineWidth(1).strokeColor('#DCE2E8').stroke();
    document.rect(left, 94, 48, 4).fill(accent);
    y = 116;
    if (continued) { t.block(snapshot.quoteNumber + ' | Phiên bản ' + (snapshot.version || 1), left, y, contentWidth, 9, muted); y += 30; }
  };
  const newPage = () => { document.addPage(); header(true); };
  const ensure = (height: number) => { if (y + height > bottom) newPage(); };
  header();

  t.line('MÃ BÁO GIÁ', left, y, 8, muted, true);
  t.line('PHIÊN BẢN / TRẠNG THÁI', 320, y, 8, muted, true);
  const codeHeight = t.block(snapshot.quoteNumber, left, y + 17, 250, 11, ink, true);
  const statusHeight = t.block('v' + (snapshot.version || 1) + ' | ' + quotationPdfStatusLabel(snapshot.status), 320, y + 17, pageWidth - left - 320, 9, ink);
  y += 24 + Math.max(codeHeight, statusHeight);
  t.line('NGÀY TẠO', left, y, 8, muted, true);
  t.line('HIỆU LỰC ĐẾN', 320, y, 8, muted, true);
  t.block(date(snapshot.createdAt, 'createdAt'), left, y + 16, 250, 9, ink);
  t.block(date(snapshot.expiresAt, 'expiresAt'), 320, y + 16, pageWidth - left - 320, 9, ink);
  y += 50;

  const customerLines = [
    { value: unicodeText(snapshot.customer.fullName || 'Khách hàng', 160), size: 11, bold: true },
    { value: 'Email: ' + unicodeText(snapshot.customer.email, 200), size: 9, bold: false },
    { value: 'Điện thoại: ' + unicodeText(snapshot.shippingPhone, 40), size: 9, bold: false },
    { value: 'Giao nhận: ' + unicodeText(snapshot.shippingAddress, 1000), size: 9, bold: false },
  ];
  const customerHeight = 39 + customerLines.reduce((sum, entry) =>
    sum + t.wrap(entry.value, entry.size, contentWidth - 32, entry.bold).length * entry.size * 1.4 + 5, 0);
  ensure(customerHeight);
  document.roundedRect(left, y, contentWidth, customerHeight, 7).fill(soft);
  t.line('THÔNG TIN KHÁCH HÀNG', left + 16, y + 14, 8, muted, true);
  let customerY = y + 33;
  customerLines.forEach(entry => { customerY += t.block(entry.value, left + 16, customerY, contentWidth - 32, entry.size, ink, entry.bold) + 5; });
  y += customerHeight + 24;

  const columns = [32, 226, 38, 100, contentWidth - 396];
  const positions = columns.map((_, index) => left + columns.slice(0, index).reduce((sum, value) => sum + value, 0));
  const tableHeader = () => {
    document.roundedRect(left, y, contentWidth, 30, 4).fill(ink);
    ['STT', 'Sản phẩm / Phiên bản', 'SL', 'Đơn giá', 'Thành tiền'].forEach((label, index) =>
      t.block(label, positions[index] + 7, y + 9, columns[index] - 14, 8, '#FFFFFF', true, index < 2 ? 'left' : 'right'));
    y += 30;
  };
  let tableStarted = false;
  snapshot.items.forEach((item, index) => {
    const name = unicodeText(item.productName, 300);
    const variant = attributes(item.variantAttributes);
    const sku = item.variantSku ? 'SKU: ' + unicodeText(item.variantSku, 100) : '';
    const nameHeight = t.wrap(name, 10, columns[1] - 16, true).length * 14;
    const variantHeight = variant ? t.wrap(variant, 8.5, columns[1] - 16).length * 11.9 + 4 : 0;
    const skuHeight = sku ? t.wrap(sku, 8, columns[1] - 16).length * 11.2 + 4 : 0;
    const price = money(item.unitPrice, 'unitPrice', snapshot.currency);
    const total = money(item.lineTotal, 'lineTotal', snapshot.currency);
    const numericHeight = Math.max(t.wrap(price, 9, columns[3] - 14).length, t.wrap(total, 9, columns[4] - 14, true).length) * 12.6;
    const rowHeight = Math.max(52, nameHeight + variantHeight + skuHeight + 20, numericHeight + 20);
    if (y + rowHeight + (tableStarted ? 0 : 30) > bottom) { newPage(); tableStarted = false; }
    if (!tableStarted) { tableHeader(); tableStarted = true; }
    document.rect(left, y, contentWidth, rowHeight).fill(index % 2 === 0 ? '#FFFFFF' : '#F8FAFC');
    t.line(String(index + 1), positions[0] + 7, y + 12, 9, muted);
    let descriptionY = y + 10;
    descriptionY += t.block(name, positions[1] + 8, descriptionY, columns[1] - 16, 10, ink, true);
    if (variant) descriptionY += 4 + t.block(variant, positions[1] + 8, descriptionY + 4, columns[1] - 16, 8.5, muted);
    if (sku) t.block(sku, positions[1] + 8, descriptionY + 4, columns[1] - 16, 8, muted);
    t.block(String(item.quantity), positions[2] + 7, y + 12, columns[2] - 14, 9, ink, false, 'right');
    t.block(price, positions[3] + 7, y + 12, columns[3] - 14, 9, ink, false, 'right');
    t.block(total, positions[4] + 7, y + 12, columns[4] - 14, 9, ink, true, 'right');
    y += rowHeight;
    document.moveTo(left, y).lineTo(pageWidth - left, y).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
  });
  y += 22;
  const note = unicodeText(snapshot.note || '', 1000);
  const noteHeight = note ? t.wrap(note, 9, 222).length * 12.6 + 26 : 0;
  const summaryHeight = Math.max(150, noteHeight);
  ensure(summaryHeight + 55);
  if (note) { t.line('GHI CHÚ', left, y + 3, 8, muted, true); t.block(note, left, y + 23, 222, 9, ink); }
  const summaryX = pageWidth - left - 260;
  document.roundedRect(summaryX, y, 260, 145, 7).fill(soft);
  [
    ['Tạm tính', money(snapshot.subtotal, 'subtotal', snapshot.currency)],
    ['Giảm giá', money(snapshot.discountAmount, 'discountAmount', snapshot.currency)],
    ['Phí vận chuyển', money(snapshot.shippingFee, 'shippingFee', snapshot.currency)],
  ].forEach(([label, value], index) => {
    t.line(label, summaryX + 16, y + 16 + index * 27, 9, muted);
    t.block(value, summaryX + 128, y + 16 + index * 27, 116, 9, ink, false, 'right');
  });
  document.roundedRect(summaryX, y + 98, 260, 47, 6).fill(ink);
  t.line('TỔNG THANH TOÁN', summaryX + 16, y + 108, 8, '#FFFFFF', true);
  t.block(money(snapshot.totalAmount, 'totalAmount', snapshot.currency), summaryX + 16, y + 122, 228, 13, accent, true, 'right');
  y += summaryHeight + 22;
  t.block('Báo giá có hiệu lực đến ' + date(snapshot.expiresAt, 'expiresAt') + '. Giá trị hiển thị theo phiên bản báo giá này.', left, y, contentWidth, 8.5, muted);
  const pageRange = document.bufferedPageRange();
  for (let page = 0; page < pageRange.count; page++) {
    document.switchToPage(pageRange.start + page);
    document.moveTo(left, 786).lineTo(pageWidth - left, 786).lineWidth(0.5).strokeColor('#DCE2E8').stroke();
    t.line('WebPhone | Báo giá sản phẩm', left, 798, 8, muted);
    t.line('Trang ' + (page + 1) + ' / ' + pageRange.count, pageWidth - left - 88, 798, 8, muted, false, 88, 'right');
  }
  document.end();
  const result = await output;
  if (result.length > MAX_PDF_BYTES) throw new Error('Generated quotation PDF exceeds the size limit.');
  return result;
}

async function assertPrivateRoot(privateRoot: string, publicUploadRoots: string[]): Promise<string> {
  const resolvedRoot = path.resolve(privateRoot);
  const realRoot = await fs.promises.realpath(resolvedRoot);
  for (const publicInput of publicUploadRoots) {
    const publicRoot = path.resolve(publicInput);
    if (isWithin(publicRoot, resolvedRoot) || isWithin(resolvedRoot, publicRoot)) {
      throw new Error('Private quotation storage overlaps public uploads.');
    }
    try {
      const realPublicRoot = await fs.promises.realpath(publicRoot);
      if (isWithin(realPublicRoot, realRoot) || isWithin(realRoot, realPublicRoot)) {
        throw new Error('Private quotation storage resolves inside public uploads.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('resolves inside public uploads')) throw error;
    }
  }
  return realRoot;
}

export async function writePrivateQuotationPdf(
  snapshot: QuotationPdfSnapshot,
  storage: QuotationPdfStorage,
): Promise<StoredQuotationPdf> {
  const privateRoot = path.resolve(storage.privateRoot);
  await fs.promises.mkdir(privateRoot, { recursive: true, mode: 0o700 });
  const realRoot = await assertPrivateRoot(privateRoot, storage.publicUploadRoots);
  const bytes = await renderQuotationPdf(snapshot);
  const storageKey = `${crypto.randomBytes(32).toString('hex')}.pdf`;
  const filePath = resolvePrivateQuotationFile(storageKey, {
    privateRoot: realRoot,
    publicUploadRoots: storage.publicUploadRoots,
  });
  let created = false;
  try {
    const handle = await fs.promises.open(filePath, 'wx', 0o600);
    created = true;
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    const persisted = await fs.promises.readFile(filePath);
    if (persisted.length !== bytes.length || !persisted.subarray(0, 8).equals(Buffer.from('%PDF-1.4'))) {
      throw new Error('Generated quotation PDF integrity verification failed.');
    }
    const safeQuote = text(snapshot.quoteNumber, 80).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) || 'quotation';
    return {
      storageKey,
      fileName: `${safeQuote}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: persisted.length,
      sha256: crypto.createHash('sha256').update(persisted).digest('hex'),
    };
  } catch (error) {
    if (created) await fs.promises.unlink(filePath).catch(() => undefined);
    throw error;
  }
}

export async function removePrivateQuotationPdf(storageKey: string, storage: QuotationPdfStorage): Promise<void> {
  const privateRoot = await assertPrivateRoot(path.resolve(storage.privateRoot), storage.publicUploadRoots);
  const filePath = resolvePrivateQuotationFile(storageKey, {
    privateRoot,
    publicUploadRoots: storage.publicUploadRoots,
  });
  const realFile = await fs.promises.realpath(filePath);
  if (!isWithin(privateRoot, realFile)) throw new Error('Quotation file is outside private storage.');
  await fs.promises.unlink(realFile);
}
