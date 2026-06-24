import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// POST /api/me/streak — refresh the daily attendance streak. (CORS via middleware)
export async function POST(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  try {
    await supabase.rpc('update_user_streak', { p_user_id: session.uid });
  } catch {
    /* best-effort */
  }

  const { data } = await supabase
    .from('users')
    .select('streak_days, exp, level')
    .eq('id', session.uid)
    .single();

  // Streak milestone rewards (idempotent via unique badge).
  const streak = data?.streak_days ?? 0;
  const milestones: Record<number, { badge: string; exp: number }> = {
    7: { badge: 'streak_7', exp: 50 },
    30: { badge: 'streak_30', exp: 200 },
  };
  let milestone: { badge: string; exp: number } | null = null;
  if (milestones[streak]) {
    const m = milestones[streak];
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', session.uid)
      .eq('badge_code', m.badge)
      .maybeSingle();
    if (!existing) {
      await supabase
        .from('user_badges')
        .upsert({ user_id: session.uid, badge_code: m.badge }, { onConflict: 'user_id,badge_code' });
      try {
        await supabase.rpc('add_user_exp', { p_user_id: session.uid, p_exp: m.exp });
      } catch {
        /* best-effort */
      }
      milestone = m;
    }
  }

  return NextResponse.json({ ok: true, ...(data ?? {}), milestone });
}
