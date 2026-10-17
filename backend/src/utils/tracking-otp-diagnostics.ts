type TrackingStage = 'request' | 'rate_limit' | 'order_lookup' | 'contact_match' | 'recipient'
  | 'challenge' | 'email_config' | 'email_send';
type TrackingOutcome = 'received' | 'allowed' | 'blocked' | 'matched' | 'not_matched' | 'valid'
  | 'unavailable' | 'created' | 'cooldown' | 'skipped' | 'attempted' | 'accepted'
  | 'rejected' | 'completed' | 'auth_error' | 'connection_error' | 'provider_error';

// Fixed enum fields only: never accept request data, identifiers or error messages.
export function trackingOtpDiagnostic(stage: TrackingStage, outcome: TrackingOutcome): void {
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') return;
  console.info('[tracking-otp]', JSON.stringify({ stage, outcome }));
}

export function trackingEmailErrorCategory(error: unknown): 'auth_error' | 'connection_error' | 'provider_error' {
  const code = error && typeof error === 'object' ? (error as { code?: unknown }).code : undefined;
  if (code === 'EAUTH') return 'auth_error';
  if (['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'ECONNREFUSED', 'ENOTFOUND'].includes(String(code))) return 'connection_error';
  return 'provider_error';
}
