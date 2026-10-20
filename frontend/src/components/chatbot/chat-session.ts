import type { ChatbotSession } from '../../services/chatbot.api';

const SESSION_KEY = 'webphone_chat_session_id';
const TOKEN_KEY = 'webphone_chat_session_token';
const SESSION_STATE_KEY = 'webphone_chat_session_v2';
const PENDING_KEY = 'webphone_chat_pending_turn';
const DRAFT_KEY = 'webphone_chat_input_draft';
const ARCHIVE_KEY = 'webphone_chat_previous_session_ids';
const PERSISTENT_KEYS = new Set([SESSION_KEY, TOKEN_KEY, SESSION_STATE_KEY, ARCHIVE_KEY]);
// Storage-denied fallback only. Concurrency correctness remains in PostgreSQL.
const memory = new Map<string, string>();
const memoryOnly = new Set<string>();

function read(key: string): string | null {
  if (memoryOnly.has(key)) return memory.get(key) ?? null;
  try {
    const tabValue = sessionStorage.getItem(key);
    if (tabValue !== null) return tabValue;
  } catch { /* Storage can be denied in private or embedded browsing contexts. */ }
  if (!PERSISTENT_KEYS.has(key)) return memory.get(key) ?? null;
  try {
    const persistent = localStorage.getItem(key);
    if (persistent !== null) {
      try { sessionStorage.setItem(key, persistent); } catch { /* Local storage remains the durable source. */ }
      return persistent;
    }
  } catch { /* Fall back to the tab store when persistent storage is unavailable. */ }
  return memory.get(key) ?? null;
}

function write(key: string, value: string | null): void {
  if (value === null) memory.delete(key); else memory.set(key, value);
  let persistent = false;
  if (PERSISTENT_KEYS.has(key)) {
    try {
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
      persistent = true;
    } catch { /* Fall back to tab storage. */ }
  }
  try {
    if (persistent || value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch { /* The in-memory copy remains available for this page lifetime. */ }
  if (persistent) memoryOnly.delete(key); else memoryOnly.add(key);
}

function tokenExpiry(token?: string): number {
  if (!token) return 0;
  try {
    const payload = token.split('.')[0];
    if (!payload) return 0;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const parsed = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    return Number.isSafeInteger(parsed.exp) ? parsed.exp : 0;
  } catch { return 0; }
}

export type PendingChatTurn = { text: string; sessionId: string; requestId: string; dispatched?: boolean };

function storedSession(): ChatbotSession | null {
  try {
    const session = JSON.parse(read(SESSION_STATE_KEY) || 'null');
    if (session && typeof session.sessionId === 'string' && session.sessionId.length > 0 && session.sessionId.length <= 100 &&
        (session.sessionToken === undefined || typeof session.sessionToken === 'string' && session.sessionToken.length <= 512)) return session;
  } catch { /* Read pre-Phase-2A storage below. */ }
  return null;
}

export function currentChatSession(): ChatbotSession {
  const secured = storedSession();
  if (secured) return secured;
  const sessionId = read(SESSION_KEY);
  const session = sessionId && sessionId.length <= 100
    ? { sessionId, sessionToken: read(TOKEN_KEY) || undefined } : { sessionId: crypto.randomUUID() };
  storeChatSession(session);
  return session;
}

export function storeChatSession(session: ChatbotSession): void {
  const current = storedSession();
  const previous = current?.sessionId || read(SESSION_KEY);
  if (previous && previous !== session.sessionId) {
    // References only; never delete or claim the previous database conversation.
    let archive: string[] = [];
    try {
      const parsed: unknown = JSON.parse(read(ARCHIVE_KEY) || '[]');
      if (Array.isArray(parsed)) archive = parsed.filter((id): id is string => typeof id === 'string');
    } catch { /* Retain the current reference below. */ }
    write(ARCHIVE_KEY, JSON.stringify([...new Set([...archive, previous])]));
  }
  const sessionToStore = current?.sessionId === session.sessionId && current.sessionToken && session.sessionToken
    && tokenExpiry(current.sessionToken) > tokenExpiry(session.sessionToken)
    ? { ...session, sessionToken: current.sessionToken } : session;
  // Persist the pair in one storage operation, before updating compatibility keys.
  write(SESSION_STATE_KEY, JSON.stringify(sessionToStore));
  write(SESSION_KEY, sessionToStore.sessionId);
  write(TOKEN_KEY, sessionToStore.sessionToken || null);
}

export function readPendingChatTurn(): PendingChatTurn | null {
  try {
    const turn = JSON.parse(read(PENDING_KEY) || 'null');
    const validRequestId = typeof turn?.requestId === 'string'
      && (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(turn.requestId)
        || /^compat-[0-9a-f]{64}$/.test(turn.requestId));
    return turn && typeof turn.text === 'string' && turn.text.trim() && turn.text.length <= 2000 &&
      typeof turn.sessionId === 'string' && turn.sessionId.length <= 100 &&
      validRequestId &&
      (turn.dispatched === undefined || typeof turn.dispatched === 'boolean') ? turn : null;
  } catch { return null; }
}

export function storePendingChatTurn(turn: PendingChatTurn | null): void {
  write(PENDING_KEY, turn ? JSON.stringify(turn) : null);
}

export function readChatInputDraft(): string { return read(DRAFT_KEY) || ''; }
export function storeChatInputDraft(value: string): void { write(DRAFT_KEY, value || null); }
