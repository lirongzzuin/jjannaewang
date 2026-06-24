import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { containsBannedWords } from '@/lib/moderation';
import { getAuthUser } from '@/lib/auth';
import { awardPioneer } from '@/lib/rewards';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const category = req.nextUrl.searchParams.get('category');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('deal_posts')
    .select('*, user:users(id, nickname, level), product:products(id, name, image_url)', { count: 'exact' })
    .eq('is_expired', false)
    .order('fire_count', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Annotate the caller's own 'fire' reaction so the UI shows correct state.
  let deals = data || [];
  const session = getAuthUser(req);
  if (session && deals.length) {
    const { data: reactions } = await supabase
      .from('deal_reactions')
      .select('deal_id, type')
      .eq('user_id', session.uid)
      .eq('type', 'fire')
      .in('deal_id', deals.map((d) => d.id));
    const fired = new Set((reactions ?? []).map((r) => r.deal_id));
    deals = deals.map((d) => ({ ...d, my_reaction: fired.has(d.id) ? 'fire' : null }));
  }

  return NextResponse.json({ deals, total: count || 0, page, limit });
}

export async function POST(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  const body = await req.json() as {
    title?: string;
    description?: string;
    original_price?: number;
    deal_price?: number;
    shop_name?: string;
    shop_url?: string;
    product_id?: string;
    category?: string;
  };

  const { title, description, original_price, deal_price, shop_name, shop_url, product_id, category } = body;

  if (!title || !shop_name || deal_price === undefined) {
    return NextResponse.json({ error: 'Missing required fields: title, shop_name, deal_price' }, { status: 400 });
  }

  const trimmedTitle = title.trim();
  const trimmedDesc = description?.trim() ?? '';

  if (trimmedTitle.length < 3 || trimmedTitle.length > 100) {
    return NextResponse.json({ error: '제목은 3자 이상 100자 이하여야 합니다' }, { status: 400 });
  }
  if (trimmedDesc.length > 500) {
    return NextResponse.json({ error: '설명은 500자 이하여야 합니다' }, { status: 400 });
  }
  if (deal_price < 0) {
    return NextResponse.json({ error: '가격은 0 이상이어야 합니다' }, { status: 400 });
  }
  if (shop_url) {
    try { new URL(shop_url); } catch {
      return NextResponse.json({ error: '유효하지 않은 쇼핑몰 링크입니다' }, { status: 400 });
    }
  }
  if (containsBannedWords(trimmedTitle) || containsBannedWords(trimmedDesc)) {
    return NextResponse.json({ error: '사용할 수 없는 단어가 포함되어 있습니다' }, { status: 400 });
  }

  const { data, error } = await supabase.from('deal_posts').insert({
    user_id: session.uid,
    title: trimmedTitle,
    description: trimmedDesc || null,
    original_price: original_price ?? null,
    deal_price,
    shop_name: shop_name.trim(),
    shop_url: shop_url?.trim() || null,
    product_id: product_id ?? null,
    category: category ?? null,
    fire_count: 0,
    bought_count: 0,
    is_expired: false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pioneer reward — first reporter for this product (or first deal ever if free-form).
  let reward = null;
  if (product_id) {
    const { count } = await supabase
      .from('deal_posts')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', product_id);
    if ((count ?? 0) <= 1) reward = await awardPioneer(supabase, session.uid, 'deal');
  } else {
    const { count } = await supabase
      .from('deal_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.uid);
    if ((count ?? 0) <= 1) reward = await awardPioneer(supabase, session.uid, 'deal');
  }

  return NextResponse.json({ deal: data, reward }, { status: 201 });
}
