// User types
export interface User {
  id: string;
  toss_user_id: string;
  nickname: string;
  nickname_set?: boolean;
  level: number;
  exp: number;
  premium_tier: 'pro' | 'master' | null;
  premium_expiry: string | null;
  total_saved_amount: number;
  streak_days: number;
  warning_count: number;
  is_banned: boolean;
  last_login_at: string | null;
  created_at: string;
}

export const LEVEL_INFO = [
  { level: 1, title: '거지 견습생', icon: '🐣', minExp: 0 },
  { level: 2, title: '알뜰 거지', icon: '🐥', minExp: 100 },
  { level: 3, title: '프로 거지', icon: '💪', minExp: 300 },
  { level: 4, title: '짠물 달인', icon: '💧', minExp: 600 },
  { level: 5, title: '절약 고수', icon: '⚔️', minExp: 1000 },
  { level: 6, title: '쿠폰 마스터', icon: '🎫', minExp: 1500 },
  { level: 7, title: '특가 헌터', icon: '🏹', minExp: 2200 },
  { level: 8, title: '짠테크 교수', icon: '🎓', minExp: 3000 },
  { level: 9, title: '거지 대공', icon: '🏰', minExp: 4000 },
  { level: 10, title: '짠내왕', icon: '👑', minExp: 5500 },
] as const;

// Product types
export interface Product {
  id: string;
  naver_product_id: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  lowest_price_ever: number | null;
  lowest_price_date: string | null;
  current_lowest_price: number | null;
  current_lowest_shop: string | null;
  tracking_count: number;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  shop_name: string;
  price: number;
  affiliate_url: string | null;
  recorded_at: string;
}

export interface UserTracking {
  id: string;
  user_id: string;
  product_id: string;
  target_price: number | null;
  baseline_price: number | null;
  alert_enabled: boolean;
  last_alerted_at: string | null;
  created_at: string;
  product?: Product;
}

// Deal Feed types
export interface DealPost {
  id: string;
  user_id: string;
  product_id: string | null;
  title: string;
  description: string | null;
  original_price: number | null;
  deal_price: number;
  shop_name: string;
  shop_url: string | null;
  affiliate_url: string | null;
  fire_count: number;
  bought_count: number;
  is_expired: boolean;
  created_at: string;
  user?: User;
  product?: Product;
  my_reaction?: string | null;
}

// Tips types
export type TipCategory = 'saving' | 'deposit' | 'invest' | 'benefit' | 'humor';

export const TIP_CATEGORIES = [
  { id: 'all', label: '전체', emoji: '🍯' },
  { id: 'saving', label: '짠테크', emoji: '💰' },
  { id: 'deposit', label: '예적금/금리', emoji: '🏦' },
  { id: 'invest', label: '재테크 일반', emoji: '📈' },
  { id: 'benefit', label: '숨은 혜택', emoji: '🎁' },
  { id: 'humor', label: '거지 자랑', emoji: '😂' },
] as const;

export interface Tip {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: TipCategory;
  tags: string[];
  link_url: string | null;
  image_urls: string[];
  upvote_count: number;
  downvote_count: number;
  comment_count: number;
  scrap_count: number;
  view_count: number;
  is_hot: boolean;
  is_blinded: boolean;
  report_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  my_reaction?: string | null;
}

export interface TipComment {
  id: string;
  tip_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  upvote_count: number;
  is_blinded: boolean;
  report_count: number;
  created_at: string;
  user?: User;
  replies?: TipComment[];
}

// Savings
export interface Saving {
  id: string;
  user_id: string;
  product_id: string | null;
  original_price: number;
  purchased_price: number;
  saved_amount: number;
  month: string;
  created_at: string;
}

// Badge
export interface UserBadge {
  id: string;
  user_id: string;
  badge_code: string;
  earned_at: string;
}

export const BADGES = [
  { code: 'supporter', name: '서포터', emoji: '💛', description: '짠내왕을 후원해주셨어요. 감사합니다!' },
  { code: 'pioneer_deal', name: '첫 제보자', emoji: '🚩', description: '어떤 상품의 첫 특가를 제보했어요' },
  { code: 'pioneer_tip', name: '첫 꿀팁러', emoji: '🍯', description: '어떤 분야의 첫 꿀팁을 작성했어요' },
  { code: 'first_track', name: '첫 알림 등록', emoji: '🔔', description: '첫 번째 상품 추적을 시작했어요' },
  { code: 'save_100k', name: '10만원 절약', emoji: '💰', description: '누적 절약금액 10만원 달성' },
  { code: 'save_1m', name: '100만원 절약', emoji: '🏆', description: '누적 절약금액 100만원 달성' },
  { code: 'report_10', name: '특가 제보 10회', emoji: '🏹', description: '특가 제보를 10번 했어요' },
  { code: 'tips_10', name: '꿀팁 10개 작성', emoji: '🍯', description: '꿀팁을 10개 작성했어요' },
  { code: 'streak_7', name: '7일 연속 접속', emoji: '🔥', description: '7일 연속으로 방문했어요' },
  { code: 'streak_30', name: '30일 연속 접속', emoji: '💎', description: '30일 연속으로 방문했어요' },
  { code: 'hot_tip', name: '인기 꿀팁 작성자', emoji: '⭐', description: '인기 꿀팁을 작성했어요' },
] as const;

// Premium tiers
export type PremiumTier = 'free' | 'pro' | 'master';

// 무료로 모든 기능을 다 쓸 수 있습니다. 플랜 차이는 "토스애드 광고 노출 정도"(+서포터 배지).
//  무료: 전 기능 + 광고(배너·전면)   프로(900): 전면광고 제거   마스터(1900): 광고 완전 제거
export const PREMIUM_TIERS = {
  free: { name: '무료', trackingLimit: 20, chartMonths: 12, price: 0 },
  pro: { name: '프로 서포터', trackingLimit: 100, chartMonths: 12, price: 900 },
  master: { name: '마스터 서포터', trackingLimit: Infinity, chartMonths: 12, price: 1900 },
} as const;

// Naver Shopping API
export interface NaverProductItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

// Ranking
export interface RankingEntry {
  rank: number;
  user: User;
  score: number;
  isMe?: boolean;
}

// Mission
export interface DailyMission {
  code: string;
  label: string;
  exp: number;
  completed: boolean;
}
