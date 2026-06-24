import { useEffect } from "react";
import { getPendingOrders, completeProductGrant } from "@/lib/apps-in-toss";
import { api } from "@/lib/api";
import { getToken } from "@/lib/session";

/**
 * Runs once on app mount:
 *  - resumes any interrupted IAP purchases
 *  - pings the streak endpoint (daily attendance) when authenticated
 */
export default function AppInitializer() {
  useEffect(() => {
    (async () => {
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

      if (getToken()) {
        await api.post("/api/me/streak", {}).catch(() => {});
      }
    })();
  }, []);

  return null;
}
