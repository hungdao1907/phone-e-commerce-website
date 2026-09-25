import { create } from 'zustand';

const ADMIN_CHAT_SESSION_KEY = 'webphone_admin_chat_session_id';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Phase 2C: Startup JWT expiration check
//
// Decodes ONLY the `exp` claim from a JWT payload.
// Does NOT verify the signature — backend jwt.verify() is the security authority.
// Used purely as a UX optimization to avoid mounting protected UI with a stale session.
//
// Returns the numeric `exp` (Unix seconds) or null when the token is:
//   - not a valid 3-part JWT string
//   - has an unparseable payload
//   - missing or non-numeric `exp`
// ---------------------------------------------------------------------------
function getJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }

    // Convert base64url → base64, then add PKCS#7 padding so atob() is happy.
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );

    // Decode binary, then convert bytes → UTF-8 string via TextDecoder.
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);

    const payload = JSON.parse(json) as Record<string, unknown>;
    const exp = payload?.exp;

    return typeof exp === 'number' && Number.isFinite(exp) ? exp : null;
  } catch {
    return null; // malformed at any step → treat as invalid
  }
}

// ---------------------------------------------------------------------------
// Synchronous startup validation — runs BEFORE Zustand create() so React never
// receives an expired token as its initial state.
// ---------------------------------------------------------------------------
const storedToken = localStorage.getItem('token');
const storedUser  = localStorage.getItem('user');

const storedTokenIsValid = ((): boolean => {
  if (!storedToken) return false;
  const exp = getJwtExp(storedToken);
  if (exp === null) return false;                     // malformed or missing exp
  return Date.now() / 1000 < exp;        // true = not yet expired
})();

// If the stored token is invalid/expired, purge localStorage immediately so
// ProtectedRoute sees token: null and redirects without any interim render.
if (storedToken && !storedTokenIsValid) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem(ADMIN_CHAT_SESSION_KEY);
}

// ---------------------------------------------------------------------------
// Zustand store — public interface unchanged
// ---------------------------------------------------------------------------
export const useAuthStore = create<AuthState>((set) => ({
  token: storedTokenIsValid ? storedToken : null,
  user:  storedTokenIsValid && storedUser ? JSON.parse(storedUser) : null,

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem(ADMIN_CHAT_SESSION_KEY);
    set({ token: null, user: null });
  },
}));

