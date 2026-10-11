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
