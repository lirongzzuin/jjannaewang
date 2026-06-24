import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { formatPrice } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { UserTracking } from "@/types";
import { useAppStore } from "@/store";
import EmptyState from "@/components/ui/EmptyState";
import SavingsLogModal from "@/components/savings/SavingsLogModal";
import { useFullScreenAd } from "@/hooks/useFullScreenAd";
import { usePushConsent } from "@/hooks/usePushConsent";
import { AD_GROUPS } from "@/lib/ads";
import { getLevelPerks } from "@/lib/level-perks";
import { haptic, requestReview } from "@/lib/apps-in-toss";

const FILTER_TABS = [
  { id: "all", label: "전체" },
  { id: "dropping", label: "하락 중" },
  { id: "target_met", label: "목표 달성" },
  { id: "alert_off", label: "알림 꺼짐" },
];

const TOTAL_SLOTS = 10;
const PRO_SLOTS = 50;

// A tracking has met its target when the current lowest price is at/under target.
function isTargetMet(t: UserTracking): boolean {
  const price = t.product?.current_lowest_price;
  return price != null && t.target_price != null && price <= t.target_price;
}

export default function Tracking() {
  const user = useAppStore((s) => s.user);
  const [activeFilter, setActiveFilter] = useState("all");
  const [adSlotBonus, setAdSlotBonus] = useState(0);
  const [logItem, setLogItem] = useState<UserTracking | null>(null);

  const rewardedAd = useFullScreenAd(AD_GROUPS.rewarded);
  const { ensureConsent } = usePushConsent();
  const reviewAsked = useRef(false);

  const { data, error, isLoading, mutate } = useSWR(
    user ? "/api/tracking" : null,
    () => api.get<{ trackings: UserTracking[] }>("/api/tracking"),
  );

  const trackings = data?.trackings ?? [];
  const unauthorized = !user || (error instanceof ApiError && error.status === 401);

  // Ask for a store review once, at a high-satisfaction moment (a target is met).
  useEffect(() => {
    if (reviewAsked.current) return;
    if (trackings.some(isTargetMet)) {
      reviewAsked.current = true;
      requestReview();
    }
  }, [trackings]);

  const filtered = trackings.filter((t) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "dropping") return !isTargetMet(t);
    if (activeFilter === "target_met") return isTargetMet(t);
    if (activeFilter === "alert_off") return !t.alert_enabled;
    return true;
  });

  const tabCount = (tabId: string) =>
    trackings.filter((t) =>
      tabId === "dropping"
        ? !isTargetMet(t)
        : tabId === "target_met"
          ? isTargetMet(t)
          : !t.alert_enabled,
    ).length;

  const removeTracking = async (productId: string) => {
    // Optimistic removal.
    mutate(
      (prev) =>
        prev ? { trackings: prev.trackings.filter((t) => t.product_id !== productId) } : prev,
      { revalidate: false },
    );
    try {
      await api.del("/api/tracking", { product_id: productId });
    } finally {
      mutate();
    }
  };

  const toggleAlert = async (trackingId: string, current: boolean) => {
    const next = !current;
    if (next) {
      haptic("tick");
      await ensureConsent(); // ensure push consent so alerts can be delivered
    }
    // Optimistic toggle.
    mutate(
      (prev) =>
        prev
          ? {
              trackings: prev.trackings.map((t) =>
                t.id === trackingId ? { ...t, alert_enabled: next } : t,
              ),
            }
          : prev,
      { revalidate: false },
    );
    try {
      await api.post("/api/alert", { tracking_id: trackingId, alert_enabled: next });
    } catch {
      mutate(); // revalidate to revert on failure
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

  const levelBonus = getLevelPerks(user?.level ?? 1).extraTrackingSlots;
  const slotCap = TOTAL_SLOTS + levelBonus + adSlotBonus;

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
              {tab.id !== "all" && <span className="ml-1 text-[10px]">({tabCount(tab.id)})</span>}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-3 p-4">
        {unauthorized ? (
          <EmptyState
            icon="hourglass_empty"
            title="토스 계정을 연결하는 중이에요"
            description="잠시 후 관심 상품 추적을 시작할 수 있어요"
            ctaLabel="상품 검색하기"
            ctaTo="/search"
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-4xl text-slate-300">progress_activity</span>
          </div>
        ) : trackings.length === 0 ? (
          <EmptyState
            icon="inventory_2"
            title="추적 중인 상품이 없어요"
            description="상품을 검색해 가격을 추적하면 목표가 도달 시 알려드려요"
            ctaLabel="상품 검색하기"
            ctaTo="/search"
          />
        ) : (
          <>
            {filtered.map((item) => {
              const product = item.product;
              const current = product?.current_lowest_price ?? null;
              const target = item.target_price;
              const targetMet = isTargetMet(item);
              const progressPct =
                current != null && current > 0 && target != null
                  ? Math.min(100, Math.round((target / current) * 100))
                  : 0;

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                >
                  {targetMet && (
                    <div className="flex items-center justify-between gap-2 bg-green-500 px-4 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined fill-icon text-[16px] text-white">
                          check_circle
                        </span>
                        <span className="text-xs font-bold text-white">목표가 달성!</span>
                      </div>
                      <button
                        onClick={() => setLogItem(item)}
                        className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-green-700"
                      >
                        샀어요! 절약 기록
                      </button>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Link to={`/product/${item.product_id}`}>
                        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {product?.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product?.name ?? ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <span className="material-symbols-outlined text-2xl text-slate-300">image</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-slate-400">
                              {product?.brand ?? product?.category ?? ""}
                            </p>
                            <Link to={`/product/${item.product_id}`}>
                              <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-800 transition-colors hover:text-primary">
                                {product?.name ?? "상품"}
                              </p>
                            </Link>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => toggleAlert(item.id, item.alert_enabled)}
                              className={`rounded-lg p-1.5 transition-colors ${
                                item.alert_enabled
                                  ? "bg-primary/10 text-primary"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              <span
                                className={`material-symbols-outlined text-[18px] ${item.alert_enabled ? "fill-icon" : ""}`}
                              >
                                {item.alert_enabled ? "notifications_active" : "notifications_off"}
                              </span>
                            </button>
                            <button
                              onClick={() => removeTracking(item.product_id)}
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
                            {current != null ? formatPrice(current) : "가격 확인 중"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {target != null && (
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                          <span>현재 {current != null ? formatPrice(current) : "-"}</span>
                          <span>목표 {formatPrice(target)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${targetMet ? "bg-green-500" : "bg-primary"}`}
                            style={{ width: `${Math.max(5, progressPct)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {targetMet
                            ? "목표가 달성됐어요!"
                            : current != null
                              ? `목표까지 ${formatPrice(current - target)} 남았어요`
                              : "가격 정보를 기다리고 있어요"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <EmptyState
                icon="filter_list_off"
                title="해당하는 상품이 없어요"
                description="다른 필터를 선택해보세요"
              />
            )}
          </>
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

      <SavingsLogModal
        open={logItem !== null}
        onClose={() => setLogItem(null)}
        productId={logItem?.product_id}
        productName={logItem?.product?.name}
        defaultOriginal={logItem?.product?.current_lowest_price ?? undefined}
        defaultPurchased={logItem?.target_price ?? undefined}
        source="tracking"
        onLogged={() => mutate()}
      />
    </div>
  );
}
