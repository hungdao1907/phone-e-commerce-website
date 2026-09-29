import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, '..');
const sourceRoot = path.join(frontendRoot, 'src');
const adminRoot = path.join(sourceRoot, 'components', 'admin');
const outputPath = path.join(sourceRoot, 'admin-knowledge', 'generated-admin-knowledge.json');

const PAGE_DEFINITIONS = [
  ['dashboard', '/dashboard', 'Tổng quan', 'Tổng quan', 'MainDashboardView.tsx', ['dashboard', 'doanh thu', 'tổng quan']],
  ['planned', '/dashboard/planned', 'Nội dung & Marketing', 'Lịch kế hoạch', 'InteractiveCalendar.tsx', ['lịch', 'kế hoạch']],
  ['product', '/dashboard/product', 'Sản phẩm', 'Danh sách', 'ProductList.tsx', ['sản phẩm', 'sku', 'biến thể']],
  ['inventory', '/dashboard/inventory', 'Sản phẩm', 'Kho hàng', 'Inventory.tsx', ['kho', 'tồn kho', 'sku', 'nhập xuất']],
  ['categories', '/dashboard/categories', 'Sản phẩm', 'Danh mục & phân loại', 'Categories.tsx', ['danh mục', 'phân loại']],
  ['orders-list', '/dashboard/orders-list', 'Đơn hàng', 'Danh sách đơn hàng', 'Orders.tsx', ['đơn hàng', 'mã đơn', 'trạng thái']],
  ['orders-reviews', '/dashboard/orders-reviews', 'Đơn hàng', 'Đánh giá sản phẩm', 'Reviews.tsx', ['đánh giá']],
  ['orders-complaints', '/dashboard/orders-complaints', 'Đơn hàng', 'Khiếu nại / Hỗ trợ', 'Complaints.tsx', ['khiếu nại', 'hỗ trợ']],
  ['orders-invoices', '/dashboard/orders-invoices', 'Đơn hàng', 'Hóa đơn & Chứng từ', 'Invoices.tsx', ['hóa đơn', 'chứng từ']],
  ['crm-customers', '/dashboard/crm-customers', 'CRM', 'Khách hàng', 'CustomerManager.tsx', ['khách hàng', 'email', 'số điện thoại']],
  ['crm-leads', '/dashboard/crm-leads', 'CRM', 'Khách hàng tiềm năng', 'LeadManager.tsx', ['lead', 'tiềm năng']],
  ['user-staff', '/dashboard/user-staff', 'Nhân sự', 'Quản lý Nhân sự', 'StaffManager.tsx', ['nhân sự', 'tài khoản', 'vai trò']],
  ['marketing', '/dashboard/marketing', 'Marketing', 'Chiến dịch Marketing', 'Marketing.tsx', ['chiến dịch', 'khuyến mãi', 'flash sale']],
  ['banners', '/dashboard/banners', 'Marketing', 'Quản lý Banner', 'Banners.tsx', ['banner', 'hình ảnh', 'điều hướng']],
  ['settings', '/dashboard/settings', 'Hệ thống', 'Cài đặt', 'SettingsManager.tsx', ['cài đặt', 'hệ thống']],
];

const SKIP_FILE = /(?:\.test\.|\.spec\.)/i;
const SECRET_PATTERN = /(authorization|bearer|token|password|secret|credential|database|supabase|\.env|api[_-]?key)/i;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(tsx?|jsx?)$/.test(entry.name) && !SKIP_FILE.test(entry.name) ? [full] : [];
  });
}

function cleanText(value) {
  return value
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values, limit = 80) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length >= 2 && value.length <= 140))].slice(0, limit);
}

function extractUi(source) {
  const labels = [];
  const actions = [];
  const fields = [];
  const messages = [];
  const apiCalls = [];

  for (const match of source.matchAll(/<(?:label|span|p|h1|h2|h3|button)[^>]*>([\s\S]*?)<\/(?:label|span|p|h1|h2|h3|button)>/gi)) {
    const text = cleanText(match[1]);
    if (!text || SECRET_PATTERN.test(text) || /[{}]|className=|set[A-Z]|\b(?:onClick|map|filter)\b|=>/.test(text)) continue;
    if (/^(Lưu|Thêm|Tạo|Sửa|Xóa|Xoá|Hủy|Đóng|Xem|Tải|Cập nhật|Bật|Tắt|Hiện|Ẩn|Gửi|Xác nhận|Hoàn thành|Preview|Chọn|Sinh|Cài đặt|Đang)/i.test(text)) actions.push(text);
    else labels.push(text);
  }

  for (const match of source.matchAll(/[`'\"]([^`'\"]{2,100})[`'\"]/g)) {
    const text = match[1].trim();
    if (!SECRET_PATTERN.test(text) && /^(Lưu|Thêm|Tạo|Sửa|Xóa|Xoá|Hủy|Đóng|Xem|Tải|Cập nhật|Bật|Tắt|Hiện|Ẩn|Gửi|Xác nhận|Hoàn thành|Chọn|Sinh|Đang|Vui lòng|Sản phẩm cần|Mã SKU|Giá bán|Giá khuyến mãi|Tồn kho|Ảnh vượt|Lỗi)/i.test(text)) {
      actions.push(text);
    }
  }

  for (const match of source.matchAll(/(?:placeholder|aria-label|title)\s*=\s*['"`]([^'"`]+)['"`]/g)) {
    const text = match[1].trim();
    if (!SECRET_PATTERN.test(text)) fields.push({ label: null, placeholder: text });
  }

  for (const match of source.matchAll(/<label[^>]*>([\s\S]*?)<\/label>[\s\S]{0,700}?<(?:input|textarea|select)\b([^>]*)>/gi)) {
    const label = cleanText(match[1]);
    const attrs = match[2];
    if (!label || SECRET_PATTERN.test(label)) continue;
    const placeholder = attrs.match(/placeholder\s*=\s*['"`]([^'"`]+)['"`]/i)?.[1] || null;
    const type = attrs.match(/type\s*=\s*['"`]([^'"`]+)['"`]/i)?.[1] || 'text';
    fields.push({ label, type, placeholder });
  }

  for (const match of source.matchAll(/(?:alert\(|set[A-Za-z]*Error\([^)]*|message\s*[:=]|throw new Error\()\s*[`'\"]([^`'\"]{4,180})[`'\"]/g)) {
    const text = match[1].trim();
    if (!SECRET_PATTERN.test(text)) messages.push(text);
  }

  for (const match of source.matchAll(/(?:fetch|axios\.(?:get|post|put|patch|delete))\s*\(\s*[`'\"]([^`'\"]+)/g)) {
    const rawEndpoint = match[1].replace(/\$\{[^}]+\}/g, ':id').split('?')[0];
    const apiIndex = rawEndpoint.indexOf('/api/');
    if (apiIndex >= 0) apiCalls.push(rawEndpoint.slice(apiIndex));
  }

  for (const label of ['Lưu sản phẩm', 'Thêm sản phẩm mới', 'Tạo chiến dịch', 'Lưu chiến dịch', 'Tạo Banner Mới', 'Thêm Banner Mới', 'Tạo phiếu Nhập/Xuất']) {
    if (source.includes(label)) actions.push(label);
  }

  const headings = unique([...source.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => cleanText(m[1])));
  return {
    pageTitle: headings[0] || null,
    labels: unique(labels, 100),
    actions: unique(actions, 80),
    fields: unique(fields.map((field) => JSON.stringify(field)), 120).map((field) => JSON.parse(field)),
    messages: unique(messages, 80),
    apiCalls: unique(apiCalls, 30),
  };
}

function extractStatuses(source) {
  const statuses = [];
  const objectPattern = /([A-Za-z][\w-]*)\s*:\s*\{[^{}]{0,500}?label\s*:\s*['"`]([^'"`]+)['"`]/g;
  for (const match of source.matchAll(objectPattern)) {
    if (['pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled', 'returned', 'paid', 'refunded', 'unpaid', 'active', 'disabled'].includes(match[1])) {
      statuses.push({ value: match[1], label: match[2] });
    }
  }
  return statuses;
}

function findSourceFile(fileName) {
  return walk(adminRoot).find((file) => path.basename(file) === fileName) || null;
}

const allAdminFiles = walk(adminRoot);
const pageRecords = PAGE_DEFINITIONS.map(([id, route, section, label, fileName, keywords]) => {
  const file = findSourceFile(fileName);
  const source = file ? fs.readFileSync(file, 'utf8') : '';
  const ui = extractUi(source);
  const relativeFile = file ? path.relative(frontendRoot, file).replaceAll(path.sep, '/') : null;
  const statuses = extractStatuses(source);
  const validations = ui.messages.filter((message) => /required|bắt buộc|vui lòng|không được|không thể|thất bại|lỗi|trống|phải|sản phẩm cần|bị trùng|không hợp lệ|vượt quá/i.test(message)).map((message) => ({ message }));
  return {
    id,
    route,
    section,
    label,
    pageTitle: ui.pageTitle || label,
    component: fileName.replace(/\.tsx$/, ''),
    sourceFile: relativeFile,
    keywords,
    actions: ui.actions,
    fields: ui.fields,
    labels: ui.labels,
    messages: ui.messages,
    validations,
    statuses,
    apiCalls: ui.apiCalls,
  };
});

const routes = pageRecords.map(({ id, route, section, label, pageTitle, component, sourceFile }) => ({ route, viewId: id, section, label, pageTitle, component, sourceFile }));
const statuses = pageRecords.flatMap((page) => page.statuses.map((status) => ({ ...status, page: page.pageTitle, route: page.route })));
const validations = pageRecords.flatMap((page) => page.validations.map((validation) => ({ ...validation, page: page.pageTitle, route: page.route })));
const forms = pageRecords.filter((page) => page.fields.length > 0).map((page) => ({ page: page.pageTitle, route: page.route, fields: page.fields, submitActions: page.actions.filter((action) => /lưu|thêm|tạo|cập nhật|xác nhận/i.test(action)), validationMessages: page.validations.map((validation) => validation.message) }));
const workflows = pageRecords.map((page) => ({ page: page.pageTitle, route: page.route, entry: `${page.section} → ${page.label}`, confirmedActions: page.actions, note: page.actions.length ? 'Chỉ sử dụng các thao tác được trích xuất từ source UI.' : 'Source chưa xác nhận đầy đủ quy trình thao tác.' }));
const troubleshooting = pageRecords.flatMap((page) => page.validations.map((validation) => ({ page: page.pageTitle, route: page.route, symptom: validation.message, whereToCheck: `${page.section} → ${page.label}`, recommendedAction: 'Kiểm tra lại trường hoặc điều kiện được hiển thị trong source UI trước khi lưu.' })));
const navigation = [...new Map(pageRecords.map((page) => [page.section, { section: page.section, pages: pageRecords.filter((candidate) => candidate.section === page.section).map((candidate) => ({ id: candidate.id, label: candidate.label, route: candidate.route })) }])).values()];

const knowledge = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceOfTruth: 'frontend/src/components/admin plus App.tsx and service calls used by Admin views',
  security: { includesLiveBusinessData: false, includesSecrets: false, includesCustomerRecords: false },
  navigation,
  routes,
  pages: pageRecords,
  forms,
  workflows,
  validations,
  statuses,
  troubleshooting,
  sourceFiles: allAdminFiles.map((file) => path.relative(frontendRoot, file).replaceAll(path.sep, '/')).sort(),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(knowledge, null, 2)}\n`, 'utf8');
console.log(`Generated ${path.relative(frontendRoot, outputPath)} (${pageRecords.length} pages, ${forms.length} forms, ${validations.length} validations, ${statuses.length} statuses).`);
