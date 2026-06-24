import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { validateNickname } from '@/lib/nickname';

// POST /api/me/nickname  Body: { nickname } — set the user's own nickname.
export async function POST(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const { nickname } = (await req.json().catch(() => ({}))) as { nickname?: string };
  const check = validateNickname(nickname);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('users')
    .update({ nickname: check.value, nickname_set: true })
    .eq('id', session.uid)
    .select('id, nickname, nickname_set')
    .single();

  if (error || !data) {
    console.error('nickname update error:', error?.message);
    return NextResponse.json({ error: '닉네임 변경에 실패했어요' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, nickname: data.nickname });
}
