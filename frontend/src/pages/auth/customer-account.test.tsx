import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InfoTab } from '../../components/profile/InfoTab';
import { deliveryContactFromProfile } from '../../components/profile/delivery-contact';
import { isEmail, normalizeEmail, normalizePhone, passwordError, validateRegistration } from './customer-account';

const valid = { fullName: '  Khách Kiểm Thử ', email: ' Fixture@Example.test ', phone: '+84 912 345 678', password: 'ExamplePass123', confirmPassword: 'ExamplePass123' };
test('registration sends exactly four normalized fields; confirmation never enters payload', () => {
  const r = validateRegistration(valid, true);
  assert.deepEqual(r.errors, {});
  assert.deepEqual(r.payload, { fullName: 'Khách Kiểm Thử', email: 'fixture@example.test', phone: '0912345678', password: valid.password });
});
for (const field of ['fullName', 'email', 'phone', 'password', 'confirmPassword'] as const) {
  test(`missing ${field} blocks registration with its own error`, () => assert.ok(validateRegistration({ ...valid, [field]: '' }, true).errors[field]));
}
test('invalid email/phone, weak/mismatched password and missing consent block submission', () => {
  const r = validateRegistration({ ...valid, fullName: '   ', email: 'bad', phone: '012', password: 'weak' }, false);
  for (const key of ['fullName', 'email', 'phone', 'password', 'confirmPassword', 'agreed']) assert.ok(r.errors[key]);
});
test('VN phone normalization supports national, +84 and 0084; rejects foreign/old invalid formats', () => {
  for (const p of ['0912345678', '+84 912 345 678', '0084912345678', '(091) 234-5678']) assert.equal(normalizePhone(p), '0912345678');
  for (const p of ['', '+1912345678', '01234567890', 'abcdefghij', '09123456789']) assert.equal(normalizePhone(p), null);
});
test('customer email validation rejects usernames and phone numbers', () => {
  assert.ok(isEmail(normalizeEmail(valid.email)));
  assert.equal(isEmail('legacy-name'), false); assert.equal(isEmail('0912345678'), false);
});
test('password policy matches registration/reset: 8+, upper/lower/digit and bcrypt byte limit', () => {
  assert.equal(passwordError('Abcdefg1'), null);
  for (const p of ['abcdefg1', 'ABCDEFG1', 'Abcdefgh', 'Abcd12', 'A1' + 'é'.repeat(36)]) assert.ok(passwordError(p));
});
test('profile renders three read-only database fields with no save action or fake date/gender', () => {
  const html = renderToStaticMarkup(createElement(InfoTab, { initialFullName: 'Tên Thật', initialEmail: 'fixture@example.test', initialPhone: '0912345678' }));
  assert.equal((html.match(/readOnly=""/gi) || []).length, 3);
  for (const value of ['Tên Thật', 'fixture@example.test', '0912345678']) assert.ok(html.includes(value));
  assert.ok(html.includes('Thông tin đăng ký không thể chỉnh sửa'));
  assert.doesNotMatch(html, /<button|Lưu Thay|1990|password|type="date"/i);
});
test('legacy missing identity renders an explicit missing-information state', () => {
  const html = renderToStaticMarkup(createElement(InfoTab, { initialFullName: '', initialEmail: 'legacy@example.test', initialPhone: '' }));
  assert.equal((html.match(/Chưa có thông tin/g) || []).length, 2);
  assert.ok(html.includes('bổ sung có xác minh'));
});
test('checkout uses independent delivery contact without overwriting account identity', () => {
  const profile = { fullName: 'Tên đăng ký', phone: '0912345678', address: JSON.stringify({ recipientName: 'Người nhận khác', recipientPhone: '0987654321' }) };
  assert.deepEqual(deliveryContactFromProfile(profile), { fullName: 'Người nhận khác', phone: '0987654321' });
  assert.equal(profile.fullName, 'Tên đăng ký'); assert.equal(profile.phone, '0912345678');
});
test('legacy and malformed addresses fall back to real registration contact without fabricated values', () => {
  for (const address of ['', 'Old street address', 'null', '[]', '{']) {
    assert.deepEqual(deliveryContactFromProfile({ address, fullName: 'Tên thật', phone: '0912345678' }), { fullName: 'Tên thật', phone: '0912345678' });
  }
  assert.deepEqual(deliveryContactFromProfile({}), { fullName: '', phone: '' });
});
