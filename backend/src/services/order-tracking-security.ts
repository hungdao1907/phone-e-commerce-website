import crypto from 'crypto';

function configuredMilliseconds(name: string, fallback: number): number {
  if (process.env.NODE_ENV !== 'test') return fallback;
  const configured = Number(process.env[name]);
  return Number.isFinite(configured) && configured > 0 ? configured : fallback;
}

function configuredLimit(name: string, fallback: number): number {
  if (process.env.NODE_ENV !== 'test') return fallback;
  const configured = Number(process.env[name]);
  return Number.isInteger(configured) && configured > 0 ? configured : fallback;
}

export const TRACKING_OTP_TTL_MS = configuredMilliseconds('TRACKING_OTP_TTL_MS', 5 * 60 * 1000);
export const TRACKING_PROOF_TTL_MS = configuredMilliseconds('TRACKING_PROOF_TTL_MS', 10 * 60 * 1000);
export const TRACKING_RESEND_COOLDOWN_MS = configuredMilliseconds('TRACKING_RESEND_COOLDOWN_MS', 60 * 1000);
export const TRACKING_REQUEST_WINDOW_MS = configuredMilliseconds('TRACKING_REQUEST_WINDOW_MS', 10 * 60 * 1000);
export const TRACKING_REQUEST_LIMIT = configuredLimit('TRACKING_REQUEST_LIMIT', 10);
export const TRACKING_VERIFY_WINDOW_MS = configuredMilliseconds('TRACKING_VERIFY_WINDOW_MS', 10 * 60 * 1000);
export const TRACKING_VERIFY_LIMIT = configuredLimit('TRACKING_VERIFY_LIMIT', 12);
export const TRACKING_MAX_ATTEMPTS = 5;

export const GENERIC_TRACKING_REQUEST_MESSAGE =
  'Nếu thông tin đơn hàng khớp, mã xác thực đã được gửi tới email liên hệ của đơn hàng.';
export const GENERIC_TRACKING_VERIFY_FAILURE_MESSAGE =
  'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.';
export const GENERIC_TRACKING_RATE_LIMIT_MESSAGE =
  'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.';

type ContactType = 'email' | 'phone';

export interface NormalizedTrackingContact {
  type: ContactType;
  value: string;
}

interface TrackingChallengeRecord {
  challengeId: string;
  orderId: string;
  lookupFingerprint: string;
  otpSalt: Buffer;
  otpHash: Buffer;
  expiresAt: number;
  createdAt: number;
  attemptCount: number;
  maxAttempts: number;
}

interface TrackingProofRecord {
  orderId: string;
  expiresAt: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface ResendCooldownRecord {
  challengeId: string;
  expiresAt: number;
}

const challengeStore = new Map<string, TrackingChallengeRecord>();
const proofStore = new Map<string, TrackingProofRecord>();
const requestIpRateLimitStore = new Map<string, RateLimitRecord>();
const requestFingerprintRateLimitStore = new Map<string, RateLimitRecord>();
const verifyRateLimitStore = new Map<string, RateLimitRecord>();
const resendCooldownStore = new Map<string, ResendCooldownRecord>();

function cleanupExpiredEntries(now = Date.now()): void {
  for (const [key, record] of challengeStore) {
    if (record.expiresAt <= now) challengeStore.delete(key);
  }

  for (const [key, record] of proofStore) {
    if (record.expiresAt <= now) proofStore.delete(key);
  }

  for (const [key, record] of resendCooldownStore) {
    if (record.expiresAt <= now) resendCooldownStore.delete(key);
  }

  for (const store of [
    requestIpRateLimitStore,
    requestFingerprintRateLimitStore,
    verifyRateLimitStore,
  ]) {
    for (const [key, record] of store) {
      if (record.resetAt <= now) store.delete(key);
    }
  }
}

function consumeRateLimit(
  store: Map<string, RateLimitRecord>,
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function normalizePhone(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, '');

  if (/^\+84\d{9}$/.test(compact)) return `0${compact.slice(3)}`;
  if (/^84\d{9}$/.test(compact)) return `0${compact.slice(2)}`;
  if (/^0\d{9}$/.test(compact)) return compact;

  return null;
}

export function normalizeTrackingContact(value: unknown): NormalizedTrackingContact | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return { type: 'email', value: email };
  }

  const phone = normalizePhone(trimmed);
  return phone ? { type: 'phone', value: phone } : null;
}

export function normalizeTrackingOrderCode(value: unknown): string[] {
  if (typeof value !== 'string') return [];

  const raw = value.trim().toUpperCase();
  if (!raw) return [];

  const clean = raw.replace(/^#/, '').replace(/[\s-]/g, '');
  const withoutPrefix = clean.replace(/^DH/, '');
  const candidates = [raw, clean, withoutPrefix, `DH${withoutPrefix}`];
  return [...new Set(candidates.filter(Boolean))];
}

function canonicalOrderCode(value: string): string {
  const clean = value.trim().toUpperCase().replace(/^#/, '').replace(/[\s-]/g, '');
  return clean.startsWith('DH') ? clean : `DH${clean}`;
}

export function createTrackingLookupFingerprint(
  orderCode: string,
  contact: NormalizedTrackingContact,
): string {
  return crypto
    .createHash('sha256')
    .update(`order:${canonicalOrderCode(orderCode)}|${contact.type}:${contact.value}`)
    .digest('hex');
}

export function generateTrackingOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function beginTrackingChallenge(
  orderId: string,
  lookupFingerprint: string,
  otp: string,
  now = Date.now(),
): { challengeId: string; shouldSend: boolean } {
  cleanupExpiredEntries(now);

  const cooldown = resendCooldownStore.get(lookupFingerprint);
  if (cooldown && cooldown.expiresAt > now && challengeStore.has(cooldown.challengeId)) {
    return { challengeId: cooldown.challengeId, shouldSend: false };
  }

  const challengeId = crypto.randomUUID();
  const otpSalt = crypto.randomBytes(16);
  const otpHash = crypto.scryptSync(otp, otpSalt, 32);
  const expiresAt = now + TRACKING_OTP_TTL_MS;

  challengeStore.set(challengeId, {
    challengeId,
    orderId,
    lookupFingerprint,
    otpSalt,
    otpHash,
    expiresAt,
    createdAt: now,
    attemptCount: 0,
    maxAttempts: TRACKING_MAX_ATTEMPTS,
  });
  resendCooldownStore.set(lookupFingerprint, {
    challengeId,
    expiresAt: now + TRACKING_RESEND_COOLDOWN_MS,
  });

  return { challengeId, shouldSend: true };
}

export function allowTrackingRequest(ip: string, lookupFingerprint: string): boolean {
  cleanupExpiredEntries();
  return consumeRateLimit(
    requestIpRateLimitStore,
    ip,
    TRACKING_REQUEST_LIMIT,
    TRACKING_REQUEST_WINDOW_MS,
  ) && consumeRateLimit(
    requestFingerprintRateLimitStore,
    lookupFingerprint,
    TRACKING_REQUEST_LIMIT,
    TRACKING_REQUEST_WINDOW_MS,
  );
}

export type TrackingVerificationResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'exhausted' | 'rate_limited' };

export function verifyTrackingChallenge(
  challengeId: string,
  otp: string,
  ip: string,
  now = Date.now(),
): TrackingVerificationResult {
  cleanupExpiredEntries(now);

  const rateKey = `${ip}:${challengeId}`;
  if (!consumeRateLimit(
    verifyRateLimitStore,
    rateKey,
    TRACKING_VERIFY_LIMIT,
    TRACKING_VERIFY_WINDOW_MS,
    now,
  )) {
    return { ok: false, reason: 'rate_limited' };
  }

  const record = challengeStore.get(challengeId);
  if (!record) return { ok: false, reason: 'invalid' };

  if (record.expiresAt <= now) {
    challengeStore.delete(challengeId);
    return { ok: false, reason: 'expired' };
  }

  if (record.attemptCount >= record.maxAttempts) {
    challengeStore.delete(challengeId);
    return { ok: false, reason: 'exhausted' };
  }

  const suppliedHash = crypto.scryptSync(otp, record.otpSalt, 32);
  const matches = suppliedHash.length === record.otpHash.length
    && crypto.timingSafeEqual(suppliedHash, record.otpHash);

  if (!matches) {
    record.attemptCount += 1;
    if (record.attemptCount >= record.maxAttempts) {
      challengeStore.delete(challengeId);
      resendCooldownStore.delete(record.lookupFingerprint);
      return { ok: false, reason: 'exhausted' };
    }
    return { ok: false, reason: 'invalid' };
  }

  // Delete before returning so concurrent verification requests cannot replay it.
  challengeStore.delete(challengeId);
  resendCooldownStore.delete(record.lookupFingerprint);
  return { ok: true, orderId: record.orderId };
}

export function issueTrackingProof(orderId: string, now = Date.now()): {
  token: string;
  expiresIn: number;
} {
  cleanupExpiredEntries(now);

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = now + TRACKING_PROOF_TTL_MS;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  proofStore.set(tokenHash, { orderId, expiresAt });

  return {
    token,
    expiresIn: Math.floor(TRACKING_PROOF_TTL_MS / 1000),
  };
}

export function resolveTrackingProof(token: unknown, now = Date.now()): string | null {
  cleanupExpiredEntries(now);
  if (typeof token !== 'string' || !token) return null;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = proofStore.get(tokenHash);
  if (!record || record.expiresAt <= now) {
    proofStore.delete(tokenHash);
    return null;
  }

  return record.orderId;
}

export function trackingSecuritySnapshot(): {
  challengeCount: number;
  proofCount: number;
  challengeRecordsContainPlaintextOtp: boolean;
  challengeRecordsContainOtpHash: boolean;
} {
  cleanupExpiredEntries();
  const records = [...challengeStore.values()] as Array<TrackingChallengeRecord & { otp?: unknown }>;
  return {
    challengeCount: challengeStore.size,
    proofCount: proofStore.size,
    challengeRecordsContainPlaintextOtp: records.some(record => Object.prototype.hasOwnProperty.call(record, 'otp')),
    challengeRecordsContainOtpHash: records.every(record => Buffer.isBuffer(record.otpHash)),
  };
}
