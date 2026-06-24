import { NextResponse } from 'next/server';

// The .ait SPA is served from the Toss CDN origin; the backend lives elsewhere
// (Vercel), so every API response needs CORS headers. Configure the allowed
// origin(s) via ALLOWED_ORIGINS (comma-separated). Defaults cover the documented
// Toss mini-app origin pattern + local dev.

function allowedOrigins(): string[] {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [
    ...fromEnv,
    'https://service.tossmini.com',
    'http://localhost:5173',
  ];
}

function resolveOrigin(origin: string | null): string {
  if (!origin) return allowedOrigins()[0] ?? '*';
  // Allow any *.apps.tossmini.com / *.tossmini.com subdomain (per-app CDN host).
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith('.tossmini.com') || host === 'tossmini.com') return origin;
  } catch {
    /* ignore */
  }
  if (allowedOrigins().includes(origin)) return origin;
  return allowedOrigins()[0] ?? '*';
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
