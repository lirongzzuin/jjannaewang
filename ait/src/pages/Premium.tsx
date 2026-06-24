import { useState } from 'react';
import { Link } from "react-router-dom";
import { formatPrice } from '@/lib/utils';
import { PREMIUM_TIERS } from '@/types';
import { useIAP } from '@/hooks/useIAP';
import { useAppStore } from '@/store';

// 무료로 모든 기능을 다 씁니다. 플랜 차이는 토스애드 광고 노출 + 서포터 배지뿐.
const FEATURES: { label: string; free: string; pro: string; master: string; icon: string }[] = [
  { label: '가격 추적 · 목표가 알림', free: '✓', pro: '✓', master: '✓', icon: 'notifications_active' },
  { label: '최저가 검색 · 가격 차트/분석', free: '✓', pro: '✓', master: '✓', icon: 'insights' },
  { label: '특가 제보 · 꿀팁 커뮤니티', free: '✓', pro: '✓', master: '✓', icon: 'groups' },
  { label: '절약 기록 · 랭킹 · 레벨', free: '✓', pro: '✓', master: '✓', icon: 'savings' },
  { label: '추적 슬롯', free: '20개', pro: '100개', master: '무제한', icon: 'visibility' },
  { label: '토스애드 광고', free: '표시', pro: '전면광고 제거', master: '완전 제거', icon: 'ads_click' },
  { label: '서포터 배지', free: '–', pro: '💛', master: '💛', icon: 'volunteer_activism' },
];

export default function Premium() {
  const [selectedTier, setSelectedTier] = useState<'pro' | 'master'>('pro');
  const { status, subscribe } = useIAP();
  const isPurchasing = status === 'pending';
  const { premiumTier, user } = useAppStore();
  const currentTier = premiumTier;

  const expiryLabel = user?.premium_expiry
    ? new Date(user.premium_expiry).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const handleSubscribe = () => {
    const sku = selectedTier === 'pro' ? 'premium_pro_monthly' : 'premium_master_monthly';
    subscribe(sku, () =>
      alert('후원해주셔서 감사해요! 광고가 줄어들고 서포터 배지를 받았어요 💛'),
    );
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <Link to="/profile">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </Link>
        <h1 className="text-base font-bold text-slate-900">서포터 되기</h1>
      </header>

      {/* Hero */}
      <div
        className="px-4 py-8 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #231d0f 0%, #3d3000 100%)' }}
      >
        <div className="text-4xl mb-3">💛</div>
        <h2 className="text-2xl font-extrabold mb-2">짠내왕은 전부 무료예요</h2>
        <p className="text-white/70 text-sm leading-relaxed">
          모든 기능을 무료로 쓸 수 있어요.<br />
          서포터가 되면 <b className="text-white">광고가 줄고</b>, 개발자를 응원할 수 있어요.
        </p>
      </div>

      <div className="px-4 -mt-4">
        {/* Tier selector */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-2 flex gap-2 mb-5">
          {(['pro', 'master'] as const).map((tier) => {
            const info = PREMIUM_TIERS[tier];
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`flex-1 relative py-3 rounded-xl font-bold text-sm transition-all ${
                  selectedTier === tier ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="text-lg mb-0.5">{tier === 'pro' ? '🥈' : '👑'}</div>
                <div>{info.name}</div>
                <div className="text-xs font-medium mt-0.5 opacity-80">월 {formatPrice(info.price)}</div>
              </button>
            );
          })}
        </div>

        {/* Comparison: 무료 vs 선택 플랜 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5 overflow-hidden">
          <div className="grid grid-cols-4 gap-0 bg-slate-50 border-b border-slate-100 py-3">
            <div className="col-span-2 px-4 text-xs font-bold text-slate-500">기능</div>
            <div className="text-center text-xs font-bold text-slate-400">무료</div>
            <div className="text-center text-xs font-bold text-primary">
              {PREMIUM_TIERS[selectedTier].name}
            </div>
          </div>
          {FEATURES.map((f, i) => (
            <div key={i} className="grid grid-cols-4 gap-0 py-3 border-b border-slate-50 last:border-0 items-center">
              <div className="col-span-2 px-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">{f.icon}</span>
                <span className="text-xs font-semibold text-slate-700">{f.label}</span>
              </div>
              <div className="text-center text-xs font-bold text-slate-500">{f.free}</div>
              <div className="text-center text-xs font-bold text-primary">
                {selectedTier === 'pro' ? f.pro : f.master}
              </div>
            </div>
          ))}
        </div>

        {/* Current plan */}
        {currentTier !== 'free' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-green-500 fill-icon">check_circle</span>
            <div>
              <p className="text-sm font-bold text-green-800">
                현재 {PREMIUM_TIERS[currentTier].name} 후원 중 💛
              </p>
              {expiryLabel && <p className="text-xs text-green-600">{expiryLabel} 갱신/만료 예정</p>}
            </div>
          </div>
        )}

        {/* Subscribe */}
        <div className="space-y-3 pb-8">
          <button
            onClick={handleSubscribe}
            disabled={isPurchasing}
            className="w-full py-4 rounded-2xl bg-primary text-slate-900 font-extrabold text-base shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-60"
          >
            {isPurchasing
              ? '처리 중...'
              : `${PREMIUM_TIERS[selectedTier].name} — 월 ${formatPrice(PREMIUM_TIERS[selectedTier].price)} 후원하기`}
          </button>
          <p className="text-center text-[11px] text-slate-400 leading-relaxed">
            앱인토스 인앱결제(자동 갱신 구독)로 처리돼요. 언제든 해지 가능하며, 해지 후에도 기간
            만료까지 혜택이 유지돼요. 무료 플랜으로도 모든 기능을 계속 쓸 수 있어요.
          </p>

          {/* 무료로 슬롯 늘리기 */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <p className="text-sm font-bold text-slate-700 mb-1">무료로 슬롯 늘리기</p>
            <p className="text-xs text-slate-500 mb-3">후원 없이도 추적 슬롯을 늘릴 수 있어요</p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">smart_display</span>
                추적 화면에서 광고 보고 슬롯 +1
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">trending_up</span>
                레벨업 시 최대 +20 슬롯 (Lv2부터)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
