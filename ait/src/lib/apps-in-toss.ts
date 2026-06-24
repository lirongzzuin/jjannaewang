// Apps-in-Toss SDK wrapper (web-framework v2.x current API)
// The package is a real dependency, bundled into the .ait by Vite.
// Outside the Toss runtime (plain browser via `vite dev`/`preview`) the SDK
// functions are unsupported, so we provide dev mocks gated on `.isSupported()`.

import * as AIT from "@apps-in-toss/web-framework";

// ─── Re-exported types ───────────────────────────────────────────────────────

export type TossReferrer = "DEFAULT" | "SANDBOX";

export interface LoginResult {
  authorizationCode: string;
  referrer: TossReferrer;
}

export interface PendingOrder {
  orderId: string;
  sku: string;
}

export interface AdReward {
  unitType: string;
  unitAmount: number;
}

export type AdEvent =
  | { type: "loaded" }
  | { type: "userEarnedReward"; data: AdReward }
  | { type: "dismissed" }
  | { type: "failedToShow" }
  | { type: "failed_to_load" };

interface FullScreenAdParams {
  options: { adGroupId: string };
  onEvent?: (event: AdEvent) => void;
  onError?: (error: Error) => void;
}

// ─── Runtime detection ──────────────────────────────────────────────────────

/** True when running inside the real Toss runtime (sandbox or production app). */
export function isTossApp(): boolean {
  try {
    const fn = (AIT as Record<string, unknown>).loadFullScreenAd as
      | { isSupported?: () => boolean }
      | undefined;
    if (fn && typeof fn.isSupported === "function") return fn.isSupported();
  } catch {
    /* ignore */
  }
  return false;
}

/** Dev mocks run when not inside Toss (e.g. browser dev server). */
const USE_MOCK = !isTossApp();

// ─── Auth ───────────────────────────────────────────────────────────────────

/**
 * Initiate Toss login. Returns { authorizationCode, referrer }.
 * Exchange `authorizationCode` server-side (POST /api/auth/toss) for user info.
 */
export async function appLogin(): Promise<LoginResult> {
  if (!USE_MOCK && typeof AIT.appLogin === "function") {
    return AIT.appLogin() as Promise<LoginResult>;
  }
  return { authorizationCode: "mock-auth-code-" + Date.now(), referrer: "SANDBOX" };
}

// ─── IAP ────────────────────────────────────────────────────────────────────

interface PurchaseParams {
  options: {
    sku: string;
    processProductGrant: (p: { orderId: string }) => Promise<boolean> | boolean;
  };
  onEvent?: (event: { type: "SUCCESS" | "CANCEL" | "PENDING" }) => void;
  onError?: (error: Error) => void;
}

/**
 * Create a one-time purchase order (callback pattern, NOT async/await).
 * Returns a cleanup function — call it to dismiss the purchase sheet.
 */
export function createOneTimePurchaseOrder(params: PurchaseParams): () => void {
  if (!USE_MOCK && typeof AIT.IAP?.createOneTimePurchaseOrder === "function") {
    return AIT.IAP.createOneTimePurchaseOrder(params as never) as () => void;
  }
  // Dev mock: simulate a successful purchase after 1.2s
  const timer = setTimeout(async () => {
    try {
      const granted = await params.options.processProductGrant({
        orderId: "mock-order-" + Date.now(),
      });
      if (granted) params.onEvent?.({ type: "SUCCESS" });
      else params.onError?.(new Error("processProductGrant returned false"));
    } catch (err) {
      params.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, 1200);
  return () => clearTimeout(timer);
}

/** Fetch pending (unprocessed) IAP orders. Call on app start to resume them. */
export async function getPendingOrders(): Promise<{ orders: PendingOrder[] }> {
  if (!USE_MOCK && typeof AIT.IAP?.getPendingOrders === "function") {
    return AIT.IAP.getPendingOrders() as Promise<{ orders: PendingOrder[] }>;
  }
  return { orders: [] };
}

/** Notify the SDK that the server has fulfilled an order. */
export async function completeProductGrant(params: {
  params: { orderId: string };
}): Promise<void> {
  if (!USE_MOCK && typeof AIT.IAP?.completeProductGrant === "function") {
    await (AIT.IAP.completeProductGrant(params as never) as Promise<unknown>);
    return;
  }
  console.log("[Mock] completeProductGrant", params.params.orderId);
}

// ─── Share ──────────────────────────────────────────────────────────────────

/** Share text via the Toss share sheet (falls back to clipboard in dev). */
export async function share(params: { message: string }): Promise<void> {
  if (!USE_MOCK && typeof AIT.share === "function") {
    return AIT.share(params as never) as Promise<void>;
  }
  try {
    await navigator.clipboard.writeText(params.message);
    alert("링크가 복사됐어요!");
  } catch {
    alert(params.message);
  }
}

/** Generate a Toss-formatted deep link for sharing. */
export async function getTossShareLink(url: string, ogImageUrl?: string): Promise<string> {
  if (!USE_MOCK && typeof AIT.getTossShareLink === "function") {
    return AIT.getTossShareLink(url as never, ogImageUrl as never) as Promise<string>;
  }
  return url;
}

// ─── Ads (full-screen: interstitial + rewarded) ──────────────────────────────
// adGroupId (from console)决定 interstitial(전면형) vs rewarded(보상형).

/**
 * Load a full-screen ad. Fires onEvent({type:'loaded'}) when ready.
 * Returns an unregister function.
 */
export function loadFullScreenAd(params: FullScreenAdParams): () => void {
  if (!USE_MOCK && typeof AIT.loadFullScreenAd === "function") {
    return AIT.loadFullScreenAd(params as never) as () => void;
  }
  // Dev mock: emit 'loaded' shortly after.
  const t = setTimeout(() => params.onEvent?.({ type: "loaded" }), 400);
  return () => clearTimeout(t);
}
loadFullScreenAd.isSupported = (): boolean => isTossApp();

/**
 * Show a previously-loaded full-screen ad.
 * Rewarded ads fire onEvent({type:'userEarnedReward', data}) before 'dismissed'.
 */
export function showFullScreenAd(params: FullScreenAdParams): () => void {
  if (!USE_MOCK && typeof AIT.showFullScreenAd === "function") {
    return AIT.showFullScreenAd(params as never) as () => void;
  }
  // Dev mock: grant reward then dismiss so the unlock flow is testable.
  const t = setTimeout(() => {
    params.onEvent?.({ type: "userEarnedReward", data: { unitType: "unlock", unitAmount: 1 } });
    params.onEvent?.({ type: "dismissed" });
  }, 600);
  return () => clearTimeout(t);
}
showFullScreenAd.isSupported = (): boolean => isTossApp();

// ─── Viral / Referral ────────────────────────────────────────────────────────

/** Open the Toss contacts viral sheet for friend invitation with rewards. */
export async function contactsViral(params?: {
  options?: { moduleId?: string };
  onEvent?: (event: { type: string; data?: unknown }) => void;
  onError?: (error: Error) => void;
}): Promise<void> {
  if (!USE_MOCK && typeof AIT.contactsViral === "function") {
    return AIT.contactsViral((params ?? {}) as never) as unknown as Promise<void>;
  }
  alert("친구 초대 기능은 토스 앱에서 사용할 수 있어요!");
}

// ─── Push notification consent ───────────────────────────────────────────────
// Captures advance-consent for categories Toss supports (price-change alerts,
// restock, etc.). The actual messages are sent server-side via Smart Messaging.

export interface NotificationAgreementParams {
  onEvent?: (event: {
    type: "newAgreement" | "alreadyAgreed" | "agreementRejected";
  }) => void;
  onError?: (error: Error) => void;
}

/** Request push opt-in. Returns true if the user is (now or already) agreed. */
export async function requestNotificationAgreement(
  params?: NotificationAgreementParams,
): Promise<boolean> {
  if (!USE_MOCK && typeof AIT.requestNotificationAgreement === "function") {
    return new Promise<boolean>((resolve) => {
      try {
        AIT.requestNotificationAgreement({
          onEvent: (event: { type: string }) => {
            params?.onEvent?.(event as never);
            if (event.type === "newAgreement" || event.type === "alreadyAgreed") resolve(true);
            else resolve(false);
          },
          onError: (error: Error) => {
            params?.onError?.(error);
            resolve(false);
          },
        } as never);
      } catch (error) {
        params?.onError?.(error instanceof Error ? error : new Error(String(error)));
        resolve(false);
      }
    });
  }
  // Dev mock: pretend the user agreed.
  params?.onEvent?.({ type: "newAgreement" });
  return true;
}

// ─── App review prompt ───────────────────────────────────────────────────────

/** Ask the user to review the app (display not guaranteed; never gate rewards). */
export async function requestReview(): Promise<void> {
  if (!USE_MOCK && typeof AIT.requestReview === "function") {
    try {
      await (AIT.requestReview as unknown as () => Promise<void>)();
    } catch {
      /* display not guaranteed */
    }
  }
}

// ─── Haptics ─────────────────────────────────────────────────────────────────

/** Light haptic feedback for satisfying micro-interactions. */
export function haptic(type: "tickWeak" | "tick" | "softMedium" | "basicWeak" = "tick"): void {
  if (!USE_MOCK && typeof AIT.generateHapticFeedback === "function") {
    try {
      AIT.generateHapticFeedback({ type } as never);
    } catch {
      /* not supported */
    }
  }
}

// ─── Banner ad ───────────────────────────────────────────────────────────────

export interface BannerOptions {
  theme?: "auto" | "light" | "dark";
  tone?: "blackAndWhite" | "grey";
  variant?: "card" | "expanded";
}

/**
 * Attach a Toss banner ad into `target`. Returns a cleanup function.
 * No-op (returns noop cleanup) outside the Toss runtime.
 */
export function attachBanner(
  adGroupId: string,
  target: HTMLElement,
  options?: BannerOptions,
): () => void {
  if (
    !USE_MOCK &&
    AIT.TossAds &&
    typeof AIT.TossAds.attachBanner === "function"
  ) {
    try {
      const handle = (
        AIT.TossAds.attachBanner as unknown as (
          adGroupId: string,
          target: HTMLElement,
          options?: BannerOptions,
        ) => unknown
      )(adGroupId, target, options ?? {});
      return () => {
        try {
          if (typeof (handle as { destroy?: () => void })?.destroy === "function") {
            (handle as { destroy: () => void }).destroy();
          }
        } catch {
          /* ignore */
        }
      };
    } catch (error) {
      console.error("배너 광고 attach 실패:", error);
      return () => {};
    }
  }
  return () => {};
}

/** Whether banner ads are supported in the current runtime. */
export function isBannerSupported(): boolean {
  try {
    const fn = (AIT.TossAds?.attachBanner as { isSupported?: () => boolean } | undefined);
    if (fn && typeof fn.isSupported === "function") return fn.isSupported();
  } catch {
    /* ignore */
  }
  return isTossApp();
}
