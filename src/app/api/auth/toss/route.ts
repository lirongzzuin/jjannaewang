import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { exchangeTossCode, signSession } from '@/lib/auth';

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
  const { data: dbUser, error } = await supabase
    .from('users')
    .upsert(
      {
        toss_user_id: identity.tossUserId,
        nickname: identity.nickname || '짠내왕유저',
        last_login_at: new Date().toISOString(),
      },
      { onConflict: 'toss_user_id' },
    )
    .select()
    .single();

  if (error || !dbUser) {
    console.error('Auth upsert error:', error?.message);
    return NextResponse.json({ error: '세션 생성에 실패했어요' }, { status: 500 });
  }

  // Refresh the daily streak on login (best-effort).
  try {
    await supabase.rpc('update_user_streak', { p_user_id: dbUser.id });
  } catch {
    /* best-effort */
  }

  const token = signSession(dbUser.id, dbUser.toss_user_id);
  return NextResponse.json({ token, user: dbUser });
}
