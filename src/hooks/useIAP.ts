'use client';
import { useState, useCallback, useRef } from 'react';
import {
  createOneTimePurchaseOrder,
  getPendingOrders,
  completeProductGrant,
  type PendingOrder,
} from '@/lib/apps-in-toss';

export type PurchaseStatus = 'idle' | 'pending' | 'success' | 'cancelled' | 'error';

interface IAPState {
  status: PurchaseStatus;
  error: string | null;
}

/**
 * Hook for Apps-in-Toss In-App Purchase.
 *
 * Usage:
 *   const { purchase, status } = useIAP();
 *   const cancel = purchase('premium_pro_monthly', onSuccess, onCancel);
 *   // cancel() dismisses the purchase sheet if still open
 */
export function useIAP() {
  const [state, setState] = useState<IAPState>({ status: 'idle', error: null });
  const cleanupRef = useRef<(() => void) | null>(null);

  /**
   * Initiate a purchase.
   * Returns a cleanup function to cancel the purchase UI if needed.
   *
   * processProductGrant → calls /api/iap-webhook to fulfill server-side,
   * then completeProductGrant() to notify the SDK.
   */
  const purchase = useCallback(
    (sku: string, onSuccess?: () => void, onCancel?: () => void): (() => void) => {
      setState({ status: 'pending', error: null });

      const cleanup = createOneTimePurchaseOrder({
        options: {
          sku,
          processProductGrant: async ({ orderId }) => {
            try {
              const res = await fetch('/api/iap-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, sku, event: 'PURCHASE_COMPLETED' }),
              });
              if (!res.ok) throw new Error('Server grant failed');

              // Double-nested params shape required by the real SDK
              await completeProductGrant({ params: { orderId } });
              return true;
            } catch (err) {
              console.error('processProductGrant error:', err);
              return false;
            }
          },
        },
        onEvent: (event) => {
          if (event.type === 'SUCCESS') {
            setState({ status: 'success', error: null });
            onSuccess?.();
          } else if (event.type === 'CANCEL') {
            setState({ status: 'cancelled', error: null });
            onCancel?.();
          }
        },
        onError: (err) => {
          setState({ status: 'error', error: err.message });
        },
      });

      cleanupRef.current = cleanup;
      return cleanup;
    },
    [],
  );

  /**
   * Resume any pending orders from interrupted purchases.
   * Call this once on app startup (e.g. in layout.tsx).
   */
  const resumePendingOrders = useCallback(async (): Promise<PendingOrder[]> => {
    try {
      const { orders } = await getPendingOrders();
      for (const order of orders) {
        await fetch('/api/iap-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.orderId, sku: order.sku, event: 'RESUME' }),
        }).catch(console.error);
        await completeProductGrant({ params: { orderId: order.orderId } }).catch(console.error);
      }
      return orders;
    } catch (err) {
      console.error('resumePendingOrders error:', err);
      return [];
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle', error: null }), []);

  return { ...state, purchase, resumePendingOrders, reset };
}
