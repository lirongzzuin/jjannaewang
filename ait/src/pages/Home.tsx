import { useState, useMemo } from 'react';
import { Link } from "react-router-dom";
import MiniSparkline from '@/components/charts/MiniSparkline';
import { formatPrice, getLevelInfo, getNextLevelExp, formatMonth, getCurrentMonth } from '@/lib/utils';
import { MOCK_USER } from '@/store';

const MOCK_HOT_DEALS = [
  {
    id: '1',
    title: '삼다수 2L x 12개',
    shop: '쿠팡',
    price: 7900,
    original: 12000,
    discount: 34,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
    fire: 312,
  },
  {
    id: '2',
    title: '신라면 120g x 20개',
    shop: '네이버스토어',
    price: 10900,
    original: 16000,
    discount: 32,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200',
    fire: 201,
  },
  {
    id: '3',
    title: '맥심 커피믹스 100개입',
    shop: '쿠팡',
    price: 11500,
    original: 16900,
    discount: 32,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200',
    fire: 178,
  },
  {
    id: '4',
    title: '피죤 세탁세제 5L',
    shop: '11번가',
    price: 8900,
    original: 14500,
    discount: 39,
    image: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=200',
    fire: 145,
  },
];

const MOCK_TRACKED = [
  {
    id: 'p1',
    name: '하기스 매직팬티 4단계',
    currentPrice: 31500,
    targetPrice: 28000,
    sparkline: [35000, 33500, 32000, 32500, 31800, 31500],
    change: -1800,
    shop: '네이버스토어',
  },
  {
    id: 'p2',
    name: '크리넥스 화장지 30롤',
    currentPrice: 21000,
    targetPrice: 19000,
    sparkline: [24000, 22500, 22000, 21500, 21000, 21000],
    change: -1000,
    shop: '이마트몰',
  },
  {
    id: 'p3',
    name: '삼다수 2L x 12개',
    currentPrice: 8900,
    targetPrice: 7500,
    sparkline: [9500, 9200, 9000, 8900, 8900, 8900],
    change: -300,
    shop: '쿠팡',
  },
];

const MOCK_POPULAR_TIPS = [
  {
    id: 't1',
    title: '카드사 생활비 캐시백 총정리 (2026년 최신)',
    author: '절약고수',
    level: 8,
    likes: 2341,
    category: '숨은 혜택',
    emoji: '🎁',
    time: '3시간 전',
  },
  {
    id: 't2',
    title: '토스뱅크 파킹통장으로 월 2만원 이자 받는 법',
    author: '짠테크마스터',
    level: 7,
    likes: 1829,
    category: '예적금/금리',
    emoji: '🏦',
    time: '5시간 전',
  },
  {
    id: 't3',
    title: '편의점 앱 쿠폰 겹치기로 공짜 커피 뽑는 방법',
    author: '쿠폰킹',
    level: 6,
    likes: 1204,
    category: '짠테크',
    emoji: '💰',
    time: '8시간 전',
  },
];

const DAILY_MISSIONS = [
  { label: '앱 방문', exp: 10, done: true },
  { label: '상품 추적 1개', exp: 20, done: true },
  { label: '딜 제보', exp: 30, done: false },
  { label: '꿀팁 읽기', exp: 10, done: false },
];

export default function Home() {
  const user = MOCK_USER;
  const levelInfo = getLevelInfo(user.level);
  const nextLevelExp = getNextLevelExp(user.level);
  const prevLevelMinExp = getLevelInfo(Math.max(1, user.level - 1))?.minExp ?? 0;
  const expProgress = Math.min(100, Math.round(((user.exp - prevLevelMinExp) /
    (nextLevelExp - prevLevelMinExp)) * 100));

  const currentMonthLabel = useMemo(() => formatMonth(getCurrentMonth()), []);

  const [firedDeals, setFiredDeals] = useState<Set<string>>(new Set());

  const toggleFire = (id: string) => {
    setFiredDeals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
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
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-600">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <Link to="/profile">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user.nickname[0]}
            </div>
          </Link>
        </div>
      </header>

      <div className="space-y-5 py-4">
        {/* Monthly savings card */}
        <div className="mx-4">
          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #ffb700 0%, #FF9500 100%)' }}
          >
            {/* Background decoration */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute right-8 bottom-0 w-20 h-20 bg-white/10 rounded-full translate-y-6"></div>

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/80 text-xs font-medium mb-1">{currentMonthLabel} 누적 절약</p>
                  <p className="text-3xl font-extrabold text-white">
                    {formatPrice(user.total_saved_amount)}
                  </p>
                  <p className="text-white/80 text-xs mt-1">목표: ₩2,000,000</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl mb-1">
                    {levelInfo.icon}
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    Lv.{user.level} {levelInfo.title}
                  </span>
                </div>
              </div>

              {/* EXP bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[11px] text-white/80 mb-1">
                  <span>EXP {user.exp.toLocaleString()}</span>
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
                  <span className="text-xs font-bold">{user.streak_days}일 연속 접속</span>
                </div>
                <Link to="/premium">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-white/90 underline underline-offset-2">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    PRO 업그레이드
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Missions */}
        <div className="mx-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-700">오늘의 미션</h2>
            <span className="text-xs text-slate-400">
              {DAILY_MISSIONS.filter(m => m.done).length}/{DAILY_MISSIONS.length} 완료
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {DAILY_MISSIONS.map((mission, i) => (
              <div
                key={i}
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
        </div>

        {/* Hot Deals */}
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-base font-extrabold text-slate-900">오늘의 특가</h2>
            <Link to="/feed" className="text-xs text-primary font-bold flex items-center gap-0.5">
              전체보기
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
            {MOCK_HOT_DEALS.map((deal) => (
              <div
                key={deal.id}
                className="flex-none w-40 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="relative">
                  <img src={deal.image} alt={deal.title} className="w-full h-32 object-cover" />
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                    -{deal.discount}%
                  </div>
                  <button
                    onClick={() => toggleFire(deal.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${firedDeals.has(deal.id) ? 'text-orange-500 fill-icon' : 'text-slate-400'}`}>
                      local_fire_department
                    </span>
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-slate-400 font-medium">{deal.shop}</p>
                  <p className="text-xs font-bold text-slate-900 leading-snug mb-2 line-clamp-2">{deal.title}</p>
                  <p className="text-primary font-extrabold text-sm">{formatPrice(deal.price)}</p>
                  <p className="text-[10px] text-slate-400 line-through">{formatPrice(deal.original)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-orange-400 text-[14px]">local_fire_department</span>
                    <span className="text-[10px] font-semibold text-slate-500">{deal.fire}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
          <div className="space-y-0 bg-white border-t border-b border-slate-100">
            {MOCK_TRACKED.map((item) => (
              <Link key={item.id} to={`/product/${item.id}`}>
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 truncate">{item.shop}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-primary font-bold">{formatPrice(item.currentPrice)}</span>
                      <span className="text-[10px] text-slate-400">목표 {formatPrice(item.targetPrice)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <MiniSparkline data={item.sparkline} />
                    <span className="text-xs font-bold text-green-600">
                      ▼ {Math.abs(item.change).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
          <div className="space-y-3 px-4">
            {MOCK_POPULAR_TIPS.map((tip) => (
              <Link key={tip.id} to={`/tips/${tip.id}`}>
                <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                    {tip.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {tip.category}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-snug mb-1 line-clamp-2">{tip.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{tip.author} · Lv.{tip.level}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px] text-red-400">favorite</span>
                        {tip.likes.toLocaleString()}
                      </span>
                      <span>·</span>
                      <span>{tip.time}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
