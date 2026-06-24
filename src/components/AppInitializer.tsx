'use client';
import { useEffect } from 'react';
import { getPendingOrders, completeProductGrant } from '@/lib/apps-in-toss';

/**
 * Runs once on app mount to resume any interrupted IAP purchases.
 * Must be a client component; imported into the server layout.
 */
export default function AppInitializer() {
  useEffect(() => {
    async function resumePending() {
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
      } catch {
        // Silently ignore — best-effort on startup
      }
    }
    resumePending();
  }, []);

  return null;
}
