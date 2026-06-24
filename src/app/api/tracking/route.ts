import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

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

  const { data: user } = await supabase.from('users').select('premium_tier').eq('id', session.uid).single();
  const limit = user?.premium_tier === 'master' ? Infinity : user?.premium_tier === 'pro' ? 50 : 10;

  if ((count || 0) >= limit) {
    return NextResponse.json({ error: 'Tracking limit reached', code: 'LIMIT_REACHED' }, { status: 429 });
  }

  const { data, error } = await supabase.from('user_trackings').upsert({
    user_id: session.uid,
    product_id,
    target_price: target_price || null,
    alert_enabled: true,
  }).select().single();

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
