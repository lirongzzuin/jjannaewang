import { useEffect } from "react";
import {
  appLogin,
  getPendingOrders,
  completeProductGrant,
  type LoginResult,
} from "@/lib/apps-in-toss";
import { api } from "@/lib/api";
import { getToken, setToken } from "@/lib/session";
import { useAppStore } from "@/store";
import type { User } from "@/types";

/**
 * App bootstrap. Apps-in-Toss has no separate login screen — we use the Toss
 * identity directly. On launch we silently authenticate (returning users get no
 * window; first-timers see Toss's own consent), then resume IAP + streak.
 */
export default function AppInitializer() {
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    (async () => {
      // 1) Auto-auth with the Toss identity (no custom login UI).
      if (!getToken()) {
        try {
          const result: LoginResult = await appLogin();
          const data = await api.post<{ token: string; user: User }>("/api/auth/toss", {
            authorizationCode: result.authorizationCode,
            referrer: result.referrer,
          });
          setToken(data.token);
          setUser(data.user);
        } catch {
          // Stay in guest mode if auth fails (e.g. backend offline in dev).
        }
      }

      // 2) Resume any interrupted IAP purchases.
      try {
        const { orders } = await getPendingOrders();
        for (const order of orders) {
          await api
            .post("/api/iap-webhook", {
              orderId: order.orderId,
              sku: order.sku,
              event: "RESUME",
            })
            .catch(() => {});
          await completeProductGrant({ params: { orderId: order.orderId } }).catch(() => {});
        }
      } catch {
        /* best-effort */
      }

      // 3) Daily attendance streak + refresh user (keeps tier/expiry fresh).
      if (getToken()) {
        await api.post("/api/me/streak", {}).catch(() => {});
        await api
          .get<{ user: User }>("/api/me")
          .then((me) => me?.user && setUser(me.user))
          .catch(() => {});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
