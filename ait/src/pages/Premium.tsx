import { useState } from 'react';
import { Link } from "react-router-dom";
import { formatPrice } from '@/lib/utils';
import { PREMIUM_TIERS } from '@/types';
import { useIAP } from '@/hooks/useIAP';
import { useAppStore } from '@/store';

const FEATURES = [
  {
    label: '가격 추적 슬롯',
    free: '10개',
    pro: '50개',
    master: '무제한',
    icon: 'visibility',
  },
  {
    label: '가격 차트 기간',
    free: '1개월',
    pro: '6개월',
    master: '12개월',
    icon: 'show_chart',
  },
  {
    label: '가격 분석 (항상 열람)',
    free: false,
    pro: true,
    master: true,
    icon: 'psychology',
  },
  {
    label: '최저가 타이밍 알림',
    free: false,
    pro: true,
    master: true,
    icon: 'notifications_active',
  },
  {
    label: '최적 구매 시기 예측',
    free: false,
    pro: true,
    master: true,
    icon: 'calendar_today',
  },
  {
    label: '가격 이력 다운로드',
    free: false,
    pro: false,
    master: true,
    icon: 'download',
  },
  {
    label: '월간 절약 리포트',
    free: false,
    pro: false,
    master: true,
    icon: 'analytics',
  },
  {
    label: '광고 제거',
    free: false,
    pro: false,
    master: true,
    icon: 'block',
  },
];

export default function Premium() {
  const [selectedTier, setSelectedTier] = useState<'pro' | 'master'>('pro');
  const { status, purchase } = useIAP();
  const isPurchasing = status === 'pending';
  const { premiumTier, user } = useAppStore();
  const currentTier = premiumTier;

  // Format premium expiry date dynamically
  const expiryLabel = user?.premium_expiry
    ? new Date(user.premium_expiry).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const handlePurchase = (sku: string) => {
    purchase(
      sku,
      () => alert('구독이 시작됐어요! 모든 기능을 사용할 수 있습니다. 🎉'),
    );
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <Link to="/profile">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </Link>
        <h1 className="text-base font-bold text-slate-900">프리미엄 구독</h1>
      </header>

      {/* Hero section */}
      <div
        className="px-4 py-8 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #231d0f 0%, #3d3000 100%)' }}
      >
        <div className="text-4xl mb-3">👑</div>
        <h2 className="text-2xl font-extrabold mb-2">더 똑똑한 절약</h2>
        <p className="text-white/70 text-sm leading-relaxed">
          가격 분석으로 최저가 타이밍을 잡고<br />절약을 레벨업하세요
        </p>
      </div>

      {/* Tier selector */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-2 flex gap-2 mb-5">
          {(['pro', 'master'] as const).map((tier) => {
            const info = PREMIUM_TIERS[tier];
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`flex-1 relative py-3 rounded-xl font-bold text-sm transition-all ${
                  selectedTier === tier
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {tier === 'master' && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                    인기
                  </span>
                )}
                <div className="text-lg mb-0.5">{tier === 'pro' ? '🥈' : '👑'}</div>
                <div>{info.name}</div>
                <div className="text-xs font-medium mt-0.5 opacity-80">
                  월 {formatPrice('price' in info ? info.price : 0)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Features table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5 overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-4 gap-0 bg-slate-50 border-b border-slate-100 py-3">
            <div className="col-span-2 px-4 text-xs font-bold text-slate-500">기능</div>
            <div className="text-center text-xs font-bold text-slate-400">무료</div>
            <div className="text-center text-xs font-bold text-primary">PRO/마스터</div>
          </div>

          {FEATURES.map((feature, i) => (
            <div key={i} className={`grid grid-cols-4 gap-0 py-3 border-b border-slate-50 last:border-0 items-center`}>
              <div className="col-span-2 px-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">{feature.icon}</span>
                <span className="text-xs font-semibold text-slate-700">{feature.label}</span>
              </div>
              <div className="text-center">
                {typeof feature.free === 'boolean' ? (
                  feature.free ? (
                    <span className="material-symbols-outlined text-green-500 text-[18px] fill-icon">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-slate-200 text-[18px]">remove_circle</span>
                  )
                ) : (
                  <span className="text-xs font-bold text-slate-500">{feature.free}</span>
                )}
              </div>
              <div className="text-center">
                {typeof feature.pro === 'boolean' ? (
                  feature.pro ? (
                    <span className="material-symbols-outlined text-primary text-[18px] fill-icon">check_circle</span>
                  ) : (
                    selectedTier === 'master' ? (
                      <span className="material-symbols-outlined text-primary text-[18px] fill-icon">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-slate-200 text-[18px]">remove_circle</span>
                    )
                  )
                ) : (
                  <span className="text-xs font-bold text-primary">
                    {selectedTier === 'pro' ? feature.pro : feature.master}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Current plan status */}
        {currentTier !== 'free' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-green-500 fill-icon">check_circle</span>
            <div>
              <p className="text-sm font-bold text-green-800">현재 {currentTier.toUpperCase()} 구독 중</p>
              {expiryLabel && <p className="text-xs text-green-600">{expiryLabel} 만료 예정</p>}
            </div>
          </div>
        )}

        {/* Purchase buttons */}
        <div className="space-y-3 pb-8">
          <button
            onClick={() => handlePurchase(selectedTier === 'pro' ? 'premium_pro_monthly' : 'premium_master_monthly')}
            disabled={isPurchasing}
            className="w-full py-4 rounded-2xl bg-primary text-slate-900 font-extrabold text-base shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-60"
          >
            {isPurchasing ? '처리 중...' : `${selectedTier === 'pro' ? '프로' : '마스터'} 구독 시작 — 월 ${formatPrice(PREMIUM_TIERS[selectedTier].price as number)}`}
          </button>

          <p className="text-center text-[11px] text-slate-400 leading-relaxed">
            구독은 언제든 해지 가능합니다. 해지 후에도 기간 만료까지 이용 가능해요.
          </p>

          {/* Free ways to get more slots */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <p className="text-sm font-bold text-slate-700 mb-1">무료로 슬롯 늘리기</p>
            <p className="text-xs text-slate-500 mb-3">
              구독 없이도 추적 슬롯을 늘릴 수 있어요
            </p>
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
