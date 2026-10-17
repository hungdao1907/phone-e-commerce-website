import assert from 'node:assert/strict';
import test from 'node:test';
import { applyPrismaRuntimeUrl, resolvePrismaRuntimeUrl } from '../src/config/prisma-runtime-url';

test('persistent backend prefers explicit runtime URL, then transaction pooler DATABASE_URL', () => {
  assert.equal(resolvePrismaRuntimeUrl({
    PRISMA_RUNTIME_URL: ' postgres://runtime ',
    DIRECT_URL: 'postgres://session',
    DATABASE_URL: 'postgres://transaction',
  }), 'postgres://runtime');
  assert.equal(resolvePrismaRuntimeUrl({
    DIRECT_URL: ' postgres://session ',
    DATABASE_URL: 'postgres://transaction',
  }), 'postgres://transaction');
});

test('Prisma runtime URL falls back to DIRECT_URL and handles missing values', () => {
  assert.equal(resolvePrismaRuntimeUrl({ DIRECT_URL: ' postgres://session ' }), 'postgres://session');
  assert.equal(resolvePrismaRuntimeUrl({}), undefined);
});

test('bootstrap applies the selected runtime URL to all PrismaClient instances without changing other env values', () => {
  const environment = {
    PRISMA_RUNTIME_URL: undefined,
    DIRECT_URL: 'postgres://session',
    DATABASE_URL: 'postgres://transaction',
    KEEP_ME: 'unchanged',
  };
  assert.equal(applyPrismaRuntimeUrl(environment), 'postgres://transaction');
  assert.equal(environment.DATABASE_URL, 'postgres://transaction');
  assert.equal(environment.KEEP_ME, 'unchanged');
});
