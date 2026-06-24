// Ad group IDs — issued in the Apps-in-Toss console per ad format.
// Replace the test IDs via env (.env / console) before launch.
export const AD_GROUPS = {
  interstitial:
    import.meta.env.VITE_AD_GROUP_INTERSTITIAL ?? "ait-ad-test-interstitial-id",
  rewarded: import.meta.env.VITE_AD_GROUP_REWARDED ?? "ait-ad-test-rewarded-id",
  banner: import.meta.env.VITE_AD_GROUP_BANNER ?? "ait-ad-test-banner-id",
} as const;

// How many free interstitial-gated navigations before we show one.
export const INTERSTITIAL_EVERY = 4;
