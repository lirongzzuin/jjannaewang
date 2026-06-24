# 짠내왕 앱인토스 출시 가이드

최저가 추적 + 절약 커뮤니티 미니앱을 앱인토스에 출시하기 위한 전체 절차입니다.

## 1. 아키텍처

앱인토스는 **정적 프론트엔드 번들(`.ait`)** 을 Toss CDN에 올려 WebView로 서빙하고,
백엔드는 **파트너가 별도 호스팅**합니다. 그래서 두 부분으로 나뉩니다.

| 영역 | 위치 | 스택 | 배포 |
|---|---|---|---|
| 프론트엔드 (`.ait`) | `ait/` | Vite + React 18 + TS + Tailwind + `@apps-in-toss/web-framework` | `ait deploy` → Toss CDN (`<appName>.apps.tossmini.com`) |
| 백엔드 (API/cron) | 루트 (`src/app/api`) | Next.js 14 App Router | Vercel |

프론트엔드는 `VITE_API_BASE_URL`로 백엔드를 호출합니다. 백엔드는 `src/middleware.ts`에서
`*.tossmini.com` 오리진에 대해 CORS를 허용합니다.

## 2. 로컬 개발

```bash
# 백엔드 (루트)
npm install
npm run dev                 # http://localhost:3000

# 프론트엔드 (.ait SPA)
cd ait
npm install
npm run dev                 # granite dev → http://localhost:5173
```

`ait/.env` 에 `VITE_API_BASE_URL=http://localhost:3000` 를 두면 로컬 백엔드와 연동됩니다.
토스 런타임이 아닌 일반 브라우저에서는 로그인/광고/IAP/푸시가 **mock**으로 동작해 흐름을
그대로 테스트할 수 있습니다.

## 3. `.ait` 빌드 & 배포

```bash
cd ait
npm run build               # = ait build → ait/jjannaewang.ait 생성 (현재 ~3.6MB, 100MB 제한)
npm run deploy              # = ait deploy (콘솔 API 키 필요)
```

빌드 검증 완료: `vite build` / `ait build` 모두 통과, `tsc` 타입체크 클린.

## 4. 앱인토스 콘솔 설정 (필수 — 개발자 계정 필요)

> 아래는 제가 코드로 끝낼 수 없는, **콘솔/계정에서 직접** 해야 하는 항목입니다.

1. **앱 등록**: apps-in-toss.toss.im 에서 미니앱 생성 → `appName` 발급.
   - `ait/granite.config.ts` 의 `appName`, `brand.displayName`, `brand.icon`(콘솔 업로드 이미지 URL) 교체.
2. **광고그룹 ID 발급**: 전면형 / 보상형 / 배너 각각 생성 후 `ait/.env` 에 설정.
   - `VITE_AD_GROUP_INTERSTITIAL`, `VITE_AD_GROUP_REWARDED`, `VITE_AD_GROUP_BANNER`
   - (개발 중에는 테스트 ID `ait-ad-test-*` 사용 가능)
3. **사업자 등록 + 정산 계정**: 정산은 사업자 단위(앱 단위 아님). 광고/IAP 수익 정산에 필요.
4. **파트너 인증서/키 (OAuth mTLS)**: 로그인 코드 교환에 필요.
   - 백엔드 `.env`: `TOSS_PARTNER_API_BASE`, `TOSS_PARTNER_CLIENT_ID` (+ mTLS 인증서 설정)
   - 미설정 시 백엔드는 **샌드박스 유저로 폴백**(개발용). 실서비스 전 반드시 설정.
5. **푸시(Smart Messaging) 설정**: 메시지 발송 스코프 토큰 + 알림 동의문/`templateCode` 등록.
   - 백엔드 `.env`: `TOSS_SMART_MESSAGE_TOKEN`, `TOSS_TEMPLATE_PRICE_DROP` 등
   - "가격 변동 알림"은 기능성(transactional) 메시지로 분류됩니다.
6. **CORS 오리진 등록**: 콘솔의 origin 허용목록에 백엔드 도메인 등록.
   - 백엔드 `.env`: `ALLOWED_ORIGINS` 에 필요한 오리진 추가.
7. **샌드박스 테스트**: 샌드박스 앱 + 실기기로 로그인/광고/추적/푸시 동작 확인.
8. **심사 제출 → 출시**: 비게임 출시 체크리스트 확인 후 심사 요청 → 승인 후 "출시하기".

### 심사 통과 팁 (조사 기반)
- **로그인 강제 전 서비스 설명 인트로 필수** → `ait` 의 `/onboarding` 화면이 이를 충족.
- 최신 SDK 사용(현재 `@apps-in-toss/web-framework@^2.9.2`).
- 보상형 광고는 `userEarnedReward` 이벤트에만 보상 지급(코드 준수됨).
- 가격/제휴 정보 면책 문구 노출(온보딩·꿀팁 보드에 포함).

## 5. 수익 구조 (적용됨)

- **배너 광고**: 피드 4개마다 in-feed 네이티브 배너 (`TossAds.attachBanner`).
- **전면 광고**: 상품 상세 N회 조회마다 (`loadFullScreenAd`/`showFullScreenAd`, PRO 제외).
- **보상형 광고 언락**: 추적 슬롯 +1, 상품 AI 분석 1회 미리보기 (`userEarnedReward` 검증).
- (IAP 프리미엄·토스 포인트 프로모션은 코드 골격만 유지, 이번 범위 외)

정산(2026 기준): 광고는 중개비 차감 후 토스 15%, IAP는 스토어 15% + 토스 5%.

## 6. 앱인토스 SDK 데이터·기능 활용 (적용/검토 결과)

| 기능 | 적용 | 비고 |
|---|---|---|
| 푸시 알림 (가격 변동/리포트) | ✅ | `requestNotificationAgreement` + Smart Messaging 크론. **최고 가치** |
| 배너/전면/보상형 광고 | ✅ | 위 수익 구조 |
| 친구초대 `contactsViral` | ✅(래퍼) | 콘솔 `moduleId` 발급 시 활성 |
| 공유 `getTossShareLink`/`share` | ✅ | 상품/리포트 공유 |
| 앱 리뷰 `requestReview` | ✅ | 목표가 달성 등 만족 순간 |
| 햅틱 `generateHapticFeedback` | ✅ | 추적/언락 마이크로 인터랙션 |
| 사용자 정보 `getConsentedUserData` | ⏳ | 이름/생일 개인화 (선택) |
| **금융/소비 데이터** | ❌ 불가 | 토스가 미니앱에 거래/지출 데이터를 제공하지 않음(공식 확인). 절약 인사이트는 자체 가격/행동 데이터로 산출 |

## 7. 실데이터 & 최초작성자 리워드 (적용됨)

- **mock 데이터 전면 제거** — 모든 화면(홈/검색/상품/추적/피드/팁/랭킹/프로필)이 백엔드 실데이터(SWR)로 동작. `MOCK_*` 상수 삭제.
- **빈 상태 문구**: 데이터가 없으면 "가장 먼저 등록하고 보상 받기" 식 CTA 노출.
- **개척자(Pioneer) 리워드**: 어떤 상품의 **첫 특가 제보자**(+50 EXP, 🚩 첫 제보자), 어떤 분야의 **첫 꿀팁 작성자**(+30 EXP, 🍯 첫 꿀팁러)에게 자동 보상 + 축하 모달. 초기 데이터가 빈 상태에서 등록을 유도하는 장치.
  - 백엔드: `src/lib/rewards.ts`, `POST /api/feed`·`/api/tips` 응답에 `reward` 포함.
- 신규 백엔드 API: `/api/ranking`(실시간 월간 집계), `/api/me`(프로필·배지·통계), `/api/me/missions`(오늘의 미션, 실제 완료 상태).

## 8. 남은 권장 작업

- 데이터 시드: 초기엔 상품/딜/팁이 비어 있음 — 가격수집 크론(`fetch-prices`)이 products를 채우려면 products에 시드가 필요(검색에서 추적 시작 시 자동 등록 흐름 추가 권장).
- Supabase RLS 정책을 `auth.uid()` 기반으로 강화(현재 정책 placeholder, 서버는 서비스 롤 + 세션 토큰으로 보호).
- 마이그레이션 적용: `supabase/migrations/003_notifications_security.sql`.
- 모니터링(Sentry 등) 추가.
