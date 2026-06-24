import { useEffect, useRef } from "react";
import { loadFullScreenAd, showFullScreenAd } from "@/lib/apps-in-toss";
import { AD_GROUPS, INTERSTITIAL_EVERY } from "@/lib/ads";

const COUNT_KEY = "jjannaewang-interstitial-count";

function bumpCount(): number {
  try {
    const n = Number(localStorage.getItem(COUNT_KEY) ?? "0") + 1;
    localStorage.setItem(COUNT_KEY, String(n));
    return n;
  } catch {
    return 0;
  }
}

/**
 * Shows an interstitial ad on roughly every Nth "view" (content transition).
 * Call once per qualifying screen mount. Safe no-op outside the Toss runtime.
 * `skip` (e.g. PRO users) disables it entirely. `every` overrides the cadence
 * (Infinity = never) — used by level perks to reduce ads for high-level users.
 */
export function useInterstitialOnView(skip = false, every: number = INTERSTITIAL_EVERY) {
  const fired = useRef(false);

  useEffect(() => {
    if (skip || every === Infinity || !Number.isFinite(every) || fired.current) return;
    fired.current = true;

    const n = bumpCount();
    if (n % every !== 0) return;
    if (!loadFullScreenAd.isSupported()) return;

    const unregister = loadFullScreenAd({
      options: { adGroupId: AD_GROUPS.interstitial },
      onEvent: (event) => {
        if (event.type === "loaded") {
          showFullScreenAd({ options: { adGroupId: AD_GROUPS.interstitial } });
        }
      },
      onError: () => {},
    });
    return () => {
      try {
        unregister();
      } catch {
        /* ignore */
      }
    };
  }, [skip]);
}
