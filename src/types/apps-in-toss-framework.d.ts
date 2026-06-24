// Type shim for @apps-in-toss/web-framework
// The real package is only available inside the Toss mini-app shell at runtime.
// It is marked as a webpack external (next.config.mjs), so it is never bundled.
// This file satisfies TypeScript's module resolution at build time.
declare module '@apps-in-toss/web-framework' {
  export type TossReferrer = 'DEFAULT' | 'SANDBOX';

  export function appLogin(): Promise<{ authorizationCode: string; referrer: TossReferrer }>;

  export function createOneTimePurchaseOrder(params: {
    options: {
      sku: string;
      processProductGrant: (p: { orderId: string }) => Promise<boolean>;
    };
    onEvent?: (event: { type: 'SUCCESS' | 'CANCEL' | 'PENDING' }) => void;
    onError?: (error: Error) => void;
  }): () => void;

  export function getPendingOrders(): Promise<{ orders: { orderId: string; sku: string }[] }>;

  export function completeProductGrant(params: { params: { orderId: string } }): Promise<void>;

  export function share(params: { message: string }): Promise<void>;

  export function getTossShareLink(url: string, ogImageUrl?: string): Promise<string>;

  export const GoogleAdMob: {
    loadAppsInTossAdMob(params: {
      options: { adGroupId: string };
      onEvent?: (event: { type: 'loaded' | 'rewarded' | 'closed' | 'failed_to_load' }) => void;
      onError?: (error: Error) => void;
    }): () => void;
    showAppsInTossAdMob(): void;
  };

  export function contactsViral(): Promise<void>;
}
