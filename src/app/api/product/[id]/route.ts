import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const { data: history } = await supabase
    .from('price_history')
    .select('*')
    .eq('product_id', params.id)
    .order('recorded_at', { ascending: true })
    .limit(365);

  // The caller's own tracking row (if authenticated) → seeds 감시 상태 + 시작가.
  let tracking = null;
  const session = getAuthUser(req);
  if (session) {
    const { data: t } = await supabase
      .from('user_trackings')
      .select('id, target_price, baseline_price, alert_enabled')
      .eq('user_id', session.uid)
      .eq('product_id', params.id)
      .maybeSingle();
    tracking = t ?? null;
  }

  return NextResponse.json({ product, history: history || [], tracking });
}
