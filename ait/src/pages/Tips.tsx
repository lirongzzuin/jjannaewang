import { useState } from 'react';
import { Link } from "react-router-dom";
import useSWR from 'swr';
import TipCard from '@/components/tips/TipCard';
import DisclaimerBanner from '@/components/ui/DisclaimerBanner';
import EmptyState from '@/components/ui/EmptyState';
import { TIP_CATEGORIES, Tip } from '@/types';
import { api } from '@/lib/api';

interface TipsResponse {
  tips: Tip[];
  total: number;
  page: number;
  limit: number;
}

const SORT_OPTIONS = [
  { id: 'popular', label: '인기순' },
  { id: 'recent', label: '최신순' },
];

export default function Tips() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('popular');

  const { data, error, isLoading, mutate } = useSWR<TipsResponse>(
    `/api/tips?category=${activeCategory}&sort=${activeSort}&page=1`,
    (path: string) => api.get<TipsResponse>(path)
  );

  const tips = data?.tips ?? [];

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-extrabold text-slate-900">꿀팁 게시판 🍯</h1>
          <Link to="/tips/write">
            <button className="flex items-center gap-1 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl">
              <span className="material-symbols-outlined text-[16px]">edit</span>
              글쓰기
            </button>
          </Link>
        </div>
        {/* Category tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto no-scrollbar">
          {TIP_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeCategory === cat.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
        {/* Sort options */}
        <div className="flex items-center gap-2 px-4 pb-3">
          {SORT_OPTIONS.map(sort => (
            <button
              key={sort.id}
              onClick={() => setActiveSort(sort.id)}
              className={`text-xs font-bold transition-colors ${
                activeSort === sort.id ? 'text-primary' : 'text-slate-400'
              }`}
            >
              {sort.label}
              {activeSort === sort.id && <span className="ml-1">·</span>}
            </button>
          ))}
        </div>
      </header>

      <div className="py-4">
        <DisclaimerBanner />

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
        ) : tips.length === 0 ? (
          <EmptyState
            icon="lightbulb"
            title="아직 등록된 꿀팁이 없어요"
            description="이 분야의 첫 꿀팁을 남기고 🍯 첫 꿀팁러 배지 + 30 EXP를 받아보세요!"
            ctaLabel="꿀팁 작성하기"
            ctaTo="/tips/write"
          />
        ) : (
          <div className="space-y-3 px-4">
            {tips.map(tip => (
              <TipCard key={tip.id} tip={tip} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 right-4 z-30">
        <Link to="/tips/write">
          <button className="w-14 h-14 bg-primary rounded-full shadow-xl shadow-primary/40 flex items-center justify-center active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-white text-[28px]">edit</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
