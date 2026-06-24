import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Get price history
  const { data: history } = await supabase
    .from('price_history')
    .select('*')
    .eq('product_id', params.id)
    .order('recorded_at', { ascending: true })
    .limit(365);

  return NextResponse.json({ product, history: history || [] });
}
