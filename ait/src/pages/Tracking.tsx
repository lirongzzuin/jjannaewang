import { useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/utils";
import MiniSparkline from "@/components/charts/MiniSparkline";
import { useFullScreenAd } from "@/hooks/useFullScreenAd";
import { usePushConsent } from "@/hooks/usePushConsent";
import { AD_GROUPS } from "@/lib/ads";
import { haptic, requestReview } from "@/lib/apps-in-toss";
import { useEffect, useRef } from "react";

const MOCK_TRACKINGS = [
  { id: "t1", productId: "p2", name: "하기스 매직팬티 여아 4단계 52매", brand: "하기스", image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=200", currentPrice: 31500, targetPrice: 28900, lowestEver: 28900, shop: "네이버스토어", alertEnabled: true, sparkline: [35000, 33500, 32000, 32500, 31800, 31500], change: -1800, status: "dropping" },
  { id: "t2", productId: "p6", name: "맥심 모카골드 커피믹스 100개입", brand: "동서식품", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200", currentPrice: 14800, targetPrice: 12500, lowestEver: 12500, shop: "쿠팡", alertEnabled: true, sparkline: [17000, 16500, 15500, 15000, 14800, 14800], change: -200, status: "dropping" },
  { id: "t3", productId: "p3", name: "신라면 120g x 20개", brand: "농심", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200", currentPrice: 13200, targetPrice: 11500, lowestEver: 11500, shop: "쿠팡", alertEnabled: false, sparkline: [15000, 14500, 14000, 13500, 13200, 13200], change: -300, status: "stable" },
  { id: "t4", productId: "p5", name: "크리넥스 3겹 화장지 30롤", brand: "크리넥스", image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=200", currentPrice: 21000, targetPrice: 18900, lowestEver: 18900, shop: "이마트몰", alertEnabled: true, sparkline: [24000, 23000, 22000, 21500, 21000, 21000], change: -1000, status: "dropping" },
  { id: "t5", productId: "p1", name: "삼다수 2L x 12개", brand: "삼다수", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200", currentPrice: 7900, targetPrice: 7500, lowestEver: 7900, shop: "쿠팡", alertEnabled: true, sparkline: [9500, 9200, 9000, 8900, 8200, 7900], change: -1000, status: "target_met" },
];

const FILTER_TABS = [
  { id: "all", label: "전체" },
  { id: "dropping", label: "하락 중" },
  { id: "target_met", label: "목표 달성" },
  { id: "alert_off", label: "알림 꺼짐" },
];

const TOTAL_SLOTS = 10;
const PRO_SLOTS = 50;

export default function Tracking() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [alerts, setAlerts] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_TRACKINGS.map((t) => [t.id, t.alertEnabled])),
  );
  const [trackings, setTrackings] = useState(MOCK_TRACKINGS);
  const [adSlotBonus, setAdSlotBonus] = useState(0);

  const rewardedAd = useFullScreenAd(AD_GROUPS.rewarded);
  const { ensureConsent } = usePushConsent();
  const reviewAsked = useRef(false);

  // Ask for a store review once, at a high-satisfaction moment (a target is met).
  useEffect(() => {
    if (reviewAsked.current) return;
    if (trackings.some((t) => t.currentPrice <= t.targetPrice)) {
      reviewAsked.current = true;
      requestReview();
    }
  }, [trackings]);

  const filtered = trackings.filter((t) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "dropping") return t.status === "dropping";
    if (activeFilter === "target_met") return t.status === "target_met";
    if (activeFilter === "alert_off") return !alerts[t.id];
    return true;
  });

  const removeTracking = (id: string) => setTrackings((prev) => prev.filter((t) => t.id !== id));
  const toggleAlert = async (id: string) => {
    const turningOn = !alerts[id];
    setAlerts((prev) => ({ ...prev, [id]: turningOn }));
    if (turningOn) {
      haptic("tick");
      await ensureConsent(); // ensure push consent so alerts can be delivered
    }
  };

  const handleWatchAdForSlot = () => {
    if (rewardedAd.isSupported) {
      // Grant the slot ONLY on a verified userEarnedReward event.
      rewardedAd.showAd(() => {
        setAdSlotBonus((prev) => prev + 1);
        haptic("softMedium");
      });
    } else {
      setAdSlotBonus((prev) => prev + 1);
    }
  };

  const slotCap = TOTAL_SLOTS + adSlotBonus;

  return (
    <div className="min-h-screen bg-background-light">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </Link>
            <h1 className="text-lg font-extrabold text-slate-900">내 추적 목록 👁️</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
            <span className="material-symbols-outlined text-[16px] text-slate-500">folder</span>
            <span className="text-xs font-bold text-slate-600">
              {trackings.length}/{slotCap}
            </span>
          </div>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, (trackings.length / slotCap) * 100)}%` }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex-none rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                activeFilter === tab.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.label}
              {tab.id !== "all" && (
                <span className="ml-1 text-[10px]">
                  (
                  {
                    trackings.filter((t) =>
                      tab.id === "dropping"
                        ? t.status === "dropping"
                        : tab.id === "target_met"
                          ? t.status === "target_met"
                          : !alerts[t.id],
                    ).length
                  }
                  )
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-3 p-4">
        {filtered.map((item) => {
          const progressToTarget = item.targetPrice
            ? Math.max(
                0,
                Math.min(
                  100,
                  ((item.currentPrice - item.targetPrice) /
                    (item.sparkline[0] - item.targetPrice)) *
                    100,
                ),
              )
            : 0;
          const targetMet = item.currentPrice <= item.targetPrice;

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
            >
              {targetMet && (
                <div className="flex items-center gap-2 bg-green-500 px-4 py-1.5">
                  <span className="material-symbols-outlined fill-icon text-[16px] text-white">
                    check_circle
                  </span>
                  <span className="text-xs font-bold text-white">목표가 달성! 지금 구매하세요</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Link to={`/product/${item.productId}`}>
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-400">{item.brand}</p>
                        <Link to={`/product/${item.productId}`}>
                          <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-800 transition-colors hover:text-primary">
                            {item.name}
                          </p>
                        </Link>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => toggleAlert(item.id)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            alerts[item.id]
                              ? "bg-primary/10 text-primary"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[18px] ${alerts[item.id] ? "fill-icon" : ""}`}
                          >
                            {alerts[item.id] ? "notifications_active" : "notifications_off"}
                          </span>
                        </button>
                        <button
                          onClick={() => removeTracking(item.id)}
                          className="rounded-lg bg-slate-100 p-1.5 text-slate-400 transition-colors hover:text-red-400"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete_outline
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-lg font-extrabold ${targetMet ? "text-green-600" : "text-primary"}`}
                      >
                        {formatPrice(item.currentPrice)}
                      </span>
                      <span className="text-xs font-bold text-green-600">
                        {item.change < 0
                          ? `▼ ${formatPrice(Math.abs(item.change))}`
                          : `▲ ${formatPrice(item.change)}`}
                      </span>
                    </div>
                  </div>
                  <MiniSparkline data={item.sparkline} width={56} height={28} />
                </div>

                {item.targetPrice && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                      <span>현재 {formatPrice(item.currentPrice)}</span>
                      <span>목표 {formatPrice(item.targetPrice)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${targetMet ? "bg-green-500" : "bg-primary"}`}
                        style={{ width: `${Math.max(5, 100 - progressToTarget)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {targetMet
                        ? "목표가 달성됐어요!"
                        : `목표까지 ${formatPrice(item.currentPrice - item.targetPrice)} 남았어요`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <span className="material-symbols-outlined mb-3 text-6xl">inventory_2</span>
            <p className="text-sm font-medium text-slate-400">추적 중인 상품이 없어요</p>
            <Link to="/search">
              <button className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">
                상품 검색하기
              </button>
            </Link>
          </div>
        )}

        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl">
              👑
            </div>
            <div>
              <p className="font-bold">PRO로 업그레이드</p>
              <p className="text-xs text-white/70">추적 슬롯 {PRO_SLOTS}개 + 6개월 차트</p>
            </div>
          </div>
          <p className="mb-3 text-xs text-white/60">
            현재 {trackings.length}/{slotCap} 슬롯 사용 중
          </p>
          <div className="space-y-2">
            <Link to="/premium">
              <button className="w-full rounded-xl bg-primary py-2.5 text-sm font-extrabold text-slate-900">
                월 ₩2,900 시작하기
              </button>
            </Link>
            <button
              onClick={handleWatchAdForSlot}
              disabled={rewardedAd.isSupported && (!rewardedAd.isAdLoaded || rewardedAd.isShowing)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/30 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">smart_display</span>
              {rewardedAd.isSupported && !rewardedAd.isAdLoaded
                ? "광고 준비 중..."
                : "광고 보고 슬롯 1개 무료 추가"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
