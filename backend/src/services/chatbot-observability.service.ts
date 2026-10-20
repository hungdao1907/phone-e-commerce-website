/**
 * Process-local, privacy-safe chatbot telemetry. It deliberately has no HTTP endpoint and
 * no database writes: counters reset when a Render instance restarts and cannot be treated
 * as a cluster-wide rate limiter or source of billing data.
 */
export type ChatbotTurnOutcome =
  | 'success'
  | 'replay'
  | 'busy'
  | 'client_disconnected'
  | 'timeout'
  | 'upstream_network_error'
  | 'upstream_http_error'
  | 'upstream_invalid_response'
  | 'storage_error'
  | 'stale_completion'
  | 'request_rejected'
  | 'unknown_error';

type CounterMap = Record<string, number>;

type ChatbotMetricSnapshot = {
  scope: 'backend_instance';
  inFlight: number;
  totals: CounterMap;
  outcomes: CounterMap;
  n8nWaitMs: { count: number; total: number; max: number };
  turnDurationMs: { count: number; total: number; max: number };
  catalogRehydrationAttempts: number;
  staleCompletions: number;
  leasesRetainedForExpiryRecovery: number;
  reclaimedExpiredLeases: number;
};

function increment(map: CounterMap, key: string) {
  map[key] = (map[key] || 0) + 1;
}

function addDuration(target: { count: number; total: number; max: number }, durationMs: number) {
  const safeDuration = Math.max(0, Math.round(durationMs));
  target.count += 1;
  target.total += safeDuration;
  target.max = Math.max(target.max, safeDuration);
  return safeDuration;
}

const metrics: ChatbotMetricSnapshot = {
  scope: 'backend_instance',
  inFlight: 0,
  totals: {},
  outcomes: {},
  n8nWaitMs: { count: 0, total: 0, max: 0 },
  turnDurationMs: { count: 0, total: 0, max: 0 },
  catalogRehydrationAttempts: 0,
  staleCompletions: 0,
  leasesRetainedForExpiryRecovery: 0,
  reclaimedExpiredLeases: 0,
};

export type ChatbotTurnObservation = {
  markN8nDispatch(): void;
  markN8nResponseComplete(): void;
  markCatalogRehydrationAttempt(): void;
  markReclaimedExpiredLease(): void;
  markLeaseRetainedForExpiryRecovery(): void;
  finish(outcome: ChatbotTurnOutcome): void;
};

/** Starts one HTTP-turn observation. `finish` is intentionally idempotent for early returns. */
export function beginChatbotTurnObservation(): ChatbotTurnObservation {
  const startedAt = performance.now();
  let n8nStartedAt: number | undefined;
  let n8nRecorded = false;
  let finished = false;
  metrics.inFlight += 1;
  increment(metrics.totals, 'requests');

  const maybeLog = (outcome: ChatbotTurnOutcome, durationMs: number) => {
    // Opt-in only. Do not add message text, session identifiers, URLs, headers, or credentials.
    if (process.env.CHATBOT_OBSERVABILITY_LOG !== 'true') return;
    console.info('[Chatbot Metrics]', {
      scope: metrics.scope,
      outcome,
      durationMs,
      n8nWaitMs: n8nStartedAt === undefined ? undefined : Math.max(0, Math.round(performance.now() - n8nStartedAt)),
      inFlight: metrics.inFlight,
    });
  };

  return {
    markN8nDispatch() {
      if (n8nStartedAt === undefined) n8nStartedAt = performance.now();
    },
    markN8nResponseComplete() {
      if (n8nStartedAt === undefined || n8nRecorded) return;
      addDuration(metrics.n8nWaitMs, performance.now() - n8nStartedAt);
      n8nRecorded = true;
    },
    markCatalogRehydrationAttempt() {
      metrics.catalogRehydrationAttempts += 1;
    },
    markReclaimedExpiredLease() {
      metrics.reclaimedExpiredLeases += 1;
    },
    markLeaseRetainedForExpiryRecovery() {
      metrics.leasesRetainedForExpiryRecovery += 1;
    },
    finish(outcome) {
      if (finished) return;
      finished = true;
      if (!n8nRecorded && n8nStartedAt !== undefined) addDuration(metrics.n8nWaitMs, performance.now() - n8nStartedAt);
      metrics.inFlight = Math.max(0, metrics.inFlight - 1);
      if (outcome === 'stale_completion') metrics.staleCompletions += 1;
      increment(metrics.outcomes, outcome);
      const durationMs = addDuration(metrics.turnDurationMs, performance.now() - startedAt);
      maybeLog(outcome, durationMs);
    },
  };
}

/** Snapshot is for a future protected internal metrics integration and local tests only. */
export function chatbotInstanceMetricsSnapshot(): ChatbotMetricSnapshot {
  return JSON.parse(JSON.stringify(metrics)) as ChatbotMetricSnapshot;
}
