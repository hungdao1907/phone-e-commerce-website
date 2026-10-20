import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { navSearchQuery } from '../components/layout/nav-search-query';
import { productFilterQuery } from './product-filter-query';
import { createLatestRequest } from './latest-request';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}
async function until(check: () => boolean) {
  for (let i = 0; i < 100; i++) {
    if (check()) return;
    await new Promise(r => setTimeout(r, 1));
  }
  assert.fail('Query did not reach the expected state');
}

test('F1: closed search sends zero requests; rapid reopen shares in-flight request and fresh cache', async t => {
  const original = globalThis.fetch;
  const client = new QueryClient();
  const pending = deferred<Response>();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return pending.promise; };
  const options = (open: boolean) => navSearchQuery<{ id: string }>('https://catalog.example.test', open);
  const observer = new QueryObserver(client, options(false));
  const unsubscribe = observer.subscribe(() => {});
  t.after(() => { unsubscribe(); client.clear(); globalThis.fetch = original; });
  assert.equal(calls, 0);
  observer.setOptions(options(true));
  assert.equal(calls, 1);
  observer.setOptions(options(false));
  observer.setOptions(options(true));
  assert.equal(calls, 1);
  pending.resolve(new Response(JSON.stringify([{ id: 'real-catalog-id' }])));
  await until(() => observer.getCurrentResult().isSuccess);
  observer.setOptions(options(false));
  observer.setOptions(options(true));
  assert.equal(calls, 1);
  assert.equal(observer.getCurrentResult().data?.[0].id, 'real-catalog-id');
});

test('F1: expired catalog refetches on reopen; network failure can be explicitly retried', async t => {
  const original = globalThis.fetch;
  const client = new QueryClient();
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) throw new TypeError('Mock network failure');
    return new Response('[]');
  };
  const options = (open: boolean) => navSearchQuery('https://retry.example.test', open);
  const observer = new QueryObserver(client, options(true));
  const unsubscribe = observer.subscribe(() => {});
  t.after(() => { unsubscribe(); client.clear(); globalThis.fetch = original; });
  await until(() => observer.getCurrentResult().isError);
  assert.equal(calls, 1, 'no automatic retry loop');
  await observer.refetch();
  assert.equal(calls, 2);
  client.setQueryData(options(true).queryKey, [], { updatedAt: Date.now() - 31_000 });
  observer.setOptions(options(false));
  observer.setOptions(options(true));
  await until(() => calls === 3);
  await until(() => !observer.getCurrentResult().isFetching);
});

for (const body of ['{}', 'invalid-json']) {
  test(`F1: malformed catalog ${body} is an error, not an empty successful result`, async t => {
    const original = globalThis.fetch;
    const client = new QueryClient();
    globalThis.fetch = async () => new Response(body);
    t.after(() => { client.clear(); globalThis.fetch = original; });
    await assert.rejects(client.fetchQuery(navSearchQuery('https://invalid.example.test', true)));
  });
}

test('F1/F4: unmount aborts search catalog transport without a visible query error', async t => {
  const original = globalThis.fetch;
  const client = new QueryClient();
  let signal: AbortSignal | undefined;
  globalThis.fetch = (_url, init) => {
    signal = init?.signal as AbortSignal;
    return new Promise<Response>((_resolve, reject) => signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
  };
  t.after(() => { client.clear(); globalThis.fetch = original; });
  const observer = new QueryObserver(client, navSearchQuery('https://abort.example.test', true));
  const unsubscribe = observer.subscribe(() => {});
  unsubscribe();
  assert.equal(signal?.aborted, true);
  await new Promise(r => setTimeout(r, 0));
  assert.equal(client.getQueryState(observer.options.queryKey!)?.error, null);
});

test('F3: page/sort/limit and parameter order reuse filters; actual constraints stay separate', () => {
  const a = new URLSearchParams('brand=Samsung&category=phone&page=1&sort=newest&limit=8&ram=8GB');
  const b = new URLSearchParams('ram=8GB&limit=16&category=phone&sort=price_asc&page=2&brand=Samsung');
  assert.equal(productFilterQuery(a), productFilterQuery(b));
  for (const [key, value] of [['brand', 'ASUS'], ['category', 'laptop'], ['ram', '16GB'], ['q', 'Galaxy'], ['minPrice', '1000000']]) {
    const different = new URLSearchParams(b);
    different.set(key, value);
    assert.notEqual(productFilterQuery(a), productFilterQuery(different), key);
  }
});

test('F3: brand overrides and ignored series/q match each existing endpoint contract', () => {
  const params = new URLSearchParams('category=wrong&brand=wrong&q=abc&series=test&page=2&color=black');
  const query = productFilterQuery(params, { category: 'phone', brand: 'apple' }, ['page', 'limit', 'sort', 'series', 'q']);
  assert.deepEqual(Object.fromEntries(new URLSearchParams(query)), { brand: 'apple', category: 'phone', color: 'black' });
  assert.equal(params.get('brand'), 'wrong', 'does not mutate router state');
  assert.ok(productFilterQuery(params).includes('q=abc'), 'generic/laptop/tablet filters retain q');
});

test('F3: three pagination/sort transitions issue one filters request, while a real filter issues another', async () => {
  const client = new QueryClient();
  let calls = 0;
  const options = (search: string) => ({
    queryKey: ['productsFilters', 'api', productFilterQuery(new URLSearchParams(search))],
    queryFn: async () => { calls++; return { brands: ['Samsung'] }; },
    retry: false,
  });
  const observer = new QueryObserver(client, options('category=phone&page=1'));
  const unsubscribe = observer.subscribe(() => {});
  try {
    await until(() => observer.getCurrentResult().isSuccess);
    observer.setOptions(options('category=phone&page=2&sort=newest'));
    observer.setOptions(options('sort=price_asc&category=phone&page=3'));
    assert.equal(calls, 1);
    observer.setOptions(options('category=phone&brand=Samsung&page=1'));
    await until(() => calls === 2);
    await until(() => !observer.getCurrentResult().isFetching);
  } finally { unsubscribe(); client.clear(); }
});

test('F4: query-key navigation cancels old GET; a late old response cannot replace current results', async () => {
  const client = new QueryClient();
  const a = deferred<string[]>();
  let oldSignal: AbortSignal | undefined;
  const observer = new QueryObserver(client, {
    queryKey: ['search', 'A'],
    queryFn: ({ signal }) => { oldSignal = signal; return a.promise; },
    retry: false,
  });
  const unsubscribe = observer.subscribe(() => {});
  try {
    observer.setOptions({ queryKey: ['search', 'B'], queryFn: async () => ['B'], retry: false });
    assert.equal(oldSignal?.aborted, true);
    await until(() => observer.getCurrentResult().data?.[0] === 'B');
    a.resolve(['A']);
    await Promise.resolve();
    assert.deepEqual(observer.getCurrentResult().data, ['B']);
  } finally { unsubscribe(); client.clear(); }
});

test('F4: latest GET guard rejects out-of-order results even when transport ignores abort', async () => {
  const latest = createLatestRequest();
  const old = deferred<string>();
  let value = '';
  const first = latest.start();
  const pending = old.promise.then(data => { if (first.isCurrent()) value = data; });
  const second = latest.start();
  assert.equal(first.signal.aborted, true);
  if (second.isCurrent()) value = 'new';
  old.resolve('stale');
  await pending;
  assert.equal(value, 'new');
  latest.cancel();
  assert.equal(second.signal.aborted, true);
  assert.equal(second.isCurrent(), false);
  assert.equal(latest.start().isCurrent(), true, 'can load again after effect cleanup');
});

test('F1: HTTP failure exposes an error and a later explicit retry recovers', async t => {
  const original = globalThis.fetch;
  const client = new QueryClient();
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1 ? new Response('', { status: 503 }) : new Response('[]');
  t.after(() => { client.clear(); globalThis.fetch = original; });
  await assert.rejects(client.fetchQuery(navSearchQuery('https://http-error.example.test', true)), /Không thể tải/);
  assert.equal(calls, 1);
  assert.deepEqual(await client.fetchQuery(navSearchQuery('https://http-error.example.test', true)), []);
});

test('F4: independent address/admin request channels do not cancel each other; reset invalidates late data', () => {
  const districts = createLatestRequest();
  const wards = createLatestRequest();
  const firstDistrict = districts.start();
  const firstWard = wards.start();
  assert.ok(firstDistrict.isCurrent() && firstWard.isCurrent());
  const nextDistrict = districts.start();
  wards.cancel();
  assert.ok(!firstDistrict.isCurrent() && !firstWard.isCurrent() && nextDistrict.isCurrent());
  districts.cancel();
  wards.cancel();
  assert.ok(!nextDistrict.isCurrent());
});

test('F4 checkout wiring: each address level has one GET trigger and clearing a selection still invalidates it', () => {
  const source = readFileSync(new URL('../pages/checkout/CheckoutPage.tsx', import.meta.url), 'utf8');
  assert.equal((source.match(/\bfetchDistricts\(/g) || []).length, 1, 'city effect owns the request, not onChange too');
  assert.equal((source.match(/\bfetchWards\(/g) || []).length, 1, 'district effect owns the request, not onChange too');
  assert.match(source, /fetchDistricts\(deliveryInfo.cityCode \|\| ''\)/);
  assert.match(source, /fetchWards\(deliveryInfo.districtCode \|\| ''\)/);
});

test('local HTTP measurement: lazy search and normalized filters eliminate the expected GETs', async () => {
  let searchRequests = 0;
  let filterRequests = 0;
  const server = createServer((request, response) => {
    if (request.url?.startsWith('/api/products/filters')) filterRequests++;
    else searchRequests++;
    response.setHeader('Content-Type', 'application/json');
    response.end('[]');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const client = new QueryClient();
  const search = new QueryObserver(client, navSearchQuery(base, false));
  const unsubscribe = search.subscribe(() => {});
  try {
    await new Promise(r => setTimeout(r, 5));
    assert.equal(searchRequests, 0);
    search.setOptions(navSearchQuery(base, true));
    await until(() => search.getCurrentResult().isSuccess);
    search.setOptions(navSearchQuery(base, false));
    search.setOptions(navSearchQuery(base, true));
    assert.equal(searchRequests, 1);

    const transitions = ['category=phone&page=1', 'category=phone&page=2&sort=newest', 'category=phone&page=3&sort=price_asc'];
    async function replay(normalized: boolean) {
      const filterClient = new QueryClient();
      const options = (raw: string) => {
        const query = productFilterQuery(new URLSearchParams(raw));
        return {
          queryKey: ['measurement', normalized ? query : raw],
          queryFn: async ({ signal }: { signal: AbortSignal }) => {
            const response = await fetch(`${base}/api/products/filters?${query}`, { signal });
            return response.json();
          },
          retry: false,
        };
      };
      const observer = new QueryObserver(filterClient, options(transitions[0]));
      const stop = observer.subscribe(() => {});
      try {
        await until(() => observer.getCurrentResult().isSuccess);
        for (const raw of transitions.slice(1)) {
          observer.setOptions(options(raw));
          await until(() => !observer.getCurrentResult().isFetching);
        }
      } finally { stop(); filterClient.clear(); }
    }
    await replay(false);
    const before = filterRequests;
    assert.equal(before, 3);
    await replay(true);
    const after = filterRequests - before;
    assert.equal(after, 1);
    console.log(`LOCAL_FIXTURE_REQUESTS: closed_search=0; open_reopen_search=1; filters_before=${before}; filters_after=${after}`);
  } finally {
    unsubscribe();
    client.clear();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
