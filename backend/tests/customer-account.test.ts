import assert from 'node:assert/strict';
import test, { before } from 'node:test';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateCustomerRegistration } from '../src/services/customer-account-policy';
import { hashCustomerRegistrationOtp } from '../src/services/customer-registration-otp';

// No real database, email transport, customer data or production credentials are used.
const secret = 'customer-account-test-signing-secret-only';
let createAuthRouter: any;
let createCustomerRouter: any;
before(async () => {
  process.env.JWT_SECRET = secret;
  ({ createAuthRouter } = await import('../src/routes/auth.routes'));
  ({ createCustomerRouter } = await import('../src/routes/customer.routes'));
});
const valid = { fullName: '  Khách Kiểm Thử  ', email: '  Fixture@Example.test ', phone: '+84 912 345 678', password: 'ExamplePass123' };
const hashed = bcrypt.hashSync('ExamplePass123', 4);
function fixture(customer: any = null) {
  const state = { customer, mails: [] as any[], writes: 0, configured: true };
  const db: any = {
    customer: {
      findFirst: async ({ where }: any) => state.customer?.email.toLowerCase() === where.email.equals.toLowerCase() ? { ...state.customer } : null,
      findUnique: async ({ where }: any) => state.customer?.id === where.id ? { ...state.customer } : null,
      create: async ({ data }: any) => { state.writes++; state.customer = { id: 'fixture-customer', username: null, ...data }; return { ...state.customer }; },
      updateMany: async ({ where, data }: any) => {
        if (!state.customer || state.customer.id !== where.id || (where.verified !== undefined && where.verified !== state.customer.verified)
          || (where.otp !== undefined && where.otp !== state.customer.otp) || (where.password !== undefined && where.password !== state.customer.password)
          || (where.otpExpiry && !(state.customer.otpExpiry > where.otpExpiry.gt))) return { count: 0 };
        state.writes++; Object.assign(state.customer, data); return { count: 1 };
      },
      update: async ({ data }: any) => { state.writes++; Object.assign(state.customer, data); return state.customer; },
    },
    user: { findUnique: async ({ where }: any) => ['admin', 'staff', 'superadmin'].includes(where.username)
      ? { id: 'internal-fixture', username: where.username, role: where.username, password: hashed } : null },
  };
  return { state, db };
}
function existing(overrides = {}) {
  return { id: 'fixture-customer', username: 'legacy-name', email: 'Fixture@Example.test', password: hashed,
    fullName: 'Tên đã xác minh', phone: '0912345678', address: '', verified: true, otp: null, otpExpiry: null, ...overrides };
}
async function api(t: any, f: ReturnType<typeof fixture>, failMail = false) {
  const app = express(); app.use(express.json());
  app.use('/api/auth', createAuthRouter({ prisma: f.db, isEmailConfigured: () => f.state.configured,
    smtpTransporter: { sendMail: async (mail: any) => { if (failMail) throw new Error('Mock transport unavailable'); f.state.mails.push(mail); return {}; } } }));
  app.use('/api/customers', createCustomerRouter(f.db));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>((resolve, reject) => { server.close(e => e ? reject(e) : resolve()); server.closeAllConnections(); }));
  const address = server.address() as { port: number };
  return async (path: string, body?: any, token?: string) => {
    const r = await fetch(`http://127.0.0.1:${address.port}/api${path}`, {
      method: path === '/customers/profile' && body === undefined ? 'GET' : path === '/customers/profile' ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: r.status, body: await r.json() as any };
  };
}
const customerToken = () => jwt.sign({ id: 'fixture-customer', role: 'customer' }, secret, { expiresIn: '1h' });

test('registration normalizes and persists all contact fields; hashes password/OTP and remains unverified', async t => {
  const f = fixture(); const request = await api(t, f);
  const r = await request('/auth/customer/register', { ...valid, confirmPassword: 'not persisted', role: 'admin', username: 'ignored' });
  assert.equal(r.status, 200); assert.equal(f.state.customer.fullName, 'Khách Kiểm Thử');
  assert.equal(f.state.customer.email, 'fixture@example.test'); assert.equal(f.state.customer.phone, '0912345678');
  assert.equal(f.state.customer.verified, false); assert.equal(f.state.customer.username, null);
  assert.equal(f.state.customer.confirmPassword, undefined); assert.equal(f.state.customer.role, undefined);
  assert.ok(await bcrypt.compare(valid.password, f.state.customer.password));
  assert.match(f.state.customer.otp, /^v1\./); assert.equal(f.state.mails.length, 1);
  assert.equal((await request('/auth/customer/login', { email: valid.email, password: valid.password })).status, 403);
});
for (const field of ['fullName', 'email', 'phone', 'password']) test(`registration rejects missing ${field} before database writes/email`, async t => {
  const f = fixture(); const request = await api(t, f);
  const r = await request('/auth/customer/register', { ...valid, [field]: '' });
  assert.equal(r.status, 400); assert.ok(r.body.errors[field]); assert.equal(f.state.writes, 0); assert.equal(f.state.mails.length, 0);
});
for (const [field, value] of [['fullName', '   '], ['email', 'not-an-email'], ['phone', '012345'], ['password', 'weak']]) {
  test(`registration rejects invalid ${field}`, () => assert.ok(validateCustomerRegistration({ ...valid, [field]: value }).errors[field]));
}
test('verified legacy email duplicate (case insensitive) cannot overwrite identity/password', async t => {
  const f = fixture(existing()); const request = await api(t, f); const original = structuredClone(f.state.customer);
  assert.equal((await request('/auth/customer/register', valid)).status, 409);
  assert.deepEqual(f.state.customer, original); assert.equal(f.state.writes, 0);
});
test('pending registration can be retried after cooldown; keeps legacy username and unverified state', async t => {
  const f = fixture(existing({ verified: false })); const request = await api(t, f);
  assert.equal((await request('/auth/customer/register', valid)).status, 200);
  assert.equal(f.state.customer.phone, '0912345678'); assert.equal(f.state.customer.username, 'legacy-name');
  assert.equal(f.state.customer.verified, false);
  assert.equal((await request('/auth/customer/register', valid)).status, 429);
  assert.equal(f.state.mails.length, 1);
});
test('registration resend uses the registration purpose, cooldown and preserves password/contact fields', async t => {
  const f = fixture(existing({ verified: false })); const request = await api(t, f);
  const original = structuredClone(f.state.customer);
  assert.equal((await request('/auth/customer/resend-otp', { email: valid.email })).status, 200);
  for (const key of ['fullName', 'email', 'phone', 'password', 'username']) assert.equal(f.state.customer[key], original[key]);
  assert.equal(f.state.customer.verified, false); assert.equal(f.state.mails.length, 1);
  assert.equal((await request('/auth/customer/resend-otp', { email: valid.email })).status, 429);
});
test('mail delivery failure invalidates registration challenge and leaves account unverified', async t => {
  const f = fixture(); const request = await api(t, f, true);
  assert.equal((await request('/auth/customer/register', valid)).status, 503);
  assert.equal(f.state.customer.verified, false); assert.equal(f.state.customer.otp, null); assert.equal(f.state.customer.otpExpiry, null);
});
test('OTP locks after five wrong attempts and never verifies the account', async t => {
  const f = fixture(existing({ verified: false, otp: hashCustomerRegistrationOtp('123456', secret), otpExpiry: new Date(Date.now() + 300000) }));
  const request = await api(t, f);
  for (let i = 0; i < 5; i++) assert.equal((await request('/auth/customer/verify-otp', { email: valid.email, otp: '654321' })).status, i < 4 ? 400 : 429);
  assert.equal((await request('/auth/customer/verify-otp', { email: valid.email, otp: '123456' })).status, 429);
  assert.equal(f.state.customer.verified, false);
});
test('resend for a verified/missing account is a no-op and does not overwrite profile', async t => {
  const f = fixture(existing()); const original = structuredClone(f.state.customer); const request = await api(t, f);
  for (const email of [valid.email, 'absent@example.test']) assert.equal((await request('/auth/customer/resend-otp', { email })).status, 200);
  assert.deepEqual(f.state.customer, original); assert.equal(f.state.writes, 0); assert.equal(f.state.mails.length, 0);
});
test('registration challenge cannot verify a password reset; expired reset OTP cannot issue a token', async t => {
  const f = fixture(existing({ otp: hashCustomerRegistrationOtp('123456', secret), otpExpiry: new Date(Date.now() + 300000) }));
  const request = await api(t, f);
  assert.equal((await request('/auth/customer/verify-reset-otp', { email: valid.email, otp: '123456' })).status, 400);
  f.state.customer.otp = hashCustomerRegistrationOtp('123456', secret + ':password-reset');
  f.state.customer.otpExpiry = new Date(Date.now() - 1000);
  const r = await request('/auth/customer/verify-reset-otp', { email: valid.email, otp: '123456' });
  assert.equal(r.status, 400); assert.equal(r.body.resetToken, undefined);
});
for (const mode of ['correct', 'wrong', 'expired', 'replayed']) test(`OTP ${mode} uses actual protected challenge verification`, async t => {
  const f = fixture(existing({ verified: false, otp: hashCustomerRegistrationOtp('123456', secret),
    otpExpiry: new Date(Date.now() + (mode === 'expired' ? -1000 : 300000)) }));
  const request = await api(t, f);
  const r = await request('/auth/customer/verify-otp', { email: valid.email, otp: mode === 'wrong' ? '654321' : '123456' });
  assert.equal(r.status, mode === 'wrong' || mode === 'expired' ? 400 : 200);
  assert.equal(f.state.customer.verified, mode !== 'wrong' && mode !== 'expired');
  if (mode === 'replayed') { const writes = f.state.writes; assert.equal((await request('/auth/customer/verify-otp', { email: valid.email, otp: '123456' })).status, 200); assert.equal(f.state.writes, writes); }
});
test('customer email-only login supports old mixed-case email/null profile; response excludes password/OTP', async t => {
  const f = fixture(existing({ fullName: null, phone: null })); const request = await api(t, f);
  const r = await request('/auth/customer/login', { email: valid.email, password: valid.password });
  assert.equal(r.status, 200); assert.equal(r.body.user.role, 'customer'); assert.equal(r.body.user.fullName, null);
  for (const key of ['password', 'otp', 'otpExpiry']) assert.equal(key in r.body.user, false);
  assert.equal((jwt.verify(r.body.token, secret) as any).id, 'fixture-customer');
  assert.equal((await request('/auth/login', { username: valid.email, password: valid.password })).status, 200);
});
for (const identifier of ['legacy-name', '0912345678']) test(`customer username/phone rejected by dedicated and legacy login: ${identifier}`, async t => {
  const request = await api(t, fixture(existing()));
  assert.equal((await request('/auth/customer/login', { email: identifier, password: valid.password })).status, 400);
  assert.equal((await request('/auth/login', { username: identifier, password: valid.password })).status, 401);
});
test('wrong password and unknown customer return identical generic errors', async t => {
  const request = await api(t, fixture(existing()));
  const wrong = await request('/auth/customer/login', { email: valid.email, password: 'wrong' });
  const unknown = await request('/auth/customer/login', { email: 'absent@example.test', password: 'wrong' });
  assert.equal(wrong.status, 401); assert.deepEqual(wrong, unknown);
});
for (const role of ['admin', 'staff', 'superadmin']) test(`${role} username login preserves JWT role`, async t => {
  const request = await api(t, fixture()); const r = await request('/auth/login', { username: role, password: valid.password });
  assert.equal(r.status, 200); assert.equal(r.body.user.role, role); assert.equal(r.body.user.password, undefined);
  assert.equal((jwt.verify(r.body.token, secret) as any).role, role);
});
test('profile API uses database identity and excludes secrets on repeated/reloaded reads', async t => {
  const f = fixture(existing()); const request = await api(t, f);
  for (let i = 0; i < 2; i++) {
    const r = await request('/customers/profile', undefined, customerToken());
    assert.equal(r.status, 200); assert.equal(r.body.fullName, f.state.customer.fullName);
    assert.equal(r.body.email, 'Fixture@Example.test'); assert.equal(r.body.phone, '0912345678');
    for (const key of ['password', 'otp', 'otpExpiry']) assert.equal(key in r.body, false);
  }
});
for (const key of ['fullName', 'email', 'phone', 'username', 'password', 'role', 'verified', 'otp', 'unknown']) {
  test(`manual profile update cannot mass-assign ${key}`, async t => {
    const f = fixture(existing()); const request = await api(t, f);
    const original = structuredClone(f.state.customer);
    assert.equal((await request('/customers/profile', { address: 'new', [key]: 'forbidden' }, customerToken())).status, 400);
    assert.equal(f.state.writes, 0); assert.deepEqual(f.state.customer, original);
  });
}
test('address-only update can store independent recipient; account identity remains unchanged', async t => {
  const f = fixture(existing()); const request = await api(t, f);
  const address = JSON.stringify({ recipientName: 'Người nhận khác', recipientPhone: '0987654321', detailAddress: 'Fixture address' });
  const r = await request('/customers/profile', { address }, customerToken());
  assert.equal(r.status, 200); assert.equal(r.body.customer.address, address);
  assert.equal(r.body.customer.fullName, 'Tên đã xác minh'); assert.equal(r.body.customer.phone, '0912345678');
  assert.equal(r.body.customer.password, undefined);
});
test('profile requires a valid Customer JWT', async t => {
  const request = await api(t, fixture(existing()));
  assert.equal((await request('/customers/profile')).status, 401);
  assert.equal((await request('/customers/profile', undefined, jwt.sign({ id: 'a', role: 'admin' }, secret))).status, 403);
  assert.equal((await request('/customers/profile', undefined, jwt.sign({ id: 'c', role: 'customer' }, secret, { expiresIn: -1 }))).status, 401);
});
test('forgot/reset OTP is purpose-bound, cooldown-limited, and verified reset changes password once', async t => {
  const f = fixture(existing()); const request = await api(t, f);
  assert.equal((await request('/auth/customer/forgot-password', { email: valid.email })).status, 200);
  assert.equal((await request('/auth/customer/forgot-password', { email: valid.email })).status, 429);
  const code = f.state.mails[0].html.match(/>(\d{6})<\/span>/)?.[1]; assert.ok(code);
  const verified = await request('/auth/customer/verify-reset-otp', { email: valid.email, otp: code });
  assert.equal(verified.status, 200); assert.ok(verified.body.resetToken);
  assert.equal((await request('/auth/customer/verify-reset-otp', { email: valid.email, otp: code })).status, 400);
  assert.equal((await request('/auth/customer/reset-password', { email: valid.email, resetToken: verified.body.resetToken, newPassword: 'weak' })).status, 400);
  const payload = { email: valid.email, resetToken: verified.body.resetToken, newPassword: 'ChangedPass123' };
  assert.equal((await request('/auth/customer/reset-password', payload)).status, 200);
  assert.ok(await bcrypt.compare(payload.newPassword, f.state.customer.password));
  assert.equal((await request('/auth/customer/reset-password', payload)).status, 400);
});
