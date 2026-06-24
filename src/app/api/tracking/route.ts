import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { getLevelExtraSlots } from '@/lib/level-perks';

export async function GET(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('user_trackings')
    .select('*, product:products(*)')
    .eq('user_id', session.uid)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trackings: data || [] });
}

export async function POST(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  const { product_id, target_price } = await req.json();

  if (!product_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Check tracking limit
  const { count } = await supabase
    .from('user_trackings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.uid);

  const { data: user } = await supabase
    .from('users')
    .select('premium_tier, level, bonus_tracking_slots')
    .eq('id', session.uid)
    .single();
  const base = user?.premium_tier === 'master' ? Infinity : user?.premium_tier === 'pro' ? 50 : 10;
  // Tier base + level perks + rewarded-ad bonus slots.
  const limit =
    base === Infinity
      ? Infinity
      : base + getLevelExtraSlots(user?.level ?? 1) + (user?.bonus_tracking_slots ?? 0);

  if ((count || 0) >= limit) {
    return NextResponse.json({ error: 'Tracking limit reached', code: 'LIMIT_REACHED' }, { status: 429 });
  }

  // Baseline = the product's price when the user FIRST starts tracking. Keep an
  // existing baseline on re-track so the savings reference point never resets.
  const [{ data: existing }, { data: product }] = await Promise.all([
    supabase
      .from('user_trackings')
      .select('baseline_price')
      .eq('user_id', session.uid)
      .eq('product_id', product_id)
      .maybeSingle(),
    supabase.from('products').select('current_lowest_price').eq('id', product_id).single(),
  ]);
  const baseline = existing?.baseline_price ?? product?.current_lowest_price ?? null;

  const { data, error } = await supabase
    .from('user_trackings')
    .upsert(
      {
        user_id: session.uid,
        product_id,
        target_price: target_price || null,
        baseline_price: baseline,
        alert_enabled: true,
      },
      { onConflict: 'user_id,product_id' },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tracking: data });
}

export async function DELETE(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  const { product_id } = await req.json();

  const { error } = await supabase.from('user_trackings')
    .delete()
    .eq('user_id', session.uid)
    .eq('product_id', product_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
