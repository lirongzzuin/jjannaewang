import { useCallback, useEffect, useRef, useState } from "react";
import { loadFullScreenAd, showFullScreenAd, type AdReward } from "@/lib/apps-in-toss";

interface UseFullScreenAdReturn {
  isAdLoaded: boolean;
  isSupported: boolean;
  isShowing: boolean;
  lastReward: AdReward | null;
  /** Show the ad. `onReward` fires only on a verified userEarnedReward event. */
  showAd: (onReward?: (reward: AdReward) => void, onDismiss?: () => void) => void;
}

/**
 * Full-screen ad hook (interstitial or rewarded — decided by adGroupId).
 * Pattern: preload on mount → show on demand → reload after dismiss.
 * Ref: https://developers-apps-in-toss.toss.im/ads/intro.html
 */
export function useFullScreenAd(adGroupId: string): UseFullScreenAdReturn {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [lastReward, setLastReward] = useState<AdReward | null>(null);
  const unregisterRef = useRef<(() => void) | null>(null);

  const load = useCallback(() => {
    setIsAdLoaded(false);
    try {
      unregisterRef.current = loadFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === "loaded") setIsAdLoaded(true);
        },
        onError: (error) => console.error("광고 로드 실패:", error),
      });
    } catch (error) {
      console.error("광고 로드 예외:", error);
    }
  }, [adGroupId]);

  useEffect(() => {
    try {
      const supported = loadFullScreenAd.isSupported();
      setIsSupported(supported);
      if (supported) load();
    } catch {
      setIsSupported(false);
    }
    return () => {
      try {
        unregisterRef.current?.();
      } catch {
        /* ignore */
      }
    };
  }, [load]);

  const showAd = useCallback(
    (onReward?: (reward: AdReward) => void, onDismiss?: () => void) => {
      if (!isSupported || !isAdLoaded) {
        // In unsupported environments, let callers proceed gracefully.
        if (!isSupported) onDismiss?.();
        return;
      }
      setIsShowing(true);
      try {
        showFullScreenAd({
          options: { adGroupId },
          onEvent: (event) => {
            switch (event.type) {
              case "userEarnedReward":
                setLastReward(event.data);
                onReward?.(event.data);
                break;
              case "dismissed":
                setIsShowing(false);
                setIsAdLoaded(false);
                onDismiss?.();
                load();
                break;
              case "failedToShow":
                setIsShowing(false);
                setIsAdLoaded(false);
                load();
                break;
            }
          },
          onError: (error) => {
            console.error("광고 표시 실패:", error);
            setIsShowing(false);
            setIsAdLoaded(false);
            load();
          },
        });
      } catch (error) {
        console.error("광고 표시 예외:", error);
        setIsShowing(false);
        load();
      }
    },
    [adGroupId, isAdLoaded, isSupported, load],
  );

  return { isAdLoaded, isSupported, isShowing, lastReward, showAd };
}
