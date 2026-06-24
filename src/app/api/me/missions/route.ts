import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// GET /api/me/missions — today's daily missions with real completion state.
export async function GET(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const since = startOfToday.toISOString();

  const [trackingCount, dealsToday, tipsToday] = await Promise.all([
    supabase
      .from('user_trackings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.uid),
    supabase
      .from('deal_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.uid)
      .gte('created_at', since),
    supabase
      .from('tips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.uid)
      .gte('created_at', since),
  ]);

  const missions = [
    { code: 'visit', label: '앱 방문', exp: 10, done: true },
    { code: 'track', label: '상품 추적 1개', exp: 20, done: (trackingCount.count ?? 0) > 0 },
    { code: 'deal', label: '딜 제보', exp: 30, done: (dealsToday.count ?? 0) > 0 },
    { code: 'tip', label: '꿀팁 작성', exp: 20, done: (tipsToday.count ?? 0) > 0 },
  ];

  return NextResponse.json({ missions });
}
