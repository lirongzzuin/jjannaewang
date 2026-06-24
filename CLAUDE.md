# 짠내왕 (jjannaewang)

Toss App-in-Toss mini-app — price tracking + savings community.

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase (DB + auth), Upstash Redis (rate limiting, ranking)
- `@apps-in-toss/web-framework` — runtime-only (webpack external, NOT installed)

## Key patterns
- DB: `createServerClient()` in API routes, `getSupabase()` on client
- Redis: `getRedis()` lazy singleton
- Toss SDK: always check `isTossApp()` first, provide mock fallback
- IAP: callback pattern via `createOneTimePurchaseOrder`, never async/await

## Design
- Primary: `#ffb700`, background: `#f8f8f5`
- Mobile-first, max-w-[430px], Manrope font

## Conventions
- Korean UI text, English code
- API routes return `{ error: string }` on failure with appropriate HTTP status
- No `any` — use type shims or proper casts
