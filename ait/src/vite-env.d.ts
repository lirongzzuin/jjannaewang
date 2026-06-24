/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AD_GROUP_INTERSTITIAL?: string;
  readonly VITE_AD_GROUP_REWARDED?: string;
  readonly VITE_AD_GROUP_BANNER?: string;
  readonly VITE_CONTACTS_VIRAL_MODULE_ID?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
