import { NaverProductItem } from '@/types';

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

export async function searchNaverShopping(
  query: string,
  display = 20,
  start = 1,
  sort: 'sim' | 'date' | 'asc' | 'dsc' = 'sim'
): Promise<{ items: NaverProductItem[]; total: number }> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    // Return mock data for development
    return getMockProducts(query);
  }

  const url = new URL('https://openapi.naver.com/v1/search/shop.json');
  url.searchParams.set('query', query);
  url.searchParams.set('display', String(display));
  url.searchParams.set('start', String(start));
  url.searchParams.set('sort', sort);

  const res = await fetch(url.toString(), {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
    next: { revalidate: 300 }, // Cache 5 minutes
  });

  if (!res.ok) throw new Error(`Naver API error: ${res.status}`);
  const data = await res.json();
  return { items: data.items, total: data.total };
}

function getMockProducts(query: string): { items: NaverProductItem[]; total: number } {
  const mockItems: NaverProductItem[] = [
    {
      title: `${query} 프리미엄 2L x 12개`,
      link: 'https://search.shopping.naver.com',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
      lprice: '8900',
      hprice: '12000',
      mallName: '쿠팡',
      productId: `mock-${query}-1`,
      productType: '1',
      brand: query,
      maker: query,
      category1: '식품',
      category2: '음료',
      category3: '생수',
      category4: '',
    },
    {
      title: `${query} 500ml x 20개 번들`,
      link: 'https://search.shopping.naver.com',
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200',
      lprice: '7500',
      hprice: '9800',
      mallName: '네이버스토어',
      productId: `mock-${query}-2`,
      productType: '1',
      brand: query,
      maker: query,
      category1: '식품',
      category2: '음료',
      category3: '생수',
      category4: '',
    },
    {
      title: `${query} 330ml x 20개 미니팩`,
      link: 'https://search.shopping.naver.com',
      image: 'https://images.unsplash.com/photo-1611070506504-fd13a47b7929?w=200',
      lprice: '6900',
      hprice: '8500',
      mallName: '11번가',
      productId: `mock-${query}-3`,
      productType: '1',
      brand: query,
      maker: query,
      category1: '식품',
      category2: '음료',
      category3: '생수',
      category4: '',
    },
  ];

  return { items: mockItems, total: mockItems.length };
}

export function cleanProductTitle(title: string): string {
  return title.replace(/<[^>]*>/g, '').trim();
}
