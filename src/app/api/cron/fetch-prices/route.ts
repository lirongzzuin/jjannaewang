import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tier = req.nextUrl.searchParams.get('tier');
  // In production: fetch prices from Naver/Coupang APIs and store in Supabase
  console.log(`Fetching prices for tier: ${tier}`);
  return NextResponse.json({ ok: true, tier });
}
