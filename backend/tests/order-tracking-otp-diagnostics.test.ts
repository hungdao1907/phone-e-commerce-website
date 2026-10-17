import assert from 'node:assert/strict';
import test from 'node:test';
import router from '../src/routes/order.routes';
import prisma from '../src/config/prisma';
import { mailer, isEmailConfigured } from '../src/services/mailer';
import { normalizeTrackingContact, normalizeTrackingOrderCode, trackingSecuritySnapshot } from '../src/services/order-tracking-security';
import { trackingEmailErrorCategory, trackingOtpDiagnostic } from '../src/utils/tracking-otp-diagnostics';

// Direct Express handler integration: Prisma lookup and email transport mocked.
// Never opens an HTTP server, queries PostgreSQL or sends a real email.
test('tracking OTP diagnosis: generic 202 covers lookup misses, cooldown, skipped mail and swallowed failures', async () => {
  const layer = (router as any).stack.find((entry: any) => entry.route?.path === '/track/request-otp');
  const handler = layer.route.stack[0].handle;
  const originalLookup = prisma.order.findFirst;
  const originalSend = mailer.sendMail;
  const originalError = console.error;
  const originalInfo = console.info;
  const originalNodeEnv = process.env.NODE_ENV;
  const names = ['SMTP_HOST', 'SMTP_EMAIL', 'SMTP_PASSWORD', 'BREVO_API_KEY', 'BREVO_SENDER_EMAIL'];
  const saved = Object.fromEntries(names.map(name => [name, process.env[name]]));
  let order: any = null, sent: any[] = [], errors: string[] = [], fail = false;
  const diagnostics: string[] = [];
  process.env.NODE_ENV = 'development';
  console.info = (...args: any[]) => { diagnostics.push(args.join(' ')); };
  (prisma.order as any).findFirst = async (args: any) => {
    assert.ok(args.where.OR.every((condition: any) => condition.orderCode.mode === 'insensitive'));
    return order;
  };
  mailer.sendMail = async (options: any) => {
    sent.push(options);
    if (fail) throw new Error('mock SMTP authentication rejected');
    return { accepted: [options.to] };
  };
  console.error = (...args: any[]) => { errors.push(args.join(' ')); };
  let index = 0;
  const request = async (code: string, contact: string, ip?: string) => {
    let status = 200, body: any;
    const res = { status(value: number) { status = value; return this; }, json(value: any) { body = value; return this; } };
    await handler({ body: { orderCode: code, contact }, ip: ip || `fixture-${++index}`, socket: {} }, res);
    return { status, body };
  };
  const fixture = (id: string) => ({ id, orderCode: `DH-${id}`, shippingPhone: '0912345678',
    customer: { email: 'Owner@Example.invalid', phone: null, fullName: 'Fixture' } });
  try {
    for (const name of names) delete process.env[name];
    process.env.SMTP_EMAIL = 'sender@example.invalid'; process.env.SMTP_PASSWORD = 'mock-only';
    const initial = trackingSecuritySnapshot().challengeCount;
    const missing = await request('DH-missing', 'owner@example.invalid');
    assert.equal(missing.status, 202); assert.ok(missing.body.challengeId); assert.equal(sent.length, 0);
    assert.equal(trackingSecuritySnapshot().challengeCount, initial);
    order = fixture('mismatch');
    const mismatch = await request(order.orderCode, 'other@example.invalid');
    assert.equal(mismatch.status, 202); assert.equal(sent.length, 0);
    assert.equal(trackingSecuritySnapshot().challengeCount, initial);
    order = fixture('no-email'); order.customer.email = '';
    const noEmail = await request(order.orderCode, '+84912345678');
    assert.equal(noEmail.status, 202); assert.equal(sent.length, 0);

    order = fixture('email-match');
    const matched = await request(order.orderCode, ' OWNER@example.invalid ');
    assert.equal(matched.status, 202); assert.equal(sent.length, 1);
    assert.equal(sent[0].to, order.customer.email); // stored email, not request input
    const replay = await request(order.orderCode, 'owner@example.invalid');
    assert.equal(replay.status, 202); assert.equal(replay.body.challengeId, matched.body.challengeId);
    assert.equal(sent.length, 1); // cooldown does not resend

    order = fixture('phone-match');
    assert.equal((await request(order.orderCode, '+84 912 345 678')).status, 202);
    assert.equal(sent.length, 2);
    order = fixture('smtp-failure'); fail = true;
    assert.equal((await request(order.orderCode, 'owner@example.invalid')).status, 202);
    assert.equal(sent.length, 3); assert.deepEqual(errors, ['Error sending tracking OTP email.']);
    fail = false;
    assert.equal((await request(order.orderCode, 'owner@example.invalid')).status, 202);
    assert.equal(sent.length, 3); // failed send still consumes resend cooldown

    delete process.env.SMTP_EMAIL; delete process.env.SMTP_PASSWORD;
    process.env.SMTP_HOST = 'smtp.fixture.invalid';
    assert.equal(isEmailConfigured(), true);
    order = fixture('smtp-host-only');
    assert.equal((await request(order.orderCode, 'owner@example.invalid')).status, 202);
    assert.equal(sent.length, 4); // custom SMTP remains available through the shared mailer

    delete process.env.SMTP_HOST;
    process.env.BREVO_API_KEY = 'mock-only'; process.env.BREVO_SENDER_EMAIL = 'sender@example.invalid';
    assert.equal(isEmailConfigured(), true);
    order = fixture('brevo-only');
    assert.equal((await request(order.orderCode, 'owner@example.invalid')).status, 202);
    assert.equal(sent.length, 5); // Brevo-only configuration is handled by the shared mailer
    delete process.env.BREVO_API_KEY; delete process.env.BREVO_SENDER_EMAIL;
    order = fixture('unconfigured');
    assert.equal((await request(order.orderCode, 'owner@example.invalid')).status, 202);
    assert.equal(sent.length, 5);
    assert.equal((await request('', '')).status, 400);
    order = null;
    for (let i = 0; i < 10; i++) assert.equal((await request('DH-limit', 'owner@example.invalid', 'rate-fixture')).status, 202);
    assert.equal((await request('DH-limit', 'owner@example.invalid', 'rate-fixture')).status, 429);
    assert.equal(trackingSecuritySnapshot().challengeRecordsContainPlaintextOtp, false);
    assert.ok(diagnostics.some(line => line.includes('cooldown')));
    assert.ok(diagnostics.some(line => line.includes('provider_error')));
    assert.ok(diagnostics.some(line => line.includes('skipped')));
    assert.ok(diagnostics.some(line => line.includes('accepted')));
    assert.ok(diagnostics.every(line => !/@|0912345678|smtp-failure|mock-only|DH-/.test(line)));
  } finally {
    (prisma.order as any).findFirst = originalLookup; mailer.sendMail = originalSend; console.error = originalError;
    console.info = originalInfo;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
    for (const name of names) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name]; }
  }
});

test('diagnostics classify mail errors without exposing payloads and are disabled in production', () => {
  assert.equal(trackingEmailErrorCategory({ code: 'EAUTH', message: 'sensitive fixture' }), 'auth_error');
  assert.equal(trackingEmailErrorCategory({ code: 'ETIMEDOUT' }), 'connection_error');
  assert.equal(trackingEmailErrorCategory(new Error('sensitive fixture')), 'provider_error');
  const previous = process.env.NODE_ENV, originalInfo = console.info;
  let calls = 0;
  console.info = () => { calls++; };
  try { process.env.NODE_ENV = 'production'; trackingOtpDiagnostic('request', 'received'); assert.equal(calls, 0); }
  finally { console.info = originalInfo; if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});

test('tracking normalization accepts case-insensitive email, VN phone formats and formatted order codes', () => {
  assert.deepEqual(normalizeTrackingContact(' Owner@Example.invalid '), normalizeTrackingContact('owner@example.invalid'));
  for (const phone of ['0912345678', '+84912345678', '84912345678', '+84 912 345 678']) {
    assert.deepEqual(normalizeTrackingContact(phone), { type: 'phone', value: '0912345678' });
  }
  assert.ok(normalizeTrackingOrderCode('#DH-ABC').includes('DHABC'));
  assert.ok(normalizeTrackingOrderCode('#DH-ABC').includes('ABC'));
});
