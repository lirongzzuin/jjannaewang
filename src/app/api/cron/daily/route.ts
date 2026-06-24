import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

// Single daily orchestrator — runs all cron jobs in sequence so we stay within
// the Vercel Hobby plan limits (1 daily cron). On Pro, you can instead schedule
// each sub-job at a higher frequency directly in vercel.json.
const JOBS = [
  '/api/cron/fetch-prices?tier=popular',
  '/api/cron/fetch-prices?tier=tracked',
  '/api/cron/check-alerts',
  '/api/cron/hot-tips',
  '/api/cron/daily-report',
];

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = req.nextUrl.origin;
  const results: Record<string, unknown> = {};
  for (const job of JOBS) {
    try {
      const res = await fetch(`${origin}${job}`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      results[job] = { status: res.status, body: await res.json().catch(() => null) };
    } catch (e) {
      results[job] = { error: e instanceof Error ? e.message : String(e) };
    }
  }
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results });
}
