import { useState, useMemo } from 'react';
import { Link } from "react-router-dom";
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import DailyBriefing from '@/components/home/DailyBriefing';
import { formatPrice, getDiscountRate } from '@/lib/utils';
import { DealPost, Tip, TipCategory, User, UserTracking, TIP_CATEGORIES } from '@/types';

interface FeedResponse { deals: DealPost[]; total: number; page: number; limit: number }
interface TipsResponse { tips: Tip[]; total: number; page: number; limit: number }
interface TrackingResponse { trackings: UserTracking[] }
interface MeResponse {
  user: User;
  badges: unknown[];
  stats: { savedThisMonth: number; trackingCount: number; dealCount: number; tipCount: number };
}

const KEYWORDS = ['생수', '기저귀', '라면', '세제', '화장지', '커피'];

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <span className="material-symbols-outlined animate-spin text-2xl text-slate-300">progress_activity</span>
    </div>
  );
}
const catEmoji = (c: TipCategory) => TIP_CATEGORIES.find((x) => x.id === c)?.emoji ?? '🍯';
const catLabel = (c: TipCategory) => TIP_CATEGORIES.find((x) => x.id === c)?.label ?? '꿀팁';

export default function Home() {
  const user = useAppStore((s) => s.user);
  const isLoggedIn = !!user;
  const [firedDeals, setFiredDeals] = useState<Set<string>>(new Set());

  const { data: feedData, isLoading: feedLoading } = useSWR<FeedResponse>(
    '/api/feed?page=1', (p: string) => api.get<FeedResponse>(p));
  const { data: tipsData, isLoading: tipsLoading } = useSWR<TipsResponse>(
    '/api/tips?sort=popular', (p: string) => api.get<TipsResponse>(p));
  const { data: meData } = useSWR<MeResponse>(
    isLoggedIn ? '/api/me' : null, (p: string) => api.get<MeResponse>(p));
  const { data: trackingData, isLoading: trackingLoading } = useSWR<TrackingResponse>(
    isLoggedIn ? '/api/tracking' : null, (p: string) => api.get<TrackingResponse>(p));

  const savedThisMonth = meData?.stats.savedThisMonth ?? user?.total_saved_amount ?? 0;
  const deals = (feedData?.deals ?? []).slice(0, 6);
  const tips = (tipsData?.tips ?? []).slice(0, 3);
  const allTrackings = trackingData?.trackings ?? [];
  const trackings = allTrackings.slice(0, 3);
  const avatarInitial = user?.nickname?.[0] ?? '?';
  const monthLabel = useMemo(() => {
    const d = new Date();
    return `${d.getMonth() + 1}월`;
  }, []);

  const toggleFire = (id: string) => {
    const willFire = !firedDeals.has(id);
    setFiredDeals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    api.post(`/api/feed/${id}/react`, { type: 'fire' }).catch(() => {
      setFiredDeals((prev) => {
        const next = new Set(prev);
        if (willFire) next.delete(id); else next.add(id);
        return next;
      });
    });
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👑</span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">짠내왕</h1>
        </div>
        <Link to="/profile" aria-label="내 정보">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {avatarInitial}
          </div>
        </Link>
      </header>

      <div className="space-y-7 pt-5 pb-4">
        {/* 1. PRIMARY — 검색해서 추적 시작 (가장 크고 눈에 띄게) */}
        <section className="px-4">
          <h2 className="text-[22px] font-extrabold text-slate-900 leading-snug">
            어떤 물건,<br />가장 쌀 때 사고 싶으세요?
          </h2>
          <p className="mt-2 text-[15px] text-slate-500">상품을 검색해 가격을 추적해 보세요.</p>

          <Link
            to="/search"
            className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-primary bg-white px-5 py-4 shadow-sm active:scale-[0.99] transition"
          >
            <span className="material-symbols-outlined text-primary text-[30px]">search</span>
            <span className="flex-1 text-[16px] font-bold text-slate-400">
              상품 검색 (예: 생수, 기저귀)
            </span>
            <span className="rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-slate-900">검색</span>
          </Link>

          {/* 인기 검색어 — 누르면 바로 검색 */}
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {KEYWORDS.map((k) => (
              <Link
                key={k}
                to={`/search?q=${encodeURIComponent(k)}`}
                className="flex-none rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600"
              >
                {k}
              </Link>
            ))}
          </div>
        </section>

        {/* 2. 이렇게 써요 — 3단계 (직관성, 중장년층 배려) */}
        <section className="px-4">
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <p className="text-[15px] font-extrabold text-slate-800 mb-3">짠내왕, 이렇게 써요</p>
            <div className="flex items-start">
              {[
                { n: '1', icon: 'search', label: '상품 검색' },
                { n: '2', icon: 'visibility', label: '추적 시작' },
                { n: '3', icon: 'notifications_active', label: '가격 내리면\n알림' },
              ].map((s, i) => (
                <div key={s.n} className="flex flex-1 items-start">
                  <div className="flex flex-1 flex-col items-center text-center">
                    <div className="relative mb-1.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <span className="material-symbols-outlined text-primary text-[28px]">{s.icon}</span>
                      <span className="absolute -top-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-slate-900">
                        {s.n}
                      </span>
                    </div>
                    <p className="whitespace-pre-line text-[13px] font-bold text-slate-700 leading-tight">{s.label}</p>
                  </div>
                  {i < 2 && <span className="material-symbols-outlined mt-4 text-slate-300">chevron_right</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. 내가 지켜보는 상품 */}
        <section>
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-lg font-extrabold text-slate-900">👀 내가 지켜보는 상품</h2>
            {trackings.length > 0 && (
              <Link to="/tracking" className="text-sm text-primary font-bold flex items-center">
                전체보기 <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </Link>
            )}
          </div>
          {isLoggedIn && trackingLoading ? (
            <Spinner />
          ) : trackings.length > 0 ? (
            <div className="bg-white border-t border-b border-slate-100">
              {trackings.map((item) => {
                const cur = item.product?.current_lowest_price ?? null;
                const met = cur != null && item.target_price != null && cur <= item.target_price;
                return (
                  <Link key={item.id} to={`/product/${item.product_id}`}>
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-50">
                      <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="material-symbols-outlined text-slate-300">image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-slate-800 truncate">{item.product?.name ?? '상품'}</p>
                        <div className="mt-0.5 flex items-baseline gap-2">
                          <span className={`text-lg font-extrabold ${met ? 'text-green-600' : 'text-primary'}`}>
                            {cur != null ? formatPrice(cur) : '가격 확인 중'}
                          </span>
                          {item.target_price != null && (
                            <span className="text-xs text-slate-400">목표 {formatPrice(item.target_price)}</span>
                          )}
                        </div>
                      </div>
                      {met && (
                        <span className="rounded-full bg-green-500 px-2 py-1 text-[11px] font-bold text-white">
                          목표 달성!
                        </span>
                      )}
                      <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-4">
              <Link
                to="/search"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-white px-4 py-7 text-center"
              >
                <span className="material-symbols-outlined text-primary text-[34px]">add_circle</span>
                <p className="text-[16px] font-extrabold text-slate-800">추적할 상품 추가하기</p>
                <p className="text-[13px] text-slate-500">상품을 검색하고 “감시 시작”을 누르면 끝!</p>
              </Link>
            </div>
          )}
        </section>

        {/* 4. 오늘의 특가 */}
        <section>
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-lg font-extrabold text-slate-900">🔥 오늘의 특가</h2>
            <Link to="/feed" className="text-sm text-primary font-bold flex items-center">
              전체보기 <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          </div>
          {feedLoading ? (
            <Spinner />
          ) : deals.length === 0 ? (
            <div className="px-4">
              <Link to="/feed/write" className="block rounded-xl bg-white border border-slate-100 px-4 py-4 text-[14px] font-semibold text-slate-500">
                아직 특가가 없어요. 가장 먼저 제보하면 보상을 받아요!
              </Link>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
              {deals.map((deal) => {
                const discount = deal.original_price && deal.original_price > deal.deal_price
                  ? getDiscountRate(deal.original_price, deal.deal_price) : null;
                return (
                  <Link
                    key={deal.id}
                    to={deal.product_id ? `/product/${deal.product_id}` : '/feed'}
                    className="flex-none w-44 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                  >
                    <div className="relative">
                      {deal.product?.image_url ? (
                        <img src={deal.product.image_url} alt={deal.title} className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-32 bg-slate-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl text-slate-300">image</span>
                        </div>
                      )}
                      {discount !== null && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-extrabold px-2 py-0.5 rounded">
                          -{discount}%
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); toggleFire(deal.id); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center"
                        aria-label="불"
                      >
                        <span className={`material-symbols-outlined text-[18px] ${firedDeals.has(deal.id) ? 'text-orange-500 fill-icon' : 'text-slate-400'}`}>
                          local_fire_department
                        </span>
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] text-slate-400 font-medium">{deal.shop_name}</p>
                      <p className="text-[13px] font-bold text-slate-900 leading-snug mb-1 line-clamp-2">{deal.title}</p>
                      <p className="text-primary font-extrabold text-base">{formatPrice(deal.deal_price)}</p>
                      {deal.original_price !== null && (
                        <p className="text-[11px] text-slate-400 line-through">{formatPrice(deal.original_price)}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. 인기 꿀팁 */}
        <section>
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-lg font-extrabold text-slate-900">🍯 인기 절약 꿀팁</h2>
            <Link to="/tips" className="text-sm text-primary font-bold flex items-center">
              전체보기 <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          </div>
          {tipsLoading ? (
            <Spinner />
          ) : tips.length === 0 ? (
            <div className="px-4">
              <Link to="/tips/write" className="block rounded-xl bg-white border border-slate-100 px-4 py-4 text-[14px] font-semibold text-slate-500">
                아직 꿀팁이 없어요. 첫 꿀팁을 남겨보세요!
              </Link>
            </div>
          ) : (
            <div className="space-y-3 px-4">
              {tips.map((tip) => (
                <Link key={tip.id} to={`/tips/${tip.id}`}>
                  <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                      {catEmoji(tip.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {catLabel(tip.category)}
                      </span>
                      <p className="mt-1 text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">{tip.title}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 6. 내 절약 요약 (보조) */}
        {isLoggedIn && (
          <section className="px-4">
            <Link to="/profile" className="block rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#ffb700,#FF9500)' }}>
              <p className="text-white/85 text-sm font-medium">{monthLabel} 내가 아낀 돈</p>
              <p className="text-3xl font-extrabold mt-1">{formatPrice(savedThisMonth)}</p>
              <p className="text-white/85 text-xs mt-2">
                절약 기록을 남기면 누적되고, 또래와 순위도 비교돼요 →
              </p>
            </Link>
          </section>
        )}

        {/* 오늘의 짠내 브리핑 (출석·또래비교·오늘의 꿀팁) */}
        <DailyBriefing />
      </div>
    </div>
  );
}
