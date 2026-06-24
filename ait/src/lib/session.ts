// Session token storage. The backend issues a signed session token after
// exchanging the Toss authorizationCode; the SPA stores it and sends it as a
// Bearer token on every authenticated API request.

const TOKEN_KEY = "jjannaewang-token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
