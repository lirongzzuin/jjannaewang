import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const user_id = req.nextUrl.searchParams.get('user_id');
  if (!user_id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  const { data, error } = await supabase
    .from('user_trackings')
    .select('*, product:products(*)')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trackings: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { user_id, product_id, target_price } = await req.json();

  if (!user_id || !product_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Check tracking limit
  const { count } = await supabase
    .from('user_trackings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user_id);

  const { data: user } = await supabase.from('users').select('premium_tier').eq('id', user_id).single();
  const limit = user?.premium_tier === 'master' ? Infinity : user?.premium_tier === 'pro' ? 50 : 10;

  if ((count || 0) >= limit) {
    return NextResponse.json({ error: 'Tracking limit reached', code: 'LIMIT_REACHED' }, { status: 429 });
  }

  const { data, error } = await supabase.from('user_trackings').upsert({
    user_id,
    product_id,
    target_price: target_price || null,
    alert_enabled: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tracking: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient();
  const { user_id, product_id } = await req.json();

  const { error } = await supabase.from('user_trackings')
    .delete()
    .eq('user_id', user_id)
    .eq('product_id', product_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
