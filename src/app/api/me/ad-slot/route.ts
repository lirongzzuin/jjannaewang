import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

const MAX_BONUS_SLOTS = 20;

// POST /api/me/ad-slot — grant +1 tracking slot after a rewarded ad completes.
// Must be called only on a verified userEarnedReward (client enforces this).
export async function POST(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('add_bonus_slot', {
    p_user_id: session.uid,
    p_max: MAX_BONUS_SLOTS,
  });
  if (error) {
    console.error('ad-slot error:', error.message);
    return NextResponse.json({ error: '슬롯 추가에 실패했어요' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, bonusSlots: data ?? null });
}
