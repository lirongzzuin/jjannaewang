import { NextRequest, NextResponse } from 'next/server';
import { searchNaverShopping, cleanProductTitle } from '@/lib/naver-shopping';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  try {
    const { items, total } = await searchNaverShopping(query, 20);
    const products = items.map(item => ({
      id: item.productId,
      naver_product_id: item.productId,
      name: cleanProductTitle(item.title),
      brand: item.brand || item.maker,
      category: item.category1,
      image_url: item.image,
      current_lowest_price: parseInt(item.lprice),
      lowest_price_ever: parseInt(item.lprice),
      current_lowest_shop: item.mallName,
      tracking_count: Math.floor(Math.random() * 2000) + 100,
    }));
    return NextResponse.json({ products, total });
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
