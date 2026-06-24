import type { PremiumTier } from "@/types";

// Plans differ ONLY by Toss Ads exposure (+ a supporter badge & more slots).
// All features are fully usable on the free plan.
export interface AdPolicy {
  showBanner: boolean;
  showInterstitial: boolean;
}

export function adPolicy(tier: PremiumTier): AdPolicy {
  if (tier === "master") return { showBanner: false, showInterstitial: false }; // 광고 완전 제거
  if (tier === "pro") return { showBanner: true, showInterstitial: false }; // 전면광고 제거
  return { showBanner: true, showInterstitial: true }; // 무료: 전 광고 노출
}
