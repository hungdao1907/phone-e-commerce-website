import assert from 'node:assert/strict';
import test from 'node:test';
import { reservePromoUsage } from '../src/services/promo-usage.service';

const now = new Date('2026-10-10T12:00:00.000Z');

function database(promo: any) {
  const state = { ...promo };
  return {
    state,
    promoCode: {
      async findUnique() { return { ...state }; },
      async updateMany({ where, data }: any) {
        if (state.id !== where.id || state.isActive !== where.isActive
          || state.usageLimit !== where.usageLimit || state.startDate > where.startDate.lte
          || state.endDate < where.endDate.gte
          || (where.usedCount?.lt !== undefined && state.usedCount >= where.usedCount.lt)) return { count: 0 };
        state.usedCount += data.usedCount.increment;
        return { count: 1 };
      },
    },
  };
}

test('concurrent finite-limit promo reservations cannot exceed the cap', async () => {
  const db = database({
    id: 'promo-1', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'),
    usageLimit: 1, usedCount: 0,
  });
  const results = await Promise.all([
    reservePromoUsage(db, 'promo-1', now),
    reservePromoUsage(db, 'promo-1', now),
  ]);
  assert.deepEqual(results.sort(), [false, true]);
  assert.equal(db.state.usedCount, 1);
});

test('usageLimit zero remains unlimited under concurrent reservations', async () => {
  const db = database({
    id: 'promo-unlimited', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'),
    usageLimit: 0, usedCount: 0,
  });
  const results = await Promise.all([
    reservePromoUsage(db, 'promo-unlimited', now),
    reservePromoUsage(db, 'promo-unlimited', now),
  ]);
  assert.deepEqual(results, [true, true]);
  assert.equal(db.state.usedCount, 2);
});

test('promo reservation fails closed for inactive, not-yet-started, expired, or exhausted codes', async () => {
  for (const override of [
    { isActive: false },
    { startDate: new Date('2026-10-11T00:00:00.000Z') },
    { endDate: new Date('2026-10-09T00:00:00.000Z') },
    { usageLimit: 2, usedCount: 2 },
  ]) {
    const db = database({
      id: 'promo-invalid', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'),
      usageLimit: 0, usedCount: 0, ...override,
    });
    assert.equal(await reservePromoUsage(db, 'promo-invalid', now), false);
  }
});
