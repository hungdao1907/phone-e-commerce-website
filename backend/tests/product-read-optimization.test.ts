import assert from 'node:assert/strict';
import test, { before } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { extractAdminFiltersFromProducts, extractFiltersFromProducts } from '../src/services/filter.service';

const secret = 'product-read-fixture-only-secret';
let prisma: any;
let productRouter: any;

before(async () => {
  process.env.JWT_SECRET = secret;
  prisma = (await import('../src/config/prisma')).default;
  productRouter = (await import('../src/routes/product.routes')).default;
});

const category = { id: 'phone', slug: 'samsung', name: 'Phones' };
const products = [
  { id: 'cheap', name: 'Samsung A', brand: 'Samsung', status: 'active', categoryId: 'phone', category,
    specifications: [{ key: 'RAM', value: '8GB' }], createdAt: new Date('2025-02-02'),
    variants: [{ id: 'cheap-v', productId: 'cheap', sku: 'SA-256', attributes: { 'Màu sắc': 'Đen', 'Dung lượng': '256GB' }, colorCode: '#000', price: 9000000, salePrice: 8000000, stock: 2, createdAt: new Date('2025-02-02') }] },
  { id: 'expensive', name: 'Samsung B', brand: 'Samsung', status: 'active', categoryId: 'phone', category,
    specifications: [{ key: 'RAM', value: '12GB' }], createdAt: new Date('2025-02-01'),
    variants: [{ id: 'expensive-v', productId: 'expensive', sku: 'SB-512', attributes: { 'Màu sắc': 'Trắng', 'Dung lượng': '512GB' }, colorCode: '#fff', price: 18000000, salePrice: null, stock: 0, createdAt: new Date('2025-02-01') }] },
  { id: 'apple', name: 'iPhone', brand: 'Apple', status: 'active', categoryId: 'phone', category,
    specifications: [], createdAt: new Date('2025-01-01'),
    variants: [{ id: 'apple-v', productId: 'apple', sku: 'IP-128', attributes: { 'Màu sắc': 'Đen' }, colorCode: '#000', price: 7000000, salePrice: null, stock: 1, createdAt: new Date('2025-01-01') }] },
];
const reviews = [
  { productId: 'cheap', rating: 4, status: 'APPROVED' },
  { productId: 'cheap', rating: 5, status: 'APPROVED' },
  { productId: 'cheap', rating: 1, status: 'PENDING' },
  { productId: 'expensive', rating: 3, status: 'APPROVED' },
];

function projectProduct(product: any, select: any) {
  if (!select) return product;
  const result: any = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (key === 'variants') result.variants = product.variants.map((variant: any) => {
      const selected: any = {};
      for (const field of Object.keys((enabled as any).select)) selected[field] = variant[field];
      return selected;
    });
    else if (enabled) result[key] = product[key];
  }
  return result;
}

async function setup(t: any) {
  const queries: any[] = [];
  const productFindMany = prisma.product.findMany;
  const productFindUnique = prisma.product.findUnique;
  const campaignFindMany = prisma.campaign.findMany;
  const reviewGroupBy = prisma.review.groupBy;
  prisma.product.findMany = async (args: any) => {
    queries.push(args);
    const matches = products.filter(p => {
      if (args.where?.status && p.status !== args.where.status) return false;
      if (args.where?.brand?.equals && p.brand.toLowerCase() !== args.where.brand.equals.toLowerCase()) return false;
      if (args.where?.OR && !args.where.OR.some((part: any) => p.brand.toLowerCase() === part.brand.equals.toLowerCase())) return false;
      if (args.where?.category?.slug?.in && !args.where.category.slug.in.includes(p.category.slug)) return false;
      if (args.where?.AND?.some((part: any) => part.variants?.some?.OR)) {
        const bound = args.where.AND.find((part: any) => part.variants?.some?.OR).variants.some.OR[0].salePrice.lte;
        if (!p.variants.some(v => (v.salePrice !== null && v.salePrice <= bound) || v.price <= bound)) return false;
      }
      return true;
    });
    return matches.map(p => projectProduct(p, args.select));
  };
  prisma.product.findUnique = async ({ where }: any) => products.find(p => p.id === where.id) ?? null;
  prisma.campaign.findMany = async () => [];
  prisma.review.groupBy = async ({ where }: any) => {
    const approved = reviews.filter(r => where.productId.in.includes(r.productId) && r.status === where.status);
    return [...new Set(approved.map(r => r.productId))].map(productId => {
      const ratings = approved.filter(r => r.productId === productId).map(r => r.rating);
      return { productId, _count: { _all: ratings.length }, _avg: { rating: ratings.reduce((a, b) => a + b, 0) / ratings.length } };
    });
  };
  t.after(() => {
    prisma.product.findMany = productFindMany;
    prisma.product.findUnique = productFindUnique;
    prisma.campaign.findMany = campaignFindMany;
    prisma.review.groupBy = reviewGroupBy;
  });
  const app = express(); app.use('/api/products', productRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); server.closeAllConnections(); }));
  const address = server.address() as { port: number };
  return { queries, request: async (path: string, token?: string) => {
    const result = await fetch(`http://127.0.0.1:${address.port}/api/products${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return { status: result.status, body: await result.json() as any };
  } };
}

test('filter endpoints project only columns used while matching legacy fixture output', async t => {
  const { request, queries } = await setup(t);
  const publicResponse = await request('/filters?category=phone&brand=Samsung');
  assert.equal(publicResponse.status, 200);
  const matching = products.filter(p => p.brand === 'Samsung');
  const legacy = extractFiltersFromProducts(matching);
  assert.deepEqual(publicResponse.body, { ...legacy, priceRange: { min: 8000000, max: 18000000 } });
  assert.deepEqual(Object.keys(queries[0].select).sort(), ['brand', 'specifications', 'variants']);
  assert.deepEqual(Object.keys(queries[0].select.variants.select).sort(), ['attributes', 'colorCode', 'price', 'salePrice']);

  const token = jwt.sign({ id: 'staff', role: 'staff' }, secret);
  const adminResponse = await request('/admin/filters?category=phone&brand=Samsung', token);
  assert.equal(adminResponse.status, 200);
  assert.deepEqual(adminResponse.body, extractAdminFiltersFromProducts(matching));
  assert.deepEqual(Object.keys(queries[1].select.variants.select).sort(), ['attributes', 'price', 'salePrice']);
});

test('search keeps brand, category, price, sort, pagination, total and review contract', async t => {
  const { request, queries } = await setup(t);
  const result = await request('/search?brand=Samsung&category=phone&maxPrice=10000000&sort=price_asc&page=1&limit=1');
  assert.equal(result.status, 200);
  assert.equal(result.body.total, 1);
  assert.equal(result.body.totalPages, 1);
  assert.deepEqual(result.body.data.map((p: any) => p.id), ['cheap']);
  assert.equal(result.body.data[0].reviewCount, 2);
  assert.equal(result.body.data[0].ratingAverage, 4.5);
  assert.equal(result.body.data[0].variants[0].effectivePrice, 8000000);
  assert.ok(queries[0].where.AND.some((part: any) => part.variants?.some?.OR));
  assert.equal(queries[0].take, undefined); // JSON and price sorting still require full candidate evaluation.

  const secondPage = await request('/search?brand=Samsung&category=phone&maxPrice=20000000&sort=price_desc&page=2&limit=1');
  assert.equal(secondPage.status, 200);
  assert.equal(secondPage.body.total, 2);
  assert.equal(secondPage.body.totalPages, 2);
  assert.deepEqual(secondPage.body.data.map((p: any) => p.id), ['cheap']);
});

test('variant attributes and an empty price result retain the existing search response shape', async t => {
  const { request } = await setup(t);
  const selected = await request('/search?brand=Samsung&category=phone&color=%C4%90en&storage=256GB&maxPrice=10000000');
  assert.equal(selected.status, 200);
  assert.deepEqual(selected.body.data.map((p: any) => p.id), ['cheap']);
  assert.equal(selected.body.data[0].variants[0].stock, 2);
  const empty = await request('/search?brand=Samsung&category=phone&maxPrice=1000000');
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body, { data: [], total: 0, page: 1, limit: 12, totalPages: 0 });
});

test('list and detail aggregate APPROVED reviews only, with unchanged zero-review and rounding behavior', async t => {
  const { request } = await setup(t);
  const list = await request('/');
  assert.equal(list.status, 200);
  const legacySummary = (id: string) => {
    const ratings = reviews.filter(r => r.productId === id && r.status === 'APPROVED').map(r => r.rating);
    return { reviewCount: ratings.length, ratingAverage: ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0 };
  };
  for (const product of list.body) {
    assert.deepEqual({ reviewCount: product.reviewCount, ratingAverage: product.ratingAverage }, legacySummary(product.id));
  }
  const detail = await request('/cheap');
  assert.equal(detail.status, 200);
  assert.deepEqual({ reviewCount: detail.body.reviewCount, ratingAverage: detail.body.ratingAverage }, legacySummary('cheap'));
  const empty = await request('/apple');
  assert.equal(empty.status, 200);
  assert.deepEqual({ reviewCount: empty.body.reviewCount, ratingAverage: empty.body.ratingAverage }, legacySummary('apple'));
});
