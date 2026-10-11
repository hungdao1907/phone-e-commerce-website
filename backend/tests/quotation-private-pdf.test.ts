import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { AddressInfo } from 'node:net';
import express, { RequestHandler } from 'express';
import { test } from 'node:test';
import chatbotRoutes from '../src/routes/chatbot.routes';
import { createQuotationRouters } from '../src/routes/quotation.routes';
import { denyPublicQuotationFiles } from '../src/middleware/public-uploads.middleware';
import { buildQuotationPdfRows, QuotationPdfSnapshot, renderQuotationPdf, writePrivateQuotationPdf } from '../src/services/quotation-pdf.service';
import { resolvePrivateQuotationFile } from '../src/services/quotation-private-storage';

const snapshot: QuotationPdfSnapshot = {
  id: 'quote-a',
  quoteNumber: 'QT-TEST-2026-01',
  version: 1,
  status: 'CUSTOMER_CONFIRMED',
  currency: 'VND',
  subtotal: 250000,
  discountAmount: 10000,
  shippingFee: 20000,
  totalAmount: 260000,
  shippingAddress: '123 Đường Nguyễn Huệ, Quận 1',
  shippingPhone: '0900000000',
  note: 'Giao giờ hành chính; giữ nguyên giá đã duyệt',
  expiresAt: new Date('2026-11-01T00:00:00.000Z'),
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  customer: { fullName: 'Nguyễn Thị Ánh', email: 'a@example.test' },
  items: [{
    productName: 'Điện thoại mẫu Á',
    variantSku: 'SKU-A',
    variantAttributes: { Màu: 'Đỏ', DungLuong: '256GB' },
    quantity: 2,
    unitPrice: 125000,
    lineTotal: 250000,
  }],
};

async function listen(app: express.Express): Promise<{ server: http.Server; baseUrl: string }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function close(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

type TestFixture = {
  root: string;
  publicRoot: string;
  privateRoot: string;
  files: Array<Record<string, any>>;
  server: http.Server;
  baseUrl: string;
};

async function withFixture(run: (fixture: TestFixture) => Promise<void>): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'webphone-private-pdf-'));
  const publicRoot = path.join(root, 'uploads');
  const privateRoot = path.join(root, 'private-data', 'quotations');
  await fs.mkdir(path.join(publicRoot, 'quotations'), { recursive: true });
  await fs.mkdir(path.join(publicRoot, 'products'), { recursive: true });
  await fs.mkdir(path.join(publicRoot, 'banners'), { recursive: true });
  await fs.writeFile(path.join(publicRoot, 'quotations', 'legacy.pdf'), '%PDF-legacy');
  await fs.writeFile(path.join(publicRoot, 'products', 'product.jpg'), 'public-image');
  await fs.writeFile(path.join(publicRoot, 'banners', 'banner.jpg'), 'public-banner');

  const files: Array<Record<string, any>> = [];
  const database = {
    quotation: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        if (where.id !== snapshot.id) return null;
        if (where.customerId && where.customerId !== 'customer-a') return null;
        if (where.assignedStaffId && where.assignedStaffId !== 'staff-a') return null;
        return snapshot;
      },
    },
    quotationFile: {
      findFirst: async ({ where }: { where: { quotationId: string } }) =>
        [...files].reverse().find(file => file.quotationId === where.quotationId) || null,
      create: async ({ data, select }: { data: Record<string, unknown>; select: unknown }) => {
        const file = { id: `file-${files.length + 1}`, ...data, createdAt: new Date() } as {
          id: string;
          fileName: string;
          mimeType: string;
          sizeBytes: number;
          createdAt: Date;
          quotationId: string;
          storageKey: string;
          sha256: string;
        };
        files.push(file);
        return { id: file.id, fileName: file.fileName, mimeType: file.mimeType, sizeBytes: file.sizeBytes, createdAt: file.createdAt };
      },
    },
  };

  const authenticate: RequestHandler = (request: any, response, next) => {
    const token = request.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return response.status(401).json({ message: 'Authentication required.' });
    const [role, id] = token.split(':');
    request.user = { role, id };
    next();
  };
  const routers = createQuotationRouters({
    database,
    getPricing: () => { throw new Error('Pricing is not used by PDF routes.'); },
    getOrderConverter: () => { throw new Error('Order conversion is not used by PDF routes.'); },
    getExpiry: () => new Date('2026-11-01T00:00:00.000Z'),
    privateStorage: { privateRoot, publicUploadRoots: [publicRoot] },
    authenticate,
  });
  const app = express();
  app.use('/api/quotations', routers.customer);
  app.use('/api/staff/quotations', routers.staff);
  app.use('/api/admin/quotations', routers.admin);
  app.use('/api/chatbot', chatbotRoutes);
  app.use('/uploads', denyPublicQuotationFiles, express.static(publicRoot));
  const listening = await listen(app);

  try {
    await run({ root, publicRoot, privateRoot, files, ...listening });
  } finally {
    await close(listening.server);
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('public quotation files and encoded paths are denied; product images remain public', async () => {
  await withFixture(async ({ baseUrl }) => {
    for (const url of [
      '/uploads/quotations/legacy.pdf',
      '/uploads/%71uotations/legacy.pdf',
      '/uploads/%2571uotations%252flegacy.pdf',
      '/uploads/%252e%252e/quotations/legacy.pdf',
    ]) {
      const response = await fetch(`${baseUrl}${url}`);
      assert.equal(response.status, 404, url);
      assert.match(response.headers.get('cache-control') || '', /no-store/i);
    }
    const image = await fetch(`${baseUrl}/uploads/products/product.jpg`);
    assert.equal(image.status, 200);
    assert.equal(await image.text(), 'public-image');
    const banner = await fetch(`${baseUrl}/uploads/banners/banner.jpg`);
    assert.equal(banner.status, 200);
    assert.equal(await banner.text(), 'public-banner');
  });
});

test('unauthenticated PDF download is rejected and responses never cache privately', async () => {
  await withFixture(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/quotations/quote-a/pdf`);
    assert.equal(response.status, 401);
    assert.match(response.headers.get('cache-control') || '', /private, no-store/i);
  });
});

test('customer ownership, assigned staff, and admin authorization control PDF download', async () => {
  await withFixture(async ({ baseUrl, privateRoot, files }) => {
    const generated = await fetch(`${baseUrl}/api/quotations/quote-a/pdf`, {
      method: 'POST', headers: { Authorization: 'Bearer customer:customer-a' },
    });
    assert.equal(generated.status, 201);
    const result = await generated.json() as { file: { fileName: string } };
    assert.equal(result.file.fileName, 'QT-TEST-2026-01.pdf');
    assert.equal(files.length, 1);
    assert.ok(!JSON.stringify(result).includes(files[0].storageKey));

    const customerB = await fetch(`${baseUrl}/api/quotations/quote-a/pdf`, {
      headers: { Authorization: 'Bearer customer:customer-b' },
    });
    assert.equal(customerB.status, 404);

    const unassignedStaff = await fetch(`${baseUrl}/api/staff/quotations/quote-a/pdf`, {
      headers: { Authorization: 'Bearer staff:staff-b' },
    });
    assert.equal(unassignedStaff.status, 404);

    const privatePdf = await fs.readFile(path.join(privateRoot, files[0].storageKey));
    assert.equal(privatePdf.subarray(0, 8).toString(), '%PDF-1.4');
    assert.match(privatePdf.toString('latin1'), /\/FontFile[23]/);
    assert.match(privatePdf.toString('latin1'), /\/ToUnicode/);
    const rows = buildQuotationPdfRows(snapshot).map(row => row.text);
    assert.ok(rows.includes('M\u00e3 b\u00e1o gi\u00e1: QT-TEST-2026-01'));
    assert.ok(rows.includes('Phi\u00ean b\u1ea3n: 1'));
    assert.ok(rows.includes('Kh\u00e1ch h\u00e0ng: Nguy\u1ec5n Th\u1ecb \u00c1nh'));
    assert.ok(rows.includes('1. \u0110i\u1ec7n tho\u1ea1i m\u1eabu \u00c1'));
    assert.ok(rows.includes('   SL 2 | Đơn giá 125.000 đ | Thành tiền 250.000 đ'));
    assert.ok(rows.includes('Tạm tính: 250.000 đ'));
    assert.ok(rows.includes('Tổng giảm giá: 10.000 đ'));
    assert.ok(rows.includes('Phí vận chuyển: 20.000 đ'));
    assert.ok(rows.includes('TỔNG THANH TOÁN: 260.000 đ'));
    assert.deepEqual(await fs.readdir(path.join(path.dirname(privateRoot), '..', 'uploads', 'quotations')), ['legacy.pdf']);

    for (const [url, token] of [
      [`/api/quotations/quote-a/pdf`, 'customer:customer-a'],
      [`/api/staff/quotations/quote-a/pdf`, 'staff:staff-a'],
      [`/api/admin/quotations/quote-a/pdf`, 'admin:admin-a'],
      [`/api/admin/quotations/quote-a/pdf`, 'superadmin:root-a'],
    ]) {
      const downloaded = await fetch(`${baseUrl}${url}`, { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(downloaded.status, 200);
      assert.match(downloaded.headers.get('cache-control') || '', /private, no-store/i);
      assert.equal((await downloaded.arrayBuffer()).byteLength, privatePdf.length);
    }

    const filenameManipulation = await fetch(`${baseUrl}/api/quotations/quote-a/pdf?fileName=../../legacy.pdf`, {
      headers: { Authorization: 'Bearer customer:customer-a' },
    });
    assert.equal(filenameManipulation.status, 200);
    assert.equal((await filenameManipulation.arrayBuffer()).byteLength, privatePdf.length);

    const manipulated = await fetch(`${baseUrl}/api/quotations/quote-a/pdf/../../legacy.pdf`, {
      headers: { Authorization: 'Bearer customer:customer-a' },
    });
    assert.equal(manipulated.status, 404);
  });
});

test('legacy chatbot quotation endpoints cannot upload or disclose files', async () => {
  await withFixture(async ({ baseUrl, publicRoot }) => {
    const download = await fetch(`${baseUrl}/api/chatbot/quotation-files/legacy.pdf`);
    assert.equal(download.status, 404);
    assert.match(download.headers.get('cache-control') || '', /no-store/i);
    const upload = await fetch(`${baseUrl}/api/chatbot/quotation-files`, { method: 'POST' });
    assert.equal(upload.status, 410);
    assert.equal((await fs.readdir(path.join(publicRoot, 'quotations'))).length, 1);
  });
});

test('private PDF download rejects file tampering when stored SHA-256 no longer matches', async () => {
  await withFixture(async ({ baseUrl, privateRoot, files }) => {
    const generated = await fetch(`${baseUrl}/api/quotations/quote-a/pdf`, {
      method: 'POST', headers: { Authorization: 'Bearer customer:customer-a' },
    });
    assert.equal(generated.status, 201);
    const storedPath = path.join(privateRoot, files[0].storageKey);
    await fs.appendFile(storedPath, Buffer.from('tampered'));

    const download = await fetch(`${baseUrl}/api/quotations/quote-a/pdf`, {
      headers: { Authorization: 'Bearer customer:customer-a' },
    });
    assert.equal(download.status, 404);
    assert.match(download.headers.get('cache-control') || '', /private, no-store/i);
  });
});

test('PDF generation uses persisted snapshot totals and writes an integrity checked random file outside uploads', async () => {
  const bytes = await renderQuotationPdf(snapshot);
  assert.equal(bytes.subarray(0, 8).toString(), '%PDF-1.4');
  assert.match(bytes.toString('latin1'), /\/FontFile[23]/);
  assert.match(bytes.toString('latin1'), /\/ToUnicode/);
  assert.match(bytes.toString('latin1'), /1EC5/i);

  await withFixture(async ({ publicRoot, privateRoot }) => {
    const stored = await writePrivateQuotationPdf(snapshot, { privateRoot, publicUploadRoots: [publicRoot] });
    assert.match(stored.storageKey, /^[a-f0-9]{64}\.pdf$/);
    assert.equal(stored.sha256, crypto.createHash('sha256').update(await fs.readFile(path.join(privateRoot, stored.storageKey))).digest('hex'));
    assert.equal(await fs.readdir(path.join(publicRoot, 'quotations')).then(files => files.length), 1);
    assert.throws(() => resolvePrivateQuotationFile('../legacy.pdf', { privateRoot, publicUploadRoots: [publicRoot] }));
    assert.throws(() => resolvePrivateQuotationFile('..%2flegacy.pdf', { privateRoot, publicUploadRoots: [publicRoot] }));
    await assert.rejects(() => writePrivateQuotationPdf({ ...snapshot, totalAmount: -1 }, { privateRoot, publicUploadRoots: [publicRoot] }));
  });
});

test('A4 PDF wraps long Vietnamese descriptions, repeats table across pages and preserves snapshot', async () => {
  const fixture = { ...snapshot, version: 3, status: 'NEEDS_REQUOTE',
    items: Array.from({ length: 35 }, (_, index) => ({ ...snapshot.items[0],
      productName: `Sản phẩm ${index + 1} — Điện thoại với tên tiếng Việt rất dài cần xuống dòng trong bảng báo giá`,
      variantAttributes: { 'Dung lượng': '256GB', 'Màu sắc': 'Xanh', 'Mô tả': 'Phiên bản có thuộc tính dài nhưng giữ nguyên snapshot' },
    })), note: 'Ghi chú được xác nhận: ' + 'Giao hàng theo thông tin khách đã cung cấp. '.repeat(18) };
  const original = JSON.stringify(fixture);
  const bytes = await renderQuotationPdf(fixture);
  const pdf = bytes.toString('latin1');
  assert.ok((pdf.match(/\/Type \/Page\b/g) || []).length > 1);
  assert.match(pdf, /\/MediaBox \[0 0 595\.28 841\.89\]/);
  assert.match(pdf, /\/FontFile[23]/);
  assert.equal(JSON.stringify(fixture), original);
  const rows = buildQuotationPdfRows(fixture).map(row => row.text).join('\n');
  assert.ok(rows.includes('Cần xác nhận báo giá mới'));
  assert.ok(!rows.includes('NEEDS_REQUOTE'));
  assert.ok(rows.includes('TỔNG THANH TOÁN: 260.000 đ'));
});
