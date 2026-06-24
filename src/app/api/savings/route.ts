import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const EXP_PER_LOG = 15;

// POST /api/savings — record a saving (manual or from a met tracking target).
// Body: { original_price, purchased_price, product_id?, source? }
// This is the manual stand-in for payment integration; `source` lets a future
// auto-sync write the same table. Updates cumulative savings + EXP + badges.
export async function POST(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    original_price?: number;
    purchased_price?: number;
    product_id?: string;
    source?: string;
  };

  const original = Number(body.original_price);
  const purchased = Number(body.purchased_price);
  if (!Number.isFinite(original) || !Number.isFinite(purchased) || original <= 0 || purchased < 0) {
    return NextResponse.json({ error: '가격을 올바르게 입력해주세요' }, { status: 400 });
  }
  const saved = Math.max(0, Math.round(original - purchased));
  if (saved <= 0) {
    return NextResponse.json({ error: '정가보다 싸게 산 경우만 기록할 수 있어요' }, { status: 400 });
  }

  const supabase = createServerClient();
  const month = currentMonth();
  const source = body.source === 'tracking' || body.source === 'auto' ? body.source : 'manual';

  const { data: saving, error } = await supabase
    .from('savings')
    .insert({
      user_id: session.uid,
      product_id: body.product_id ?? null,
      original_price: original,
      purchased_price: purchased,
      saved_amount: saved,
      month,
      source,
    })
    .select()
    .single();

  if (error) {
    console.error('savings insert error:', error.message);
    return NextResponse.json({ error: '기록에 실패했어요' }, { status: 500 });
  }

  // Cumulative total + EXP (best-effort).
  try {
    await supabase.rpc('increment_total_saved', { p_user_id: session.uid, p_amount: saved });
    await supabase.rpc('add_user_exp', { p_user_id: session.uid, p_exp: EXP_PER_LOG });
  } catch (e) {
    console.error('savings reward error:', e);
  }

  // Savings milestone badges.
  const { data: user } = await supabase
    .from('users')
    .select('total_saved_amount')
    .eq('id', session.uid)
    .single();
  const total = user?.total_saved_amount ?? saved;
  const newBadges: string[] = [];
  if (total >= 1_000_000) newBadges.push('save_1m');
  else if (total >= 100_000) newBadges.push('save_100k');
  if (newBadges.length) {
    await supabase
      .from('user_badges')
      .upsert(
        newBadges.map((badge_code) => ({ user_id: session.uid, badge_code })),
        { onConflict: 'user_id,badge_code' },
      );
  }

  return NextResponse.json({ saving, saved, totalSaved: total, expEarned: EXP_PER_LOG });
}
