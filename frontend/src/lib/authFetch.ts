/**
 * Global fetch interceptor for 401 handling.
 *
 * Installed once at startup via installFetchInterceptor() in main.tsx.
 *
 * Triggers automatic logout + redirect to /login ONLY when ALL three conditions hold:
 *   1. The response status is 401.
 *   2. The original request carried an `Authorization: Bearer …` header
 *      (i.e. it was an authenticated request using our JWT).
 *   3. The Zustand auth store still has a token (session is considered active).
 *
 * This means:
 *   - Public API calls (no Bearer header) → never trigger logout.
 *   - POST /api/auth/login returning 401 → no Bearer header → never triggers logout.
 *   - Chatbot or external APIs without our JWT → no Bearer header → never triggers logout.
 *   - HTTP 403 → condition (1) not met → no logout.
 *   - Multiple simultaneous 401s → isHandlingUnauthorized flag prevents duplicate redirects.
 *
 * No components need to be modified. No new dependencies required.
 */

import { useAuthStore } from '../store/authStore';

// Guard against multiple concurrent 401 responses all trying to redirect at once.
let isHandlingUnauthorized = false;

/**
 * Extracts the Authorization header value from the fetch arguments, supporting
 * both plain init objects and Request instances.
 */
function getAuthorizationHeader(
  input: RequestInfo | URL,
  init?: RequestInit,
): string | null {
  // Case 1: init object was provided with headers.
  if (init?.headers) {
    const h = init.headers;
    if (h instanceof Headers) {
      return h.get('Authorization');
    }
    if (Array.isArray(h)) {
      const entry = h.find(([k]) => k.toLowerCase() === 'authorization');
      return entry ? entry[1] : null;
    }
    // Plain object: { Authorization: '...' } or { authorization: '...' }
    const record = h as Record<string, string>;
    for (const key of Object.keys(record)) {
      if (key.toLowerCase() === 'authorization') return record[key];
    }
  }

  // Case 2: input is a Request object that already has headers baked in.
  if (input instanceof Request) {
    return input.headers.get('Authorization');
  }

  return null;
}

export function installFetchInterceptor(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const response = await originalFetch(input, init);

    if (response.status === 401 && !isHandlingUnauthorized) {
      const authorization = getAuthorizationHeader(input, init);

      // Only act when the request was an authenticated call using our JWT.
      const isAuthenticatedRequest =
        typeof authorization === 'string' &&
        authorization.startsWith('Bearer ');

      if (isAuthenticatedRequest) {
        const { token, logout } = useAuthStore.getState();
        if (token) {
          isHandlingUnauthorized = true;
          logout(); // clears localStorage 'token', localStorage 'user', Zustand state
          window.location.href = '/login';
          // Flag is intentionally never reset — the page is navigating away.
        }
      }
    }

    // Always return the original response so caller error handling still works.
    return response;
  };
}

