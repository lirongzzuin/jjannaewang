import { useState, useCallback, useRef } from "react";
import {
  createOneTimePurchaseOrder,
  createSubscriptionPurchaseOrder,
  getPendingOrders,
  completeProductGrant,
  type PendingOrder,
} from "@/lib/apps-in-toss";
import { api } from "@/lib/api";

export type PurchaseStatus = "idle" | "pending" | "success" | "cancelled" | "error";

interface IAPState {
  status: PurchaseStatus;
  error: string | null;
}

/**
 * Apps-in-Toss In-App Purchase hook.
 * processProductGrant → POST /api/iap-webhook (server verifies + fulfills),
 * then completeProductGrant() to notify the SDK.
 */
export function useIAP() {
  const [state, setState] = useState<IAPState>({ status: "idle", error: null });
  const cleanupRef = useRef<(() => void) | null>(null);

  const run = useCallback(
    (
      create: typeof createOneTimePurchaseOrder,
      sku: string,
      onSuccess?: () => void,
      onCancel?: () => void,
    ): (() => void) => {
      setState({ status: "pending", error: null });
      const cleanup = create({
        options: {
          sku,
          processProductGrant: async ({ orderId }) => {
            try {
              // Server verifies the order with Toss + grants the entitlement.
              await api.post("/api/iap-webhook", { orderId, sku, event: "PURCHASE_COMPLETED" });
              await completeProductGrant({ params: { orderId } });
              return true;
            } catch (err) {
              console.error("processProductGrant error:", err);
              return false;
            }
          },
        },
        onEvent: (event) => {
          if (event.type === "SUCCESS") {
            setState({ status: "success", error: null });
            onSuccess?.();
          } else if (event.type === "CANCEL") {
            setState({ status: "cancelled", error: null });
            onCancel?.();
          }
        },
        onError: (err) => setState({ status: "error", error: err.message }),
      });
      cleanupRef.current = cleanup;
      return cleanup;
    },
    [],
  );

  // One-time purchase.
  const purchase = useCallback(
    (sku: string, onSuccess?: () => void, onCancel?: () => void) =>
      run(createOneTimePurchaseOrder, sku, onSuccess, onCancel),
    [run],
  );

  // Auto-renewing subscription (monthly Premium tiers).
  const subscribe = useCallback(
    (sku: string, onSuccess?: () => void, onCancel?: () => void) =>
      run(createSubscriptionPurchaseOrder, sku, onSuccess, onCancel),
    [run],
  );

  const resumePendingOrders = useCallback(async (): Promise<PendingOrder[]> => {
    try {
      const { orders } = await getPendingOrders();
      for (const order of orders) {
        await api
          .post("/api/iap-webhook", { orderId: order.orderId, sku: order.sku, event: "RESUME" })
          .catch(console.error);
        await completeProductGrant({ params: { orderId: order.orderId } }).catch(console.error);
      }
      return orders;
    } catch (err) {
      console.error("resumePendingOrders error:", err);
      return [];
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle", error: null }), []);

  return { ...state, purchase, subscribe, resumePendingOrders, reset };
}
