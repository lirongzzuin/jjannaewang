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

  return NextResponse.json({ ok: true, ...(data ?? {}) });
}
