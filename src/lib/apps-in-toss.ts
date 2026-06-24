// Apps-in-Toss SDK wrapper
// Production: the Toss mini-app shell provides '@apps-in-toss/web-framework' at runtime.
// Dev/build:  falls back to in-browser stubs.
//   - webpack externals (next.config.mjs) prevent the package from being bundled.
//   - src/types/apps-in-toss-framework.d.ts satisfies TypeScript's type resolution.

// ─── Re-exported types ───────────────────────────────────────────────────────

export type TossReferrer = 'DEFAULT' | 'SANDBOX';

export interface LoginResult {
  authorizationCode: string;
  referrer: TossReferrer;
}

export interface PendingOrder {
  orderId: string;
  sku: string;
}

export interface PurchaseOrderOptions {
  sku: string;
  /** Called on payment success. Fulfill server-side; return true to confirm, false to reject. */
  processProductGrant: (params: { orderId: string }) => Promise<boolean>;
}

export interface PurchaseOrderParams {
  options: PurchaseOrderOptions;
  onEvent?: (event: { type: 'SUCCESS' | 'CANCEL' | 'PENDING' }) => void;
  onError?: (error: Error) => void;
}

export interface AdMobParams {
  options: { adGroupId: string };
  onEvent?: (event: { type: 'loaded' | 'rewarded' | 'closed' | 'failed_to_load' }) => void;
  onError?: (error: Error) => void;
}

// ─── Runtime detection ──────────────────────────────────────────────────────

function isTossApp(): boolean {
  if (typeof window === 'undefined') return false;
  // The real SDK injects __APPS_IN_TOSS__ into the global scope
  return typeof (window as unknown as Record<string, unknown>).__APPS_IN_TOSS__ !== 'undefined';
}

// ─── Auth ───────────────────────────────────────────────────────────────────

/**
 * Initiate Toss login.
 * Returns { authorizationCode, referrer }.
 * Exchange `authorizationCode` with your server to obtain user info (userId, nickname, …).
 */
export async function appLogin(): Promise<LoginResult> {
  if (isTossApp()) {
    const { appLogin: sdkLogin } = await import('@apps-in-toss/web-framework');
    return sdkLogin();
  }
  return {
    authorizationCode: 'mock-auth-code-' + Date.now(),
    referrer: 'SANDBOX' as TossReferrer,
  };
}

// ─── IAP ────────────────────────────────────────────────────────────────────

/**
 * Create a one-time purchase order (callback pattern, NOT async/await).
 * Returns a cleanup function — call it to dismiss the purchase sheet.
 *
 * `processProductGrant` is invoked on payment success; fulfill the order
 * server-side inside it and return true to confirm or false to reject.
 */
export function createOneTimePurchaseOrder(params: PurchaseOrderParams): () => void {
  if (isTossApp()) {
    let cleanup: (() => void) | undefined;
    import('@apps-in-toss/web-framework').then(({ createOneTimePurchaseOrder: sdkCreate }) => {
      cleanup = sdkCreate(params);
    });
    return () => cleanup?.();
  }

  // Dev mock: simulate a successful purchase after 1.5 s
  const timer = setTimeout(async () => {
    try {
      const mockOrderId = 'mock-order-' + Date.now();
      const granted = await params.options.processProductGrant({ orderId: mockOrderId });
      if (granted) {
        params.onEvent?.({ type: 'SUCCESS' });
      } else {
        params.onError?.(new Error('processProductGrant returned false'));
      }
    } catch (err) {
      params.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, 1500);

  return () => clearTimeout(timer);
}

/**
 * Fetch pending (unprocessed) IAP orders.
 * Call on app start to resume any purchases that were interrupted.
 */
export async function getPendingOrders(): Promise<{ orders: PendingOrder[] }> {
  if (isTossApp()) {
    const { getPendingOrders: sdkGet } = await import('@apps-in-toss/web-framework');
    return sdkGet();
  }
  return { orders: [] };
}

/**
 * Notify the SDK that the server has processed (fulfilled) an order.
 * Note the double-nested `{ params: { orderId } }` shape required by the real SDK.
 */
export async function completeProductGrant(params: { params: { orderId: string } }): Promise<void> {
  if (isTossApp()) {
    const { completeProductGrant: sdkComplete } = await import('@apps-in-toss/web-framework');
    return sdkComplete(params);
  }
  console.log('[Mock] completeProductGrant', params.params.orderId);
}

// ─── Share ───────────────────────────────────────────────────────────────────

/**
 * Share a text message via the Toss share sheet.
 * Build the message string with getTossShareLink() before calling this.
 */
export async function share(params: { message: string }): Promise<void> {
  if (isTossApp()) {
    const { share: sdkShare } = await import('@apps-in-toss/web-framework');
    return sdkShare(params);
  }
  try {
    await navigator.clipboard.writeText(params.message);
    alert('링크가 복사됐어요!');
  } catch {
    alert(params.message);
  }
}

/**
 * Generate a Toss-formatted deep link suitable for sharing.
 * Pass the result as part of the message to share().
 */
export async function getTossShareLink(url: string, ogImageUrl?: string): Promise<string> {
  if (isTossApp()) {
    const { getTossShareLink: sdkGet } = await import('@apps-in-toss/web-framework');
    return sdkGet(url, ogImageUrl);
  }
  return url;
}

// ─── Ads (Google AdMob via Toss) ─────────────────────────────────────────────

/**
 * Two-step reward-ad flow:
 *  1. loadAppsInTossAdMob() → fires onEvent({ type: 'loaded' }) when ready
 *  2. Inside the 'loaded' handler: call showAppsInTossAdMob()
 *  3. onEvent({ type: 'rewarded' }) fires when the user completes the ad
 */
export const GoogleAdMob = {
  loadAppsInTossAdMob(params: AdMobParams): () => void {
    if (isTossApp()) {
      let cleanup: (() => void) | undefined;
      import('@apps-in-toss/web-framework').then(({ GoogleAdMob: sdk }) => {
        cleanup = sdk.loadAppsInTossAdMob(params);
      });
      return () => cleanup?.();
    }
    // Dev mock: emit 'loaded' after 500 ms
    const t = setTimeout(() => params.onEvent?.({ type: 'loaded' }), 500);
    return () => clearTimeout(t);
  },

  showAppsInTossAdMob(): void {
    if (isTossApp()) {
      import('@apps-in-toss/web-framework').then(({ GoogleAdMob: sdk }) => {
        sdk.showAppsInTossAdMob();
      });
      return;
    }
    // Dev mock: no-op
  },
};

// ─── Viral / Referral ────────────────────────────────────────────────────────

/**
 * Open the Toss contacts viral sheet for friend invitation with rewards.
 */
export async function contactsViral(): Promise<void> {
  if (isTossApp()) {
    const { contactsViral: sdkViral } = await import('@apps-in-toss/web-framework');
    return sdkViral();
  }
  alert('친구 초대 기능은 토스 앱에서 사용할 수 있어요!');
}
