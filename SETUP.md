# 짠내왕 출시 준비 — 연결·기입 정보 순서 가이드

> 이 문서만 위에서부터 따라 하면 됩니다. 각 단계는 **① 어디서 발급 → ② 어떤 값 → ③ 어디에 입력** 순서입니다.
> 표기: 🔴 필수 / 🟡 권장 / ⚪ 나중에(실서비스 직전)

## 0. 현재 상태 (제가 끝낸 것)
- 코드/빌드 완료: 백엔드 `next build` ✓, 프론트 `.ait` 빌드 ✓ (3.6MB), 타입체크 ✓
- 로컬 구동 중: 백엔드 `localhost:3000`, 프론트 `localhost:5173`
- **남은 건 외부 서비스 연결값 입력뿐**입니다. 아래 순서대로 채우면 끝납니다.

---

## 1. 🔴 데이터베이스 — Supabase
앱의 모든 데이터(유저·상품·가격·추적·딜·꿀팁·절약·랭킹)가 여기 저장됩니다.

1. https://supabase.com → 로그인 → **New project** (Region: **Northeast Asia (Seoul)**)
2. 생성되면 좌측 **SQL Editor → New query** → 프로젝트의 `supabase/all_migrations.sql` **전체 복사·붙여넣기 → Run**
   - (users, products, price_history, user_trackings, deal_posts, tips, savings, 랭킹, RPC 등 전부 생성)
3. 좌측 **Project Settings → API**에서 아래 3개 값 복사:

| 값 | 환경변수 |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

→ 루트 `.env.local`에 입력 (아래 9번 템플릿 참고)

---

## 2. 🔴 상품·가격 검색 — 네이버 쇼핑 API (무료)
상품 검색과 가격 추적의 실제 데이터 출처입니다. (없으면 검색이 mock으로 동작)

1. https://developers.naver.com → 로그인 → **Application → 애플리케이션 등록**
2. 사용 API: **검색** 선택, 환경: **WEB 설정**(또는 비로그인 오픈 API)
3. 발급된 값 복사:

| 값 | 환경변수 |
|---|---|
| Client ID | `NAVER_CLIENT_ID` |
| Client Secret | `NAVER_CLIENT_SECRET` |

→ 루트 `.env.local`

---

## 3. 🔴 보안 키 (직접 생성)
| 환경변수 | 만드는 법 | 용도 |
|---|---|---|
| `SESSION_SECRET` | 터미널: `openssl rand -hex 32` | 로그인 세션 토큰 서명 |
| `CRON_SECRET` | 위와 동일하게 1개 더 | 크론(가격수집/알림) 인증 |

→ 루트 `.env.local`

---

## 4. 🟡 캐시·레이트리밋 — Upstash Redis (무료, 권장)
없어도 동작하지만, 랭킹/또래비교 캐시·꿀팁 도배 방지·핫팁 캐시가 켜집니다.

1. https://upstash.com → **Create Database** (Region: 가까운 곳, REST 활성)
2. 값 복사:

| 값 | 환경변수 |
|---|---|
| UPSTASH_REDIS_REST_URL | `UPSTASH_REDIS_REST_URL` |
| UPSTASH_REDIS_REST_TOKEN | `UPSTASH_REDIS_REST_TOKEN` |

→ 루트 `.env.local`

---

## 5. 🔴 백엔드 배포 — Vercel
프론트(.ait)는 토스 CDN, **백엔드(API+크론)는 Vercel**에 올립니다.

1. https://vercel.com → 이 저장소 연결(또는 `vercel` CLI) → 배포
2. Vercel 프로젝트 **Settings → Environment Variables**에 위 1~4의 값 + 아래를 모두 입력:
   - `NEXT_PUBLIC_APP_URL` = 배포된 백엔드 주소 (예: `https://jjannaewang.vercel.app`)
   - `ALLOWED_ORIGINS` = 앱인토스 CDN 주소 (6번에서 확정, 예: `https://jjannaewang.apps.tossmini.com`)
3. 크론(`vercel.json`에 이미 설정됨: 가격수집·알림·일일리포트·핫팁)은 배포 시 자동 등록됩니다.

> ⚠️ `git`은 현재 **로컬에만** 커밋돼 있습니다. Vercel 연결을 위해 GitHub에 푸시가 필요하면 알려주세요(제가 도와드립니다).

---

## 6. 🔴 앱인토스 콘솔 — 앱 등록 & 광고
1. https://apps-in-toss.toss.im → 미니앱 생성 → **appName** 발급, 아이콘 업로드
   → `ait/granite.config.ts`의 `appName`, `brand.icon`(이미지 URL) 교체
2. **광고그룹 ID** 발급 (전면형 / 보상형 / 배너 각각):

| 콘솔 광고그룹 | 환경변수(프론트) |
|---|---|
| 전면형(interstitial) | `VITE_AD_GROUP_INTERSTITIAL` |
| 보상형(rewarded) | `VITE_AD_GROUP_REWARDED` |
| 배너(banner) | `VITE_AD_GROUP_BANNER` |

→ `ait/.env`(또는 빌드 환경)에 입력
3. **CORS 허용 origin**에 백엔드 주소 등록 + 서비스 도메인(`https://<appName>.apps.tossmini.com`) 확인 → 5번 `ALLOWED_ORIGINS`에 반영
4. **사업자 등록 + 정산 계정** 연결 (광고/수익 정산용)

---

## 7. 🔴 프론트 빌드 & 업로드 (.ait)
```bash
cd ait
npm run build          # → ait/jjannaewang.ait 생성
npm run deploy         # 또는 콘솔에 .ait 직접 업로드 (deploy는 콘솔 API 키 필요)
```

---

## 8. ⚪ 토스 로그인(OAuth)·푸시 — 실서비스 직전
없으면 로컬/샌드박스에선 임시 유저로 동작합니다. 실서비스엔 필요합니다.

| 환경변수 | 어디서 | 용도 |
|---|---|---|
| `TOSS_PARTNER_API_BASE` | 앱인토스 콘솔/문서 | OAuth 토큰 교환 베이스 URL |
| `TOSS_PARTNER_CLIENT_ID` (+ mTLS 인증서) | 콘솔 | 로그인 코드 교환 |
| `TOSS_SMART_MESSAGE_TOKEN` | 콘솔(메시지 발송 스코프) | 가격 알림 푸시 발송 |
| `TOSS_TEMPLATE_PRICE_DROP` 등 | 콘솔(알림 동의문/템플릿) | 푸시 템플릿 코드 |

→ 루트 `.env.local`(=Vercel 환경변수)

---

## 9. 루트 `.env.local` 템플릿 (복사해서 채우기)
```bash
# 1) Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 2) 네이버 쇼핑 (필수)
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# 3) 보안 키 (openssl rand -hex 32 로 각각 생성)
SESSION_SECRET=
CRON_SECRET=

# 4) Upstash Redis (권장)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# 5) 앱/배포
NEXT_PUBLIC_APP_URL=https://jjannaewang.vercel.app
ALLOWED_ORIGINS=https://jjannaewang.apps.tossmini.com

# 8) 토스 OAuth/푸시 (실서비스 직전)
TOSS_PARTNER_API_BASE=
TOSS_PARTNER_CLIENT_ID=
TOSS_SMART_MESSAGE_TOKEN=
TOSS_TEMPLATE_PRICE_DROP=price_drop_alert
TOSS_TEMPLATE_DAILY_REPORT=daily_savings_report
TOSS_TEMPLATE_HOT_DEAL=hot_deal_alert
```
프론트 `ait/.env`:
```bash
VITE_API_BASE_URL=https://jjannaewang.vercel.app
VITE_AD_GROUP_INTERSTITIAL=
VITE_AD_GROUP_REWARDED=
VITE_AD_GROUP_BANNER=
VITE_APP_VERSION=0.1.0
```

---

## 10. 🔴 샌드박스 테스트 → 심사 → 출시
1. 앱인토스 **샌드박스 앱**으로 실기기 테스트 (로그인/검색/추적/광고/알림)
2. 콘솔에서 **심사 요청** (비게임 출시 체크리스트 확인)
3. 승인 후 **출시하기**

## 최소 런칭(빠른 길)
1(Supabase) → 2(네이버) → 3(시크릿) → 5(Vercel 배포) → 6(콘솔 앱등록+광고그룹+CORS) → 7(.ait 업로드) → 10(샌드박스→심사).
8(OAuth·푸시)은 그 다음에 붙여도 됩니다(그 전엔 임시 유저/모의 푸시).
