import { useState } from 'react';
import { Link } from "react-router-dom";
import TipCard from '@/components/tips/TipCard';
import DisclaimerBanner from '@/components/ui/DisclaimerBanner';
import { TIP_CATEGORIES, Tip, TipCategory } from '@/types';
import { MOCK_USER } from '@/store';

const MOCK_TIPS: Tip[] = [
  {
    id: 'tip1',
    user_id: 'u1',
    title: '카드사 생활비 캐시백 총정리 (2026년 2월 최신)',
    body: '현대카드 ZERO, KB국민 MY WE:SH, 신한 딥드림 카드 비교해봤어요. 마트/편의점 캐시백은 현대 ZERO가 압도적...',
    category: 'benefit' as TipCategory,
    tags: ['카드', '캐시백', '생활비'],
    link_url: null,
    image_urls: [],
    upvote_count: 2341,
    downvote_count: 12,
    comment_count: 89,
    scrap_count: 445,
    view_count: 12890,
    is_hot: true,
    is_blinded: false,
    report_count: 0,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u1', nickname: '절약고수', level: 8 },
  },
  {
    id: 'tip2',
    user_id: 'u2',
    title: '토스뱅크 파킹통장으로 월 2만원 이자 받는 법',
    body: '500만원 넣어두면 세후 연 2.0%. 자유입출금인데 이자 주는 게 레전드. 단, 잔액 1억 초과분은 이자율 다름',
    category: 'deposit' as TipCategory,
    tags: ['토스뱅크', '파킹통장', '이자'],
    link_url: null,
    image_urls: [],
    upvote_count: 1829,
    downvote_count: 8,
    comment_count: 62,
    scrap_count: 312,
    view_count: 9234,
    is_hot: true,
    is_blinded: false,
    report_count: 0,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u2', nickname: '짠테크마스터', level: 7 },
  },
  {
    id: 'tip3',
    user_id: 'u3',
    title: '편의점 앱 쿠폰 겹치기로 공짜 커피 뽑는 방법',
    body: 'GS25 + 우리카드 할인 + 쿠폰 합산하면 결과적으로 -700원이 됨ㅋㅋ 진짜임. 매달 커피값 0원 달성 중',
    category: 'saving' as TipCategory,
    tags: ['편의점', '쿠폰', '커피'],
    link_url: null,
    image_urls: [],
    upvote_count: 1204,
    downvote_count: 6,
    comment_count: 45,
    scrap_count: 189,
    view_count: 7823,
    is_hot: false,
    is_blinded: false,
    report_count: 0,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u3', nickname: '쿠폰킹', level: 6 },
  },
  {
    id: 'tip4',
    user_id: 'u4',
    title: '이번달 생활비 32만원으로 살아남기 성공 후기',
    body: '1인 가구 기준 식비 12만원, 교통비 4만원, 통신비 1.2만원으로 버팀. 가장 큰 절약은 점심 직접 싸가기...',
    category: 'humor' as TipCategory,
    tags: ['생활비', '1인가구', '후기'],
    link_url: null,
    image_urls: [],
    upvote_count: 987,
    downvote_count: 15,
    comment_count: 78,
    scrap_count: 134,
    view_count: 6234,
    is_hot: false,
    is_blinded: false,
    report_count: 0,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u4', nickname: '거지왕', level: 5 },
  },
  {
    id: 'tip5',
    user_id: 'u5',
    title: 'ETF 초보자 가이드: KODEX 200 vs TIGER 미국S&P500',
    body: '장기 투자 관점에서 비교해봤습니다. 환 헤지 여부, 운용보수 차이, 배당 재투자 방식 등...',
    category: 'invest' as TipCategory,
    tags: ['ETF', '주식', '투자입문'],
    link_url: null,
    image_urls: [],
    upvote_count: 756,
    downvote_count: 23,
    comment_count: 34,
    scrap_count: 201,
    view_count: 5123,
    is_hot: false,
    is_blinded: false,
    report_count: 0,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u5', nickname: '재테크교수', level: 9 },
  },
];

const SORT_OPTIONS = [
  { id: 'popular', label: '인기순' },
  { id: 'new', label: '최신순' },
  { id: 'recommend', label: '추천순' },
];

export default function Tips() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('popular');

  const filtered = MOCK_TIPS.filter(tip => {
    if (activeCategory === 'all') return true;
    return tip.category === activeCategory;
  });

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

        <div className="space-y-3 px-4">
          {filtered.map(tip => (
            <TipCard key={tip.id} tip={tip} />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <span className="text-6xl mb-3">🍯</span>
              <p className="text-sm font-medium text-slate-400">아직 꿀팁이 없어요</p>
              <Link to="/tips/write">
                <button className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold">
                  첫 꿀팁 남기기
                </button>
              </Link>
            </div>
          )}
        </div>
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
