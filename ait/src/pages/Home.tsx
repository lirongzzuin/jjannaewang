import { useState, useMemo } from 'react';
import { Link } from "react-router-dom";
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import DailyBriefing from '@/components/home/DailyBriefing';
import {
  formatPrice,
  getLevelInfo,
  getNextLevelExp,
  formatMonth,
  getCurrentMonth,
  getDiscountRate,
} from '@/lib/utils';
import {
  DealPost,
  Tip,
  TipCategory,
  User,
  UserTracking,
  TIP_CATEGORIES,
} from '@/types';

interface FeedResponse {
  deals: DealPost[];
  total: number;
  page: number;
  limit: number;
}

interface TipsResponse {
  tips: Tip[];
  total: number;
  page: number;
  limit: number;
}

interface TrackingResponse {
  trackings: UserTracking[];
}

interface MeStats {
  savedThisMonth: number;
  trackingCount: number;
  dealCount: number;
  tipCount: number;
}

interface MeResponse {
  user: User;
  badges: unknown[];
  stats: MeStats;
}

interface Mission {
  code: string;
  label: string;
  exp: number;
  done: boolean;
}

interface MissionsResponse {
  missions: Mission[];
}

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <span className="material-symbols-outlined animate-spin text-2xl text-slate-300">
        progress_activity
      </span>
    </div>
  );
}

function categoryEmoji(cat: TipCategory): string {
  return TIP_CATEGORIES.find((c) => c.id === cat)?.emoji ?? '🍯';
}

function categoryLabel(cat: TipCategory): string {
  return TIP_CATEGORIES.find((c) => c.id === cat)?.label ?? '꿀팁';
}

export default function Home() {
  const user = useAppStore((s) => s.user);
  const isLoggedIn = !!user;

  const currentMonthLabel = useMemo(() => formatMonth(getCurrentMonth()), []);
  const [firedDeals, setFiredDeals] = useState<Set<string>>(new Set());

  const { data: feedData, isLoading: feedLoading } = useSWR<FeedResponse>(
    '/api/feed?page=1',
    (path: string) => api.get<FeedResponse>(path)
  );
  const { data: tipsData, isLoading: tipsLoading } = useSWR<TipsResponse>(
    '/api/tips?sort=popular',
    (path: string) => api.get<TipsResponse>(path)
  );
  const { data: meData } = useSWR<MeResponse>(
    isLoggedIn ? '/api/me' : null,
    (path: string) => api.get<MeResponse>(path)
  );
  const { data: missionsData, isLoading: missionsLoading } = useSWR<MissionsResponse>(
    isLoggedIn ? '/api/me/missions' : null,
    (path: string) => api.get<MissionsResponse>(path)
  );
  const { data: trackingData, isLoading: trackingLoading } = useSWR<TrackingResponse>(
    isLoggedIn ? '/api/tracking' : null,
    (path: string) => api.get<TrackingResponse>(path)
  );

  // Prefer fresh /api/me data for the hero card, fall back to the store user.
  const heroUser: User | null = meData?.user ?? user;
  const savedThisMonth = meData?.stats.savedThisMonth ?? heroUser?.total_saved_amount ?? 0;

  const levelInfo = heroUser ? getLevelInfo(heroUser.level) : null;
  const nextLevelExp = heroUser ? getNextLevelExp(heroUser.level) : 0;
  const prevLevelMinExp = heroUser
    ? getLevelInfo(Math.max(1, heroUser.level - 1))?.minExp ?? 0
    : 0;
  const expProgress = heroUser
    ? Math.min(
        100,
        Math.round(
          ((heroUser.exp - prevLevelMinExp) /
            Math.max(1, nextLevelExp - prevLevelMinExp)) *
            100
        )
      )
    : 0;

  const missions = missionsData?.missions ?? [];
  const doneCount = missions.filter((m) => m.done).length;

  const deals = (feedData?.deals ?? []).slice(0, 6);
  const tips = (tipsData?.tips ?? []).slice(0, 3);
  const trackings = (trackingData?.trackings ?? []).slice(0, 3);

  const toggleFire = (id: string) => {
    setFiredDeals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const avatarInitial = user?.nickname?.[0] ?? '?';

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👑</span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">짠내왕</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-600">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <Link to="/profile">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {avatarInitial}
            </div>
          </Link>
        </div>
      </header>

      <div className="space-y-5 py-4">
        {/* 오늘의 짠내 브리핑 — daily reason to return */}
        <DailyBriefing />

        {/* Monthly savings card */}
        <div className="mx-4">
          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #ffb700 0%, #FF9500 100%)' }}
          >
            {/* Background decoration */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute right-8 bottom-0 w-20 h-20 bg-white/10 rounded-full translate-y-6"></div>

            {isLoggedIn && heroUser && levelInfo ? (
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white/80 text-xs font-medium mb-1">{currentMonthLabel} 누적 절약</p>
                    <p className="text-3xl font-extrabold text-white">
                      {formatPrice(savedThisMonth)}
                    </p>
                    <p className="text-white/80 text-xs mt-1">목표: ₩2,000,000</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl mb-1">
                      {levelInfo.icon}
                    </div>
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                      Lv.{heroUser.level} {levelInfo.title}
                    </span>
                  </div>
                </div>

                {/* EXP bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-white/80 mb-1">
                    <span>EXP {heroUser.exp.toLocaleString()}</span>
                    <span>다음 레벨 {nextLevelExp.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${expProgress}%` }}
                    />
                  </div>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                    <span className="text-sm">🔥</span>
                    <span className="text-xs font-bold">{heroUser.streak_days}일 연속 접속</span>
                  </div>
                  <Link to="/premium">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-white/90 underline underline-offset-2">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      PRO 업그레이드
                    </div>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="relative">
                <p className="text-white/80 text-xs font-medium mb-1">{currentMonthLabel} 누적 절약</p>
                <p className="text-xl font-extrabold text-white leading-snug mb-2">
                  토스 계정을 연결하는 중이에요
                </p>
                <p className="text-white/80 text-xs">잠시만 기다리면 내 절약 기록이 표시돼요</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Missions */}
        {isLoggedIn && (
          <div className="mx-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-700">오늘의 미션</h2>
              <span className="text-xs text-slate-400">
                {doneCount}/{missions.length} 완료
              </span>
            </div>
            {missionsLoading ? (
              <Spinner />
            ) : missions.length === 0 ? (
              <p className="text-xs text-slate-400">오늘의 미션이 없어요.</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {missions.map((mission) => (
                  <div
                    key={mission.code}
                    className={`flex-none flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 border text-center min-w-[80px] ${
                      mission.done
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${mission.done ? 'text-primary fill-icon' : 'text-slate-400'}`}>
                      {mission.done ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <p className={`text-[10px] font-semibold ${mission.done ? 'text-primary' : 'text-slate-500'}`}>{mission.label}</p>
                    <p className={`text-[10px] font-bold ${mission.done ? 'text-slate-400 line-through' : 'text-primary'}`}>+{mission.exp} EXP</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hot Deals */}
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-base font-extrabold text-slate-900">오늘의 특가</h2>
            <Link to="/feed" className="text-xs text-primary font-bold flex items-center gap-0.5">
              전체보기
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>
          {feedLoading ? (
            <Spinner />
          ) : deals.length === 0 ? (
            <div className="px-4">
              <Link to="/feed/write" className="text-xs text-slate-400">
                아직 특가가 없어요. 1등으로 제보해보세요!
              </Link>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
              {deals.map((deal) => {
                const discount =
                  deal.original_price && deal.original_price > deal.deal_price
                    ? getDiscountRate(deal.original_price, deal.deal_price)
                    : null;
                const imageUrl = deal.product?.image_url ?? null;
                return (
                  <Link
                    key={deal.id}
                    to={deal.product_id ? `/product/${deal.product_id}` : '/feed'}
                    className="flex-none w-40 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                  >
                    <div className="relative">
                      {imageUrl ? (
                        <img src={imageUrl} alt={deal.title} className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-32 bg-slate-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl text-slate-300">image</span>
                        </div>
                      )}
                      {discount !== null && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                          -{discount}%
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFire(deal.id);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center"
                      >
                        <span className={`material-symbols-outlined text-[16px] ${firedDeals.has(deal.id) ? 'text-orange-500 fill-icon' : 'text-slate-400'}`}>
                          local_fire_department
                        </span>
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] text-slate-400 font-medium">{deal.shop_name}</p>
                      <p className="text-xs font-bold text-slate-900 leading-snug mb-2 line-clamp-2">{deal.title}</p>
                      <p className="text-primary font-extrabold text-sm">{formatPrice(deal.deal_price)}</p>
                      {deal.original_price !== null && (
                        <p className="text-[10px] text-slate-400 line-through">{formatPrice(deal.original_price)}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        <span className="material-symbols-outlined text-orange-400 text-[14px]">local_fire_department</span>
                        <span className="text-[10px] font-semibold text-slate-500">{deal.fire_count}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* My Tracked Products */}
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-base font-extrabold text-slate-900">내 추적 목록</h2>
            <Link to="/tracking" className="text-xs text-primary font-bold flex items-center gap-0.5">
              전체보기
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>
          {!isLoggedIn ? (
            <div className="px-4">
              <Link
                to="/search"
                className="flex items-center justify-between bg-white rounded-xl px-4 py-3.5 border border-slate-100 shadow-sm"
              >
                <span className="text-sm font-semibold text-slate-700">상품을 검색해 추적을 시작하세요</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
              </Link>
            </div>
          ) : trackingLoading ? (
            <Spinner />
          ) : trackings.length === 0 ? (
            <div className="px-4">
              <Link
                to="/search"
                className="flex items-center justify-between bg-white rounded-xl px-4 py-3.5 border border-slate-100 shadow-sm"
              >
                <span className="text-sm font-semibold text-slate-700">상품을 추적해보세요</span>
                <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-0 bg-white border-t border-b border-slate-100">
              {trackings.map((item) => (
                <Link key={item.id} to={`/product/${item.product_id}`}>
                  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 truncate">
                        {item.product?.current_lowest_shop ?? '추적 중'}
                      </p>
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item.product?.name ?? '상품'}
                      </p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-primary font-bold">
                          {item.product?.current_lowest_price != null
                            ? formatPrice(item.product.current_lowest_price)
                            : '가격 정보 없음'}
                        </span>
                        {item.target_price != null && (
                          <span className="text-[10px] text-slate-400">목표 {formatPrice(item.target_price)}</span>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Popular Tips */}
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-base font-extrabold text-slate-900">인기 꿀팁</h2>
            <Link to="/tips" className="text-xs text-primary font-bold flex items-center gap-0.5">
              전체보기
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>
          {tipsLoading ? (
            <Spinner />
          ) : tips.length === 0 ? (
            <div className="px-4">
              <Link to="/tips/write" className="text-xs text-slate-400">
                아직 꿀팁이 없어요. 첫 꿀팁을 작성해보세요!
              </Link>
            </div>
          ) : (
            <div className="space-y-3 px-4">
              {tips.map((tip) => (
                <Link key={tip.id} to={`/tips/${tip.id}`}>
                  <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                      {categoryEmoji(tip.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {categoryLabel(tip.category)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-snug mb-1 line-clamp-2">{tip.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>
                          {tip.user?.nickname ?? '익명'}
                          {tip.user?.level != null ? ` · Lv.${tip.user.level}` : ''}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px] text-red-400">favorite</span>
                          {tip.upvote_count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/search">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3 hover:bg-primary/5 transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">search</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">가격 검색</p>
                  <p className="text-[10px] text-slate-400">최저가 추적 시작</p>
                </div>
              </div>
            </Link>
            <Link to="/ranking">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3 hover:bg-primary/5 transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">emoji_events</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">이달의 랭킹</p>
                  <p className="text-[10px] text-slate-400">내 순위 확인</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
