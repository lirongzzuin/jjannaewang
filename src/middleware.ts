import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

// Centralized CORS for all API routes. The .ait SPA (served from the Toss CDN
// origin) calls this backend cross-origin, so every /api response needs CORS
// headers and preflight (OPTIONS) handling.
export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: '/api/:path*',
};
