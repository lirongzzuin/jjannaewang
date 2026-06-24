import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { cached } from '@/lib/upstash';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/me/insights — the "why come back" payload: peer comparison + streak +
// tracked price-drop count for the daily home briefing.
export async function GET(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  const month = currentMonth();

  // Month-wide savings are shared across users → cache the aggregation (60s) so
  // every Home visit doesn't re-scan the savings table.
  const [totalsArr, { data: user }, { data: trackings }] = await Promise.all([
    cached<[string, number][]>(`insights:savings:${month}`, 60, async () => {
      const { data } = await supabase.from('savings').select('user_id, saved_amount').eq('month', month);
      const agg = new Map<string, number>();
      for (const s of data ?? []) agg.set(s.user_id, (agg.get(s.user_id) ?? 0) + (s.saved_amount ?? 0));
      return Array.from(agg.entries());
    }),
    supabase.from('users').select('total_saved_amount, streak_days, level').eq('id', session.uid).single(),
    supabase
      .from('user_trackings')
      .select('target_price, product:products(current_lowest_price)')
      .eq('user_id', session.uid),
  ]);

  const totals = new Map<string, number>(totalsArr);
  const myMonth = totals.get(session.uid) ?? 0;
  const peerValues = Array.from(totals.values());
  const peerCount = peerValues.length;
  // Peer average excludes the caller for a fair "vs others" comparison.
  const others: number[] = [];
  for (const [uid, v] of totals) if (uid !== session.uid) others.push(v);
  const peerAverage = others.length
    ? Math.round(others.reduce((a, b) => a + b, 0) / others.length)
    : 0;

  // Percentile (top X%) among users with savings this month.
  let topPercent: number | null = null;
  let savingsRank: number | null = null;
  if (myMonth > 0 && peerCount > 0) {
    const greater = peerValues.filter((v) => v > myMonth).length;
    savingsRank = greater + 1;
    topPercent = Math.max(1, Math.round((savingsRank / peerCount) * 100));
  }

  // Tracked items currently at/under target.
  const trackedDropCount = ((trackings ?? []) as unknown as Array<{
    target_price: number | null;
    product: { current_lowest_price: number | null } | null;
  }>).filter((t) => {
    const p = t.product?.current_lowest_price;
    return p != null && t.target_price != null && p <= t.target_price;
  }).length;

  return NextResponse.json({
    savedThisMonth: myMonth,
    savedTotal: user?.total_saved_amount ?? 0,
    streakDays: user?.streak_days ?? 0,
    level: user?.level ?? 1,
    peerAverage,
    peerCount,
    topPercent, // null if no savings logged this month
    savingsRank,
    vsPeer: myMonth - peerAverage, // +면 또래보다 더 아낌
    trackedDropCount,
  });
}
