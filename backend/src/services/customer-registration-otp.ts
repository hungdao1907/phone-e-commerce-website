import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const CUSTOMER_REGISTRATION_OTP_TTL_MS = 5 * 60 * 1000;
export const CUSTOMER_REGISTRATION_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const CUSTOMER_REGISTRATION_OTP_MAX_ATTEMPTS = 5;

const CHALLENGE_VERSION = 'v1';

type RegistrationOtpChallenge = {
  salt: string;
  digest: string;
  attempts: number;
};

export type CustomerRegistrationOtpCasUpdate = {
  otp?: string | null;
  otpExpiry?: Date | null;
  verified?: boolean;
};

export type CustomerRegistrationOtpVerificationResult = 'verified' | 'incorrect' | 'locked' | 'stale';
export type CustomerRegistrationOtpIssueResult = 'issued' | 'rate_limited' | 'stale';

export function generateCustomerRegistrationOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function challengeDigest(otp: string, salt: string, secret: string): Buffer {
  return createHmac('sha256', secret)
    .update(`customer-registration-otp:${CHALLENGE_VERSION}:${salt}:${otp}`)
    .digest();
}

export function hashCustomerRegistrationOtp(otp: string, secret: string): string {
  if (!/^\d{6}$/.test(otp)) throw new Error('Registration OTP must contain six digits.');
  if (!secret) throw new Error('Registration OTP signing secret is required.');

  const salt = randomBytes(16).toString('base64url');
  const digest = challengeDigest(otp, salt, secret).toString('base64url');
  return `${CHALLENGE_VERSION}.${salt}.${digest}.0`;
}

export function parseCustomerRegistrationOtpChallenge(value: string | null | undefined): RegistrationOtpChallenge | null {
  if (typeof value !== 'string') return null;
  const [version, salt, digest, attemptsText, ...extra] = value.split('.');
  if (version !== CHALLENGE_VERSION || extra.length > 0) return null;
  if (!/^[A-Za-z0-9_-]{20,24}$/.test(salt || '') || !/^[A-Za-z0-9_-]{43}$/.test(digest || '')) return null;
  if (!/^(0|[1-5])$/.test(attemptsText || '')) return null;
  if (Buffer.from(digest, 'base64url').length !== 32) return null;

  return { salt, digest, attempts: Number(attemptsText) };
}

export function matchesCustomerRegistrationOtp(value: string | null | undefined, candidate: string, secret: string): boolean {
  const challenge = parseCustomerRegistrationOtpChallenge(value);
  if (!challenge || !secret) return false;

  const hasValidFormat = /^\d{6}$/.test(candidate);
  const candidateForComparison = hasValidFormat ? candidate : '000000';
  const expected = Buffer.from(challenge.digest, 'base64url');
  const actual = challengeDigest(candidateForComparison, challenge.salt, secret);
  return timingSafeEqual(expected, actual) && hasValidFormat;
}

export function customerRegistrationOtpAttemptCount(value: string | null | undefined): number | null {
  return parseCustomerRegistrationOtpChallenge(value)?.attempts ?? null;
}

export function incrementCustomerRegistrationOtpAttempts(value: string | null | undefined): string | null {
  const challenge = parseCustomerRegistrationOtpChallenge(value);
  if (!challenge || challenge.attempts >= CUSTOMER_REGISTRATION_OTP_MAX_ATTEMPTS) return null;
  return `${CHALLENGE_VERSION}.${challenge.salt}.${challenge.digest}.${challenge.attempts + 1}`;
}

export async function verifyCustomerRegistrationOtpAttempt(
  storedChallenge: string | null | undefined,
  candidate: string,
  secret: string,
  compareAndSet: (expectedChallenge: string, update: CustomerRegistrationOtpCasUpdate) => Promise<boolean>,
): Promise<CustomerRegistrationOtpVerificationResult> {
  const attempts = customerRegistrationOtpAttemptCount(storedChallenge);
  if (typeof storedChallenge !== 'string' || attempts === null) return 'stale';
  if (attempts >= CUSTOMER_REGISTRATION_OTP_MAX_ATTEMPTS) return 'locked';

  if (!matchesCustomerRegistrationOtp(storedChallenge, candidate, secret)) {
    const nextChallenge = incrementCustomerRegistrationOtpAttempts(storedChallenge);
    if (!nextChallenge) return 'locked';
    const updated = await compareAndSet(storedChallenge, { otp: nextChallenge });
    if (!updated) return 'stale';
    return attempts + 1 >= CUSTOMER_REGISTRATION_OTP_MAX_ATTEMPTS ? 'locked' : 'incorrect';
  }

  const consumed = await compareAndSet(storedChallenge, { verified: true, otp: null, otpExpiry: null });
  return consumed ? 'verified' : 'stale';
}

export function isCustomerRegistrationOtpExpired(expiry: Date | null | undefined, now = new Date()): boolean {
  return !(expiry instanceof Date) || !Number.isFinite(expiry.getTime()) || expiry.getTime() <= now.getTime();
}

export function isCustomerRegistrationOtpResendCoolingDown(expiry: Date | null | undefined, now = new Date()): boolean {
  if (!(expiry instanceof Date) || !Number.isFinite(expiry.getTime())) return false;
  const lastIssuedAt = expiry.getTime() - CUSTOMER_REGISTRATION_OTP_TTL_MS;
  return now.getTime() - lastIssuedAt < CUSTOMER_REGISTRATION_OTP_RESEND_COOLDOWN_MS;
}

export async function issueCustomerRegistrationOtpChallenge(
  currentChallenge: string | null,
  currentExpiry: Date | null,
  nextChallenge: string,
  nextExpiry: Date,
  now: Date,
  compareAndSet: (expectedChallenge: string | null, update: CustomerRegistrationOtpCasUpdate) => Promise<boolean>,
): Promise<CustomerRegistrationOtpIssueResult> {
  if (isCustomerRegistrationOtpResendCoolingDown(currentExpiry, now)) return 'rate_limited';
  const updated = await compareAndSet(currentChallenge, { otp: nextChallenge, otpExpiry: nextExpiry });
  return updated ? 'issued' : 'stale';
}
