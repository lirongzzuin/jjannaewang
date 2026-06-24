import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { activeTier } from '@/lib/premium';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/me — authenticated profile: user, badges, this month's savings + counts.
export async function GET(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  const month = currentMonth();

  const [{ data: user }, { data: badges }, { data: savings }, trackingCount, dealCount, tipCount] =
    await Promise.all([
      supabase.from('users').select('*').eq('id', session.uid).single(),
      supabase.from('user_badges').select('badge_code, earned_at').eq('user_id', session.uid),
      supabase.from('savings').select('saved_amount').eq('user_id', session.uid).eq('month', month),
      supabase
        .from('user_trackings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.uid),
      supabase
        .from('deal_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.uid),
      supabase.from('tips').select('*', { count: 'exact', head: true }).eq('user_id', session.uid),
    ]);

  if (!user) return NextResponse.json({ error: '유저를 찾을 수 없어요' }, { status: 404 });

  const savedThisMonth = (savings ?? []).reduce((sum, s) => sum + (s.saved_amount ?? 0), 0);

  // Reflect effective tier (expired subscription → free) so the client gates ads correctly.
  const tier = activeTier(user.premium_tier, user.premium_expiry);
  user.premium_tier = tier === 'free' ? null : tier;

  return NextResponse.json({
    user,
    badges: badges ?? [],
    stats: {
      savedThisMonth,
      trackingCount: trackingCount.count ?? 0,
      dealCount: dealCount.count ?? 0,
      tipCount: tipCount.count ?? 0,
    },
  });
}
