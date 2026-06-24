import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { containsBannedWords } from '@/lib/moderation';

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
  return NextResponse.json({ deals: data || [], total: count || 0, page, limit });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json() as {
    user_id?: string;
    title?: string;
    description?: string;
    original_price?: number;
    deal_price?: number;
    shop_name?: string;
    shop_url?: string;
    product_id?: string;
  };

  const { user_id, title, description, original_price, deal_price, shop_name, shop_url, product_id } = body;

  if (!user_id || !title || !shop_name || deal_price === undefined) {
    return NextResponse.json({ error: 'Missing required fields: user_id, title, shop_name, deal_price' }, { status: 400 });
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
    user_id,
    title: trimmedTitle,
    description: trimmedDesc || null,
    original_price: original_price ?? null,
    deal_price,
    shop_name: shop_name.trim(),
    shop_url: shop_url?.trim() || null,
    product_id: product_id ?? null,
    fire_count: 0,
    bought_count: 0,
    is_expired: false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deal: data }, { status: 201 });
}
