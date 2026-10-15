import assert from 'node:assert/strict';
import test from 'node:test';
import { applyPrismaRuntimeUrl, resolvePrismaRuntimeUrl } from '../src/config/prisma-runtime-url';

test('persistent backend prefers explicit runtime URL, then the Supabase session/direct URL', () => {
  assert.equal(resolvePrismaRuntimeUrl({
    PRISMA_RUNTIME_URL: ' postgres://runtime ',
    DIRECT_URL: 'postgres://session',
    DATABASE_URL: 'postgres://transaction',
  }), 'postgres://runtime');
  assert.equal(resolvePrismaRuntimeUrl({
    DIRECT_URL: ' postgres://session ',
    DATABASE_URL: 'postgres://transaction',
  }), 'postgres://session');
});

test('Prisma runtime URL falls back to DATABASE_URL and handles missing values', () => {
  assert.equal(resolvePrismaRuntimeUrl({ DATABASE_URL: ' postgres://transaction ' }), 'postgres://transaction');
  assert.equal(resolvePrismaRuntimeUrl({}), undefined);
});

test('bootstrap applies the selected runtime URL to all PrismaClient instances without changing other env values', () => {
  const environment = {
    PRISMA_RUNTIME_URL: undefined,
    DIRECT_URL: 'postgres://session',
    DATABASE_URL: 'postgres://transaction',
    KEEP_ME: 'unchanged',
  };
  assert.equal(applyPrismaRuntimeUrl(environment), 'postgres://session');
  assert.equal(environment.DATABASE_URL, 'postgres://session');
  assert.equal(environment.KEEP_ME, 'unchanged');
});
