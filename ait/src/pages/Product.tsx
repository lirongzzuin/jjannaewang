import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { formatPrice } from "@/lib/utils";
import { analyzePriceHistory } from "@/lib/price-analyzer";
import { api, ApiError } from "@/lib/api";
import { Product as ProductType, PriceHistory } from "@/types";
import { share, getTossShareLink, haptic } from "@/lib/apps-in-toss";
import { useFullScreenAd } from "@/hooks/useFullScreenAd";
import { useInterstitialOnView } from "@/hooks/useInterstitial";
import { usePushConsent } from "@/hooks/usePushConsent";
import { AD_GROUPS } from "@/lib/ads";
import { useAppStore } from "@/store";
import EmptyState from "@/components/ui/EmptyState";

interface ProductResponse {
  product: ProductType;
  history: PriceHistory[];
}

const PERIODS: { id: Period; days: number }[] = [
  { id: "1w", days: 7 },
  { id: "1m", days: 30 },
  { id: "3m", days: 90 },
  { id: "6m", days: 180 },
  { id: "1y", days: 365 },
];
type Period = "1w" | "1m" | "3m" | "6m" | "1y";

const SHOP_COLORS = ["#ffb700", "#03c75a", "#ee2c00", "#3b82f6", "#a855f7", "#64748b"];

function PriceChart({ series }: { series: { shop: string; color: string; prices: number[] }[] }) {
  const all = series.flatMap((s) => s.prices);
  if (all.length < 2) {
    return (
      <div className="flex h-[140px] items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400">
        아직 가격 데이터가 충분하지 않아요
      </div>
    );
  }
  const min = Math.min(...all) * 0.99;
  const max = Math.max(...all) * 1.01;
  const range = max - min || 1;
  const width = 340;
  const height = 140;
  const padding = { top: 10, bottom: 20, left: 48, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const path = (prices: number[]) =>
    prices.length < 2
      ? ""
      : prices
          .map((p, i) => {
            const x = padding.left + (i / (prices.length - 1)) * chartW;
            const y = padding.top + chartH - ((p - min) / range) * chartH;
            return `${i === 0 ? "M" : "L"}${x},${y}`;
          })
          .join(" ");

  const yLabels = [min, min + range * 0.5, max].map((v) => Math.round(v));

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {yLabels.map((label, i) => (
          <text
            key={i}
            x={padding.left - 6}
            y={padding.top + chartH - (i / 2) * chartH + 4}
            textAnchor="end"
            className="fill-slate-400"
            fontSize="9"
          >
            {(label / 1000).toFixed(1)}k
          </text>
        ))}
        {[0, 0.5, 1].map((t, i) => (
          <line
            key={i}
            x1={padding.left}
            x2={padding.left + chartW}
            y1={padding.top + chartH - t * chartH}
            y2={padding.top + chartH - t * chartH}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}
        {series.map((s) => (
          <path
            key={s.shop}
            d={path(s.prices)}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-3 pl-12">
        {series.map((s) => (
          <div key={s.shop} className="flex items-center gap-1">
            <div className="h-0.5 w-3 rounded" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] text-slate-500">{s.shop}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Product() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const premiumTier = useAppStore((s) => s.premiumTier);
  const isPro = premiumTier !== "free";

  const { data, error, isLoading } = useSWR(
    id ? `/api/product/${id}` : null,
    (path: string) => api.get<ProductResponse>(path),
  );

  const [period, setPeriod] = useState<Period>("1m");
  const [isTracked, setIsTracked] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [analysisUnlocked, setAnalysisUnlocked] = useState(false);

  const rewardedAd = useFullScreenAd(AD_GROUPS.rewarded);
  const { ensureConsent } = usePushConsent();
  useInterstitialOnView(isPro);

  const product = data?.product;
  const history = useMemo(() => data?.history ?? [], [data]);

  // Group history into per-shop series within the selected period.
  const series = useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)?.days ?? 30;
    const cutoff = Date.now() - days * 86_400_000;
    const byShop = new Map<string, number[]>();
    for (const h of history) {
      if (new Date(h.recorded_at).getTime() < cutoff) continue;
      const arr = byShop.get(h.shop_name) ?? [];
      arr.push(h.price);
      byShop.set(h.shop_name, arr);
    }
    return Array.from(byShop.entries()).map(([shop, prices], i) => ({
      shop,
      prices,
      color: SHOP_COLORS[i % SHOP_COLORS.length],
    }));
  }, [history, period]);

  // Latest price per shop → comparison table.
  const shopPrices = useMemo(() => {
    const latest = new Map<string, number>();
    for (const h of history) latest.set(h.shop_name, h.price); // ascending → last = latest
    const rows = Array.from(latest.entries())
      .map(([shop, price]) => ({ shop, price }))
      .sort((a, b) => a.price - b.price);
    return rows;
  }, [history]);

  const analysis = useMemo(() => analyzePriceHistory(history), [history]);
  const analysisVisible = isPro || analysisUnlocked;

  const handleUnlockAnalysis = () => {
    if (rewardedAd.isSupported) {
      rewardedAd.showAd(() => {
        setAnalysisUnlocked(true);
        haptic("softMedium");
      });
    } else {
      setAnalysisUnlocked(true);
    }
  };

  const handleToggleTrack = async () => {
    if (!product) return;
    if (!user) {
      navigate("/profile");
      return;
    }
    if (isTracked) {
      setIsTracked(false);
      await api.del("/api/tracking", { product_id: product.id }).catch(() => {});
      return;
    }
    setIsTracked(true);
    setShowTargetModal(true);
    haptic("tick");
    await ensureConsent();
  };

  const saveTarget = async () => {
    if (!product) return;
    setShowTargetModal(false);
    try {
      await api.post("/api/tracking", {
        product_id: product.id,
        target_price: targetPrice ? Number(targetPrice) : null,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        alert("추적 슬롯이 가득 찼어요. 광고를 보거나 PRO로 늘려보세요!");
        setIsTracked(false);
      }
    }
  };

  const handleShare = async () => {
    if (!product) return;
    const url = `${window.location.origin}/product/${product.id}`;
    const link = await getTossShareLink(url);
    await share({
      message: `[짠내왕] ${product.name} 지금 ${product.current_lowest_price ? formatPrice(product.current_lowest_price) : ""}! 최저가 같이 추적해요 👑\n${link}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light">
        <span className="material-symbols-outlined animate-spin text-4xl text-slate-300">
          progress_activity
        </span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background-light">
        <header className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
          <button onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </button>
          <h1 className="text-base font-bold text-slate-900">상품</h1>
        </header>
        <EmptyState
          icon="search_off"
          title="상품을 찾을 수 없어요"
          description="삭제되었거나 아직 등록되지 않은 상품이에요."
          ctaLabel="검색하러 가기"
          ctaTo="/search"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </button>
          <h1 className="line-clamp-1 text-base font-bold text-slate-900">{product.name}</h1>
        </div>
        <button onClick={handleShare} className="rounded-full p-2 hover:bg-slate-100">
          <span className="material-symbols-outlined text-slate-600">share</span>
        </button>
      </header>

      <div className="bg-white">
        <div className="flex gap-4 p-4">
          <div className="size-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-slate-300">image</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {product.brand || product.category || "상품"}
            </p>
            <h2 className="mt-1 text-base font-bold leading-snug text-slate-900">{product.name}</h2>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-primary">
                {product.current_lowest_price ? formatPrice(product.current_lowest_price) : "가격 확인 중"}
              </span>
              {product.lowest_price_ever != null && (
                <p className="mt-0.5 text-xs text-slate-400">
                  역대 최저{" "}
                  <span className="font-bold text-green-600">
                    {formatPrice(product.lowest_price_ever)}
                  </span>
                </p>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
              <span className="material-symbols-outlined text-[13px]">visibility</span>
              {product.tracking_count.toLocaleString()}명 추적
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={handleToggleTrack}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold transition-all active:scale-95 ${
              isTracked ? "bg-slate-100 text-slate-600" : "bg-primary text-white shadow-lg shadow-primary/30"
            }`}
          >
            <span className="material-symbols-outlined">
              {isTracked ? "notifications_active" : "notifications_none"}
            </span>
            {isTracked ? "감시 중 👁️" : "감시 시작 👁️"}
          </button>
          {shopPrices[0] && (
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              구매
            </a>
          )}
        </div>

        <div className="flex gap-1 px-4 pb-3">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                period === p.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4">
          <PriceChart series={series} />
        </div>

        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="mb-1 text-[10px] text-slate-400">최저가</p>
            <p className="text-sm font-bold text-green-600">
              {analysis.minPrice ? formatPrice(analysis.minPrice) : "-"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="mb-1 text-[10px] text-slate-400">평균가</p>
            <p className="text-sm font-bold text-slate-700">
              {analysis.avgPrice ? formatPrice(analysis.avgPrice) : "-"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="mb-1 text-[10px] text-slate-400">최고가</p>
            <p className="text-sm font-bold text-red-500">
              {analysis.maxPrice ? formatPrice(analysis.maxPrice) : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* AI Analysis card */}
      {history.length > 0 && (
        <div className="mx-4 mt-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <span className="text-base">🤖</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">AI 가격 분석</p>
                <p className="text-[10px] text-slate-400">신뢰도 {analysis.confidence}%</p>
              </div>
            </div>
            {!analysisVisible && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                잠김
              </span>
            )}
          </div>
          <div className={!analysisVisible ? "pointer-events-none select-none blur-sm" : ""}>
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                <span>역대 최저</span>
                <span>현재 위치</span>
                <span>역대 최고</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-md transition-all"
                  style={{ left: `calc(${analysis.currentPercentile}% - 8px)` }}
                />
              </div>
            </div>
            <div className="mb-2 rounded-xl bg-amber-50 p-3">
              <p className="text-sm font-bold text-slate-800">{analysis.recommendation}</p>
            </div>
            {analysis.bestMonthToBuy && (
              <p className="text-xs text-slate-500">
                통계적으로 <span className="font-bold text-primary">{analysis.bestMonthToBuy}</span>에
                가장 저렴해요
              </p>
            )}
          </div>
          {!analysisVisible && (
            <div className="mt-3 space-y-2">
              <button
                onClick={handleUnlockAnalysis}
                disabled={rewardedAd.isSupported && (!rewardedAd.isAdLoaded || rewardedAd.isShowing)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary py-2.5 text-sm font-bold text-primary disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">smart_display</span>
                {rewardedAd.isSupported && !rewardedAd.isAdLoaded
                  ? "광고 준비 중..."
                  : "광고 보고 이번 분석 무료로 보기"}
              </button>
              <Link to="/premium">
                <button className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white">
                  PRO로 업그레이드하고 항상 보기
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Shop comparison */}
      {shopPrices.length > 0 && (
        <div className="mx-4 mb-6 mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-bold text-slate-900">쇼핑몰별 최신 가격</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {shopPrices.map((s, i) => (
              <div
                key={s.shop}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">
                      storefront
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{s.shop}</p>
                </div>
                <div className="flex items-center gap-2">
                  {i === 0 && (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                      최저가
                    </span>
                  )}
                  <p className="text-sm font-bold text-slate-900">{formatPrice(s.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="mx-4 mb-6 mt-3">
          <EmptyState
            icon="query_stats"
            title="아직 가격 이력이 없어요"
            description="감시를 시작하면 짠내왕이 매일 최저가를 수집해 차트를 그려드려요."
          />
        </div>
      )}

      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTargetModal(false)} />
          <div className="relative w-full max-w-app animate-slide-up rounded-t-2xl bg-white p-6 pb-10">
            <h3 className="mb-1 text-lg font-bold">목표 가격 설정</h3>
            <p className="mb-4 text-xs text-slate-400">이 가격 이하로 내려가면 알려드릴게요</p>
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3">
              <span className="font-bold text-slate-500">₩</span>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={String(product.lowest_price_ever ?? product.current_lowest_price ?? "")}
                className="flex-1 bg-transparent text-lg font-bold text-slate-900 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveTarget}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
              >
                건너뛰기
              </button>
              <button
                onClick={saveTarget}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white"
              >
                설정 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
