import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // In production: aggregate hot tips and cache in Redis
  console.log('Aggregating hot tips...');
  return NextResponse.json({ ok: true });
}
