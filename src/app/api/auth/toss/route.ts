import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { exchangeTossCode, signSession } from '@/lib/auth';
import { activeTier } from '@/lib/premium';
import { randomNickname } from '@/lib/nickname';

// CORS + OPTIONS are handled centrally in src/middleware.ts.

/**
 * POST /api/auth/toss
 * Exchange a Toss authorizationCode for a user record + signed session token.
 * Body: { authorizationCode, referrer? }
 * Returns: { token, user }
 */
export async function POST(req: NextRequest) {
  const { authorizationCode, referrer } = (await req.json().catch(() => ({}))) as {
    authorizationCode?: string;
    referrer?: string;
  };

  if (!authorizationCode) {
    return NextResponse.json({ error: 'authorizationCode is required' }, { status: 400 });
  }

  let identity;
  try {
    identity = await exchangeTossCode(authorizationCode, referrer);
  } catch (e) {
    console.error('Toss exchange error:', e);
    return NextResponse.json({ error: '토스 인증에 실패했어요' }, { status: 401 });
  }

  const supabase = createServerClient();

  // Returning user → keep their (possibly custom) nickname, just refresh login.
  // New user → create with a friendly random default (nickname_set=false).
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('toss_user_id', identity.tossUserId)
    .maybeSingle();

  let dbUser = existing;
  if (dbUser) {
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', dbUser.id);
  } else {
    const { data: created, error } = await supabase
      .from('users')
      .insert({
        toss_user_id: identity.tossUserId,
        nickname: identity.nickname?.trim() || randomNickname(),
        // nickname_set defaults to false in DB (migration 008); omitted here so
        // login still works even if the migration hasn't been applied yet.
        last_login_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error || !created) {
      // Race: another request created it — re-read.
      const { data: again } = await supabase
        .from('users')
        .select('*')
        .eq('toss_user_id', identity.tossUserId)
        .maybeSingle();
      if (!again) {
        console.error('Auth insert error:', error?.message);
        return NextResponse.json({ error: '세션 생성에 실패했어요' }, { status: 500 });
      }
      dbUser = again;
    } else {
      dbUser = created;
    }
  }

  // Refresh the daily streak on login (best-effort).
  try {
    await supabase.rpc('update_user_streak', { p_user_id: dbUser.id });
  } catch {
    /* best-effort */
  }

  const tier = activeTier(dbUser.premium_tier, dbUser.premium_expiry);
  dbUser.premium_tier = tier === 'free' ? null : tier;

  const token = signSession(dbUser.id, dbUser.toss_user_id);
  return NextResponse.json({ token, user: dbUser });
}
