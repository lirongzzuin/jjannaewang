import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { searchNaverShopping, cleanProductTitle } from '@/lib/naver-shopping';

export const maxDuration = 300;

// Collect latest prices and append price_history.
//   tier=popular → most-tracked products   tier=tracked → products users watch
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tier = req.nextUrl.searchParams.get('tier') ?? 'popular';
  const supabase = createServerClient();

  // Select the product batch for this tier.
  let productIds: string[] | null = null;
  if (tier === 'tracked') {
    const { data } = await supabase
      .from('user_trackings')
      .select('product_id')
      .eq('alert_enabled', true);
    productIds = Array.from(new Set((data ?? []).map((r) => r.product_id)));
    if (productIds.length === 0) return NextResponse.json({ ok: true, tier, updated: 0 });
  }

  let query = supabase
    .from('products')
    .select('id, name, current_lowest_price, lowest_price_ever')
    .order('tracking_count', { ascending: false })
    .limit(tier === 'popular' ? 60 : 200);
  if (productIds) query = query.in('id', productIds);

  const { data: products, error } = await query;
  if (error) {
    console.error('fetch-prices product query error:', error.message);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  let updated = 0;
  for (const product of products ?? []) {
    try {
      const { items } = await searchNaverShopping(product.name, 10, 1, 'asc');
      if (!items?.length) continue;

      // Lowest current offer across results.
      const offers = items
        .map((it) => ({
          price: Number(it.lprice),
          shop: it.mallName,
          url: it.link,
        }))
        .filter((o) => Number.isFinite(o.price) && o.price > 0)
        .sort((a, b) => a.price - b.price);
      if (!offers.length) continue;
      const best = offers[0];

      await supabase.from('price_history').insert({
        product_id: product.id,
        shop_name: cleanProductTitle(best.shop),
        price: best.price,
        affiliate_url: best.url,
      });

      const newLowestEver =
        product.lowest_price_ever == null
          ? best.price
          : Math.min(product.lowest_price_ever, best.price);

      await supabase
        .from('products')
        .update({
          current_lowest_price: best.price,
          current_lowest_shop: cleanProductTitle(best.shop),
          lowest_price_ever: newLowestEver,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      updated += 1;
    } catch (e) {
      console.error('fetch-prices item error', product.id, e);
    }
  }

  return NextResponse.json({ ok: true, tier, scanned: products?.length ?? 0, updated });
}
