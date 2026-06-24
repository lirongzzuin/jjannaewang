import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { attachBanner, isBannerSupported, type BannerOptions } from "@/lib/apps-in-toss";
import { AD_GROUPS } from "@/lib/ads";
import { useAppStore } from "@/store";
import { adPolicy } from "@/lib/premium";

/**
 * Banner ad slot (TossAds.attachBanner).
 * When the Toss banner runtime is available, attaches a real banner into the
 * container. Otherwise falls back to an in-house house-promo so the ad
 * real-estate/layout stays consistent and the screen never shows a blank gap.
 */
export default function AdBanner({
  className = "",
  options,
}: {
  className?: string;
  options?: BannerOptions;
}) {
  const premiumTier = useAppStore((s) => s.premiumTier);
  const showBanner = adPolicy(premiumTier).showBanner; // 마스터는 배너도 제거
  const ref = useRef<HTMLDivElement>(null);
  const [supported] = useState(() => isBannerSupported());

  useEffect(() => {
    if (!showBanner || !supported || !ref.current) return;
    const cleanup = attachBanner(AD_GROUPS.banner, ref.current, options ?? { variant: "card" });
    return cleanup;
  }, [showBanner, supported, options]);

  // Plan with ads removed → render nothing.
  if (!showBanner) return null;

  if (supported) {
    return <div ref={ref} className={`min-h-[96px] w-full ${className}`} />;
  }

  // House-promo fallback (non-Toss / unsupported runtime).
  return (
    <Link
      to="/profile"
      className={`flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">campaign</span>
        <div>
          <p className="text-xs font-bold text-slate-800">친구 초대하고 추적 슬롯 받기</p>
          <p className="text-[11px] text-slate-500">함께 짠내 내면 더 많이 아껴요</p>
        </div>
      </div>
      <span className="material-symbols-outlined text-slate-300">chevron_right</span>
    </Link>
  );
}
