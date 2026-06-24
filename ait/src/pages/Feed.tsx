import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import DealCard from '@/components/feed/DealCard';
import AdBanner from '@/components/ads/AdBanner';
import EmptyState from '@/components/ui/EmptyState';
import { DealPost } from '@/types';
import { api } from '@/lib/api';
import { share, getTossShareLink } from '@/lib/apps-in-toss';

interface FeedResponse {
  deals: DealPost[];
  total: number;
  page: number;
  limit: number;
}

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

  const { data, error, isLoading, mutate } = useSWR<FeedResponse>(
    `/api/feed?page=1&category=${activeCategory}`,
    (path: string) => api.get<FeedResponse>(path)
  );

  const deals = data?.deals ?? [];

  const handleFire = async (dealId: string) => {
    if (!data) return;
    // Optimistic toggle.
    mutate(
      {
        ...data,
        deals: data.deals.map((d) =>
          d.id === dealId
            ? {
                ...d,
                fire_count: d.my_reaction === 'fire' ? d.fire_count - 1 : d.fire_count + 1,
                my_reaction: d.my_reaction === 'fire' ? null : 'fire',
              }
            : d,
        ),
      },
      { revalidate: false },
    );
    try {
      await api.post(`/api/feed/${dealId}/react`, { type: 'fire' });
    } catch {
      mutate(); // revert/refresh on failure
    }
  };

  const handleBought = async (dealId: string) => {
    try {
      await api.post(`/api/feed/${dealId}/react`, { type: 'bought' });
      mutate();
    } catch {
      /* ignore */
    }
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
      {isLoading ? (
        <div className="flex justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-300">progress_activity</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-slate-400">불러오지 못했어요</p>
          <button
            onClick={() => mutate()}
            className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold"
          >
            다시 시도
          </button>
        </div>
      ) : deals.length === 0 ? (
        <EmptyState
          icon="local_fire_department"
          title="아직 등록된 특가가 없어요"
          description="가장 먼저 특가를 제보하고 🚩 첫 제보자 배지 + 50 EXP를 받아보세요!"
          ctaLabel="특가 제보하기"
          ctaTo="/feed/write"
        />
      ) : (
        <div className="p-4 space-y-4">
          {deals.map((deal, i) => (
            <div key={deal.id} className="space-y-4">
              <DealCard deal={deal} onFire={handleFire} onBought={handleBought} onShare={handleShare} />
              {/* In-feed ad after every 4th deal */}
              {(i + 1) % 4 === 0 && <AdBanner options={{ variant: "card" }} />}
            </div>
          ))}
        </div>
      )}

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
