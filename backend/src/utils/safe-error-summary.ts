type ErrorMetadata = {
  name?: unknown;
  code?: unknown;
  errno?: unknown;
  syscall?: unknown;
  cause?: unknown;
};

function safeValue(value: unknown): string | undefined {
  return typeof value === 'string' && /^[A-Za-z0-9_.-]{1,64}$/.test(value)
    ? value
    : undefined;
}

function summarizeOne(error: unknown): Record<string, string> {
  if (!error || typeof error !== 'object') {
    return { name: typeof error === 'string' ? 'NonErrorString' : 'UnknownError' };
  }

  const metadata = error as ErrorMetadata;
  const name = safeValue(metadata.name) || 'UnknownError';
  const summary: Record<string, string> = { name };
  for (const key of ['code', 'errno', 'syscall'] as const) {
    const value = safeValue(metadata[key]);
    if (value) summary[key] = value;
  }
  return summary;
}

/** Logs only bounded error identifiers; never emits messages, URLs, credentials, or query data. */
export function safeErrorSummary(error: unknown): Record<string, unknown> {
  const summary = summarizeOne(error);
  const cause = error && typeof error === 'object' ? (error as ErrorMetadata).cause : undefined;
  return cause !== undefined && cause !== error
    ? { ...summary, cause: summarizeOne(cause) }
    : summary;
}

function safeNetworkMessage(message: unknown): string | undefined {
  if (typeof message !== 'string') return undefined;
  if (!message) return '';
  // Match known transport messages, never forward arbitrary suffixes containing
  // request bodies, credentials, URLs, addresses, headers or customer details.
  const lookup = /^(getaddrinfo|connect|read|write) (E[A-Z0-9_]+)(?:\s|$)/.exec(message);
  if (lookup) return `${lookup[1]} ${lookup[2]} [details redacted]`;
  for (const known of ['fetch failed', 'Connect Timeout Error', 'Headers Timeout Error', 'Body Timeout Error',
    'self-signed certificate in certificate chain', 'self-signed certificate',
    'unable to verify the first certificate', 'unable to get local issuer certificate',
    'certificate has expired', 'other side closed', 'socket hang up']) {
    if (message === known || message.startsWith(`${known} (`)) return known;
  }
  return '[non-standard message redacted]';
}

/** Transport diagnostics only; keeps cause code/name and a safe message template. */
export function safeFetchErrorSummary(error: unknown): Record<string, unknown> {
  const summary = safeErrorSummary(error);
  const metadata = error && typeof error === 'object' ? error as ErrorMetadata & { message?: unknown } : undefined;
  const message = safeNetworkMessage(metadata?.message);
  if (message !== undefined) summary.message = message;
  if (metadata?.cause && typeof metadata.cause === 'object' && metadata.cause !== error) {
    summary.cause = {
      ...summarizeOne(metadata.cause),
      message: safeNetworkMessage((metadata.cause as { message?: unknown }).message),
    };
  }
  return summary;
}
