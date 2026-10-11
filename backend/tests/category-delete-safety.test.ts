import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CategoryDeletionError,
  categoryDeleteDatabaseStatus,
  deleteCategorySafely,
} from '../src/services/category-deletion.service';

function fixture(references = { products: 0, children: 0, attributes: 0 }, categoryExists = true) {
  const calls: string[] = [];
  let deleted = false;
  let isolation: string | undefined;
  const database = {
    $transaction: async (work: (transaction: any) => Promise<unknown>, options: any) => {
      isolation = options?.isolationLevel;
      const before = deleted;
      try {
        const result = await work({
          $queryRaw: async (parts: TemplateStringsArray, ...values: unknown[]) => {
            calls.push('lock');
            assert.match(parts.join('?'), /FOR UPDATE/i);
            assert.deepEqual(values, ['category-1']);
            return categoryExists ? [{ id: 'category-1' }] : [];
          },
          product: { count: async () => { calls.push('products'); return references.products; } },
          category: {
            count: async () => { calls.push('children'); return references.children; },
            delete: async () => { calls.push('delete'); deleted = true; },
          },
          categoryAttribute: { count: async () => { calls.push('attributes'); return references.attributes; } },
        });
        return result;
      } catch (error) {
        deleted = before;
        throw error;
      }
    },
  };
  return { database, calls, get deleted() { return deleted; }, get isolation() { return isolation; } };
}

test('deletes an unreferenced category only after a ReadCommitted row lock', async () => {
  const state = fixture();
  await deleteCategorySafely(state.database, 'category-1');
  assert.equal(state.deleted, true);
  assert.equal(state.isolation, 'ReadCommitted');
  assert.deepEqual(state.calls, ['lock', 'products', 'children', 'attributes', 'delete']);
});

for (const [label, references] of [
  ['Product', { products: 1, children: 0, attributes: 0 }],
  ['child category', { products: 0, children: 1, attributes: 0 }],
  ['CategoryAttribute', { products: 0, children: 0, attributes: 1 }],
] as const) {
  test(`returns 409 and preserves the category when a ${label} references it`, async () => {
    const state = fixture(references);
    await assert.rejects(
      deleteCategorySafely(state.database, 'category-1'),
      (error: unknown) => error instanceof CategoryDeletionError && error.httpStatus === 409,
    );
    assert.equal(state.deleted, false);
    assert.equal(state.calls.includes('delete'), false);
  });
}

test('returns 404 without checking references when the category does not exist', async () => {
  const state = fixture({ products: 0, children: 0, attributes: 0 }, false);
  await assert.rejects(
    deleteCategorySafely(state.database, 'category-1'),
    (error: unknown) => error instanceof CategoryDeletionError && error.httpStatus === 404,
  );
  assert.deepEqual(state.calls, ['lock']);
  assert.equal(state.deleted, false);
});

test('maps database FK and serialization races to 409 and missing rows to 404', () => {
  assert.equal(categoryDeleteDatabaseStatus({ code: 'P2003' }), 409);
  assert.equal(categoryDeleteDatabaseStatus({ code: 'P2034' }), 409);
  assert.equal(categoryDeleteDatabaseStatus({ code: 'P2025' }), 404);
  assert.equal(categoryDeleteDatabaseStatus({ code: 'P2002' }), null);
  assert.equal(categoryDeleteDatabaseStatus(new Error('other failure')), null);
});
