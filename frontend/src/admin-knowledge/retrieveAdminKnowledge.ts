import knowledge from './generated-admin-knowledge.json';

type AdminPage = (typeof knowledge.pages)[number];

const STOP_WORDS = new Set([
  'cho', 'toi', 'tôi', 'cach', 'cách', 'lam', 'làm', 'the', 'thế', 'nao', 'nào',
  'voi', 'với', 've', 'về', 'tren', 'trên', 'trong', 'cua', 'của', 'va', 'và',
  'mot', 'một', 'nhu', 'như', 'phai', 'phải', 'duoc', 'được', 'giup', 'giúp',
  'hay', 'hãy', 'toi', 'tôi', 'admin', 'webphone', 'page', 'trang',
]);

function normalize(value: string) {
  return value
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value: string) {
  return normalize(value).split(/\s+/).filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function pageText(page: AdminPage) {
  return normalize([
    page.pageTitle,
    page.section,
    page.label,
    ...page.keywords,
    ...page.actions,
    ...page.labels,
    ...page.fields.map((field) => `${field.label ?? ''} ${field.placeholder ?? ''}`),
    ...page.validations.map((validation) => validation.message),
  ].join(' '));
}

function compactPage(page: AdminPage, operation?: 'create-product' | 'product-variant' | 'inventory' | 'publish') {
  const isProductPage = page.route === '/dashboard/product';
  const actions = operation && isProductPage
    ? page.actions.filter((action) => (operation === 'create-product'
      ? [
      'Thêm sản phẩm mới',
      'Tải ảnh',
      'Sinh biến thể tự động',
      'Lưu sản phẩm',
      ]
      : [
        'Sinh biến thể tự động',
        'Thêm biến thể',
        'Lưu sản phẩm',
      ]).includes(action))
    : page.actions;
  const validations = operation && isProductPage
    ? page.validations.filter((validation) => validation.message === 'Sản phẩm cần ít nhất 1 biến thể.')
    : page.validations;
  const lines = [
    `Page: ${page.pageTitle}`,
    `Route: ${page.route}`,
    `Menu: ${page.section} → ${page.label}`,
    `Actions: ${actions.join(' | ') || 'Source chưa xác nhận thao tác cụ thể.'}`,
    `Fields: ${page.fields.map((field) => [field.label, field.placeholder].filter(Boolean).join(' — ')).join(' | ') || 'Không có field được trích xuất.'}`,
    `Validation: ${validations.map((validation) => validation.message).join(' | ') || 'Không có validation message được trích xuất.'}`,
    `Statuses: ${page.statuses.map((status) => `${status.value} = ${status.label}`).join(' | ') || 'Không có status mapping tại page này.'}`,
    `UI labels: ${page.labels.slice(0, 22).join(' | ') || 'Không có label bổ sung.'}`,
  ];
  return lines.join('\n');
}

export function retrieveAdminKnowledge(question: string, maxPages = 3) {
  const normalizedQuestion = normalize(question);
  const operation = /them san pham|san pham moi|tao san pham/.test(normalizedQuestion)
    ? 'create-product' as const
    : /chua co bien the|khong co bien the|bien the/.test(normalizedQuestion)
      ? 'product-variant' as const
      : /ton kho|kho hang|nhap kho|xuat kho/.test(normalizedQuestion)
        ? 'inventory' as const
        : /publish/.test(normalizedQuestion)
          ? 'publish' as const
    : undefined;
  const queryTokens = tokens(question);
  const ranked = (knowledge.pages as AdminPage[])
    .map((page) => {
      const text = pageText(page);
      const score = queryTokens.reduce((total, token) => total + (text.includes(token) ? 1 : 0), 0)
        + page.keywords.reduce((total, keyword) => total + (normalize(question).includes(normalize(keyword)) ? 4 : 0), 0);
      return { page, score };
    })
    .sort((left, right) => right.score - left.score);

  const selected = ranked.filter((item) => item.score > 0).slice(0, maxPages).map((item) => item.page);
  const pages = operation
    ? (knowledge.pages as AdminPage[]).filter((page) => (
      operation === 'inventory' ? page.route === '/dashboard/inventory' :
      operation === 'publish' ? page.route === '/dashboard/product' :
      page.route === '/dashboard/product'
    ))
    : (selected.length ? selected : (knowledge.pages as AdminPage[]).slice(0, 2));
  const statusContext = /status|trang thai|trạng thái|pending|cho xac nhan|chờ xác nhận/i.test(question)
    ? knowledge.statuses.map((status) => `${status.value} = ${status.label} (${status.page})`).join(' | ')
    : '';

  return [
    'WEBPHONE ADMIN CONTEXT (SOURCE-DERIVED, UI KNOWLEDGE ONLY)',
    `Generated: ${knowledge.generatedAt}`,
    'Live business data: NOT INCLUDED',
    'Secrets/credentials/customer records: NOT INCLUDED',
    '',
    ...pages.map((page) => compactPage(page, operation)),
    statusContext ? `\nStatus mappings:\n${statusContext}` : '',
  ].filter(Boolean).join('\n\n');
}

