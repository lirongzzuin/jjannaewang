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
 * Pro users are skipped (pass skip=true).
 */
export function useInterstitialOnView(skip = false) {
  const fired = useRef(false);

  useEffect(() => {
    if (skip || fired.current) return;
    fired.current = true;

    const n = bumpCount();
    if (n % INTERSTITIAL_EVERY !== 0) return;
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
