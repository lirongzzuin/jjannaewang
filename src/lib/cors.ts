import { NextResponse } from 'next/server';

// The .ait SPA is served from the Toss runtime (origin varies by sandbox/prod
// and webview), and the backend lives on Vercel. Auth is token-based (Bearer,
// no cookies), so it's safe to reflect ANY request origin — this avoids the
// WebView's cross-origin fetch being blocked when its origin isn't a predictable
// *.tossmini.com host. (CORS doesn't protect the server; our tokens/CRON_SECRET do.)

function resolveOrigin(origin: string | null): string {
  // Reflect a real origin so it works with any client; '*' when absent/opaque.
  if (!origin || origin === 'null') return '*';
  return origin;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveOrigin(origin),
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/** Wrap a JSON response with CORS headers. */
export function withCors<T>(data: T, origin: string | null, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(data, init);
  for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v);
  return res;
}

/** Standard preflight handler. */
export function preflight(origin: string | null): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
