import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/auth/toss
 * Exchange a Toss authorizationCode for user info.
 *
 * In production:
 *   1. Call Toss OAuth token endpoint with authorizationCode
 *   2. Use access token to fetch user profile (userId, nickname, profileImageUrl)
 *   3. Upsert user in DB
 *   4. Return user
 *
 * The Apps-in-Toss OAuth docs: https://docs.toss.im/mini-app/api/auth
 */
export async function POST(req: NextRequest) {
  const { authorizationCode } = await req.json() as { authorizationCode?: string };

  if (!authorizationCode) {
    return NextResponse.json({ error: 'authorizationCode is required' }, { status: 400 });
  }

  // ── Production: exchange code with Toss ───────────────────────────────────
  // const tossRes = await fetch('https://api.toss.im/oauth/token', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     grant_type: 'authorization_code',
  //     client_id: process.env.TOSS_CLIENT_ID,
  //     client_secret: process.env.TOSS_CLIENT_SECRET,
  //     code: authorizationCode,
  //   }),
  // });
  // const { access_token } = await tossRes.json();
  //
  // const profileRes = await fetch('https://api.toss.im/v1/me', {
  //   headers: { Authorization: `Bearer ${access_token}` },
  // });
  // const { userId, nickname, profileImageUrl } = await profileRes.json();
  // ─────────────────────────────────────────────────────────────────────────

  // ── Dev/mock: derive stable user from code ───────────────────────────────
  const mockUserId = 'toss-' + authorizationCode.slice(-8);
  const nickname = '짠내왕유저';
  // ─────────────────────────────────────────────────────────────────────────

  const supabase = createServerClient();

  // Upsert user record
  const { data: dbUser, error } = await supabase
    .from('users')
    .upsert({
      toss_user_id: mockUserId,
      nickname,
      last_login_at: new Date().toISOString(),
    }, { onConflict: 'toss_user_id' })
    .select()
    .single();

  if (error) {
    console.error('Auth upsert error:', error.message);
    return NextResponse.json({ error: 'Failed to create user session' }, { status: 500 });
  }

  return NextResponse.json({
    userId: dbUser.id,
    tossUserId: dbUser.toss_user_id,
    nickname: dbUser.nickname,
    level: dbUser.level,
    premiumTier: dbUser.premium_tier,
  });
}
