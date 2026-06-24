import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/products/resolve
// Persists a Naver search result into our `products` table (idempotent by
// naver_product_id) and seeds a price_history point, so the detail / tracking /
// price-chart features work on REAL data. Returns the internal product (UUID).
//
// Body: { naver_product_id, name, brand?, category?, image_url?, price?, shop? }
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    naver_product_id?: string;
    name?: string;
    brand?: string | null;
    category?: string | null;
    image_url?: string | null;
    price?: number | null;
    shop?: string | null;
  };

  if (!body.naver_product_id || !body.name) {
    return NextResponse.json({ error: 'naver_product_id와 name이 필요해요' }, { status: 400 });
  }

  const supabase = createServerClient();
  const price = Number.isFinite(Number(body.price)) ? Number(body.price) : null;

  // Look up existing product.
  const { data: existing } = await supabase
    .from('products')
    .select('*')
    .eq('naver_product_id', body.naver_product_id)
    .maybeSingle();

  let product = existing;

  if (!product) {
    const { data: created, error } = await supabase
      .from('products')
      .insert({
        naver_product_id: body.naver_product_id,
        name: body.name,
        brand: body.brand ?? null,
        category: body.category ?? null,
        image_url: body.image_url ?? null,
        current_lowest_price: price,
        current_lowest_shop: body.shop ?? null,
        lowest_price_ever: price,
        tracking_count: 0,
      })
      .select()
      .single();
    if (error || !created) {
      // Race: another request inserted it — re-read.
      const { data: again } = await supabase
        .from('products')
        .select('*')
        .eq('naver_product_id', body.naver_product_id)
        .maybeSingle();
      if (!again) {
        console.error('product resolve insert error:', error?.message);
        return NextResponse.json({ error: '상품 등록에 실패했어요' }, { status: 500 });
      }
      product = again;
    } else {
      product = created;
    }
  } else if (price != null) {
    // Refresh current price + lowest-ever on revisit.
    const newLowest =
      product.lowest_price_ever == null ? price : Math.min(product.lowest_price_ever, price);
    await supabase
      .from('products')
      .update({
        current_lowest_price: price,
        current_lowest_shop: body.shop ?? product.current_lowest_shop,
        lowest_price_ever: newLowest,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product.id);
  }

  // Seed a price-history point (best-effort) so charts have real data over time.
  if (product && price != null) {
    await supabase
      .from('price_history')
      .insert({
        product_id: product.id,
        shop_name: body.shop ?? '네이버',
        price,
        affiliate_url: null,
      })
      .then(undefined, () => {});
  }

  return NextResponse.json({ product });
}
