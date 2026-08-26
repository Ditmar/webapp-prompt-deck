export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export function getTokens(): Tokens | null {
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function setTokens(tokens: Tokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function logout(): void {
  clearTokens();
  window.location.href = '/login';
}

/** Decodes the `sub` claim out of the access token without a JWT library. */
export function getUserId(): string | null {
  const tokens = getTokens();
  if (!tokens) return null;
  try {
    const payloadJson = atob(
      tokens.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    );
    const payload = JSON.parse(payloadJson) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/** Redirects to /login and throws if there is no session — call at the top of protected pages. */
export function requireAuthOrRedirect(): Tokens {
  const tokens = getTokens();
  if (!tokens) {
    window.location.href = '/login';
    throw new Error('Not authenticated');
  }
  return tokens;
}

async function refreshTokens(refreshToken: string): Promise<Tokens | null> {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const tokens = (await res.json()) as Tokens;
  setTokens(tokens);
  return tokens;
}

/**
 * fetch() wrapper that attaches the Bearer access token and transparently
 * rotates it via /api/auth/refresh on a single 401 before giving up and
 * sending the user back to /login.
 */
export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const tokens = requireAuthOrRedirect();

  const doFetch = (accessToken: string) =>
    fetch(`${API_URL}${path}`, {
      // Deck content can change via PUT without its URL changing, and some
      // browsers may still be holding an entry cached under the old
      // (pre-fix) long-lived Cache-Control this API used to send. Force a
      // real network hit instead of ever trusting a locally cached copy.
      cache: 'no-store',
      ...options,
      headers: {
        ...(options.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let res = await doFetch(tokens.accessToken);
  if (res.status === 401) {
    const refreshed = await refreshTokens(tokens.refreshToken);
    if (!refreshed) {
      logout();
      throw new Error('Session expired');
    }
    res = await doFetch(refreshed.accessToken);
  }
  return res;
}
