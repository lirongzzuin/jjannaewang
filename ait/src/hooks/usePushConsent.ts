import { useCallback, useState } from "react";
import { requestNotificationAgreement } from "@/lib/apps-in-toss";
import { api } from "@/lib/api";
import { getToken } from "@/lib/session";

const LOCAL_KEY = "jjannaewang-push-consent";

/**
 * Push-notification consent.
 * Used right when a user enables a price alert (high-intent moment) so the
 * backend Smart Messaging cron can deliver "가격 변동 알림" to them.
 */
export function usePushConsent() {
  const [agreed, setAgreed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_KEY) === "1";
    } catch {
      return false;
    }
  });

  const ensureConsent = useCallback(async (): Promise<boolean> => {
    if (agreed) return true;
    const ok = await requestNotificationAgreement();
    if (ok) {
      try {
        localStorage.setItem(LOCAL_KEY, "1");
      } catch {
        /* ignore */
      }
      setAgreed(true);
      // Best-effort: record consent server-side so cron knows who to message.
      if (getToken()) {
        await api.post("/api/me/notification-consent", { agreed: true }).catch(() => {});
      }
    }
    return ok;
  }, [agreed]);

  return { agreed, ensureConsent };
}
