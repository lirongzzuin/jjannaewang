import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DealCard from '@/components/feed/DealCard';
import AdBanner from '@/components/ads/AdBanner';
import { DealPost } from '@/types';
import { MOCK_USER } from '@/store';
import { share, getTossShareLink } from '@/lib/apps-in-toss';

const MOCK_DEALS: DealPost[] = [
  {
    id: 'd1',
    user_id: 'u1',
    product_id: 'p1',
    title: '삼다수 2L x 12개',
    description: '쿠팡에서 삼다수 역대급 특가 떴어요ㅠㅠ 오늘만 이 가격인 거 같아요. 얼른요!!',
    original_price: 12000,
    deal_price: 7900,
    shop_name: '쿠팡',
    shop_url: 'https://coupang.com',
    affiliate_url: null,
    fire_count: 312,
    bought_count: 89,
    is_expired: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u1', nickname: '절약왕김씨', level: 7 },
    product: { id: 'p1', naver_product_id: null, name: '삼다수 2L x 12개', brand: '삼다수', category: '생수', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200', lowest_price_ever: 7900, lowest_price_date: null, current_lowest_price: 7900, current_lowest_shop: '쿠팡', tracking_count: 1842, created_at: '', updated_at: '' },
    my_reaction: null,
  },
  {
    id: 'd2',
    user_id: 'u2',
    product_id: 'p3',
    title: '신라면 120g x 20개 박스',
    description: '네이버스토어 신라면 박스 특가. 단위가격 계산해보면 편의점의 절반이에요ㄷㄷ',
    original_price: 16000,
    deal_price: 10900,
    shop_name: '네이버스토어',
    shop_url: 'https://smartstore.naver.com',
    affiliate_url: null,
    fire_count: 201,
    bought_count: 56,
    is_expired: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u2', nickname: '라면러버', level: 5 },
    product: { id: 'p3', naver_product_id: null, name: '신라면 120g x 20개', brand: '농심', category: '라면', image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200', lowest_price_ever: 10900, lowest_price_date: null, current_lowest_price: 10900, current_lowest_shop: '네이버스토어', tracking_count: 2567, created_at: '', updated_at: '' },
    my_reaction: null,
  },
  {
    id: 'd3',
    user_id: 'u3',
    product_id: 'p6',
    title: '맥심 모카골드 커피믹스 100개입',
    description: '쿠팡에 다시 올라왔어요. 쿠폰 적용하면 더 싸집니다!',
    original_price: 16900,
    deal_price: 11500,
    shop_name: '쿠팡',
    shop_url: 'https://coupang.com',
    affiliate_url: null,
    fire_count: 178,
    bought_count: 43,
    is_expired: false,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u3', nickname: '커피중독자', level: 4 },
    product: { id: 'p6', naver_product_id: null, name: '맥심 모카골드 100개입', brand: '동서식품', category: '커피', image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200', lowest_price_ever: 11500, lowest_price_date: null, current_lowest_price: 11500, current_lowest_shop: '쿠팡', tracking_count: 2134, created_at: '', updated_at: '' },
    my_reaction: null,
  },
  {
    id: 'd4',
    user_id: 'u4',
    product_id: 'p5',
    title: '크리넥스 3겹 화장지 30롤',
    description: '화장지 가격이 올랐던 거 다들 기억하시죠ㅠ 다시 내렸어요! 이마트몰 특가',
    original_price: 26000,
    deal_price: 18900,
    shop_name: '이마트몰',
    shop_url: 'https://emart.com',
    affiliate_url: null,
    fire_count: 145,
    bought_count: 38,
    is_expired: false,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u4', nickname: '절약 고수', level: 6 },
    product: { id: 'p5', naver_product_id: null, name: '크리넥스 3겹 화장지 30롤', brand: '크리넥스', category: '화장지', image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=200', lowest_price_ever: 18900, lowest_price_date: null, current_lowest_price: 18900, current_lowest_shop: '이마트몰', tracking_count: 1456, created_at: '', updated_at: '' },
    my_reaction: null,
  },
  {
    id: 'd5',
    user_id: 'u5',
    product_id: null,
    title: '올리브영 세일 기간 할인 품목 공유',
    description: '올리브영 정기세일 기간이에요. 미리 카트에 담아두세요. 헤어팩이랑 마스크팩 위주로 담으면 이득!',
    original_price: null,
    deal_price: 0,
    shop_name: '올리브영',
    shop_url: 'https://oliveyoung.co.kr',
    affiliate_url: null,
    fire_count: 267,
    bought_count: 0,
    is_expired: false,
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u5', nickname: '뷰티짠돌이', level: 5 },
    product: undefined,
    my_reaction: 'fire',
  },
];

const CATEGORIES = [
  { id: 'all', label: '전체', emoji: '🔥' },
  { id: 'food', label: '식품', emoji: '🍜' },
  { id: 'living', label: '생활', emoji: '🏠' },
  { id: 'beauty', label: '뷰티', emoji: '💄' },
  { id: 'digital', label: '디지털', emoji: '📱' },
];

export default function Feed() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [deals, setDeals] = useState(MOCK_DEALS);

  const handleFire = (dealId: string) => {
    setDeals(prev => prev.map(d =>
      d.id === dealId
        ? { ...d, fire_count: d.my_reaction === 'fire' ? d.fire_count - 1 : d.fire_count + 1, my_reaction: d.my_reaction === 'fire' ? null : 'fire' }
        : d
    ));
  };

  const handleShare = async (deal: DealPost) => {
    const url = `${window.location.origin}/feed`;
    const link = await getTossShareLink(url);
    await share({
      message: `[짠내왕 특가] ${deal.title} — ${deal.shop_name}에서 ${deal.deal_price ? `₩${deal.deal_price.toLocaleString()}` : '특가'} 발견! 👑\n${link}`,
    });
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-extrabold text-slate-900">특가 피드</h1>
          <button className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-[16px]">flag</span>
            신고
          </button>
        </div>
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeCategory === cat.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span className="text-sm">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* Feed */}
      <div className="p-4 space-y-4">
        {deals.map((deal, i) => (
          <div key={deal.id} className="space-y-4">
            <DealCard deal={deal} onFire={handleFire} onShare={handleShare} />
            {/* In-feed ad after every 4th deal */}
            {(i + 1) % 4 === 0 && <AdBanner options={{ variant: "card" }} />}
          </div>
        ))}
      </div>

      {/* FAB — 특가 제보 */}
      <div className="fixed bottom-24 right-4 z-30">
        <button
          onClick={() => navigate('/feed/write')}
          className="w-14 h-14 bg-primary rounded-full shadow-xl shadow-primary/40 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="특가 제보하기"
        >
          <span className="material-symbols-outlined text-white text-[28px]">add</span>
        </button>
      </div>
    </div>
  );
}
