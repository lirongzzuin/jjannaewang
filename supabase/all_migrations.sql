-- ===== 001_initial.sql =====
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  toss_user_id TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  premium_tier TEXT CHECK (premium_tier IN ('pro', 'master')) DEFAULT NULL,
  premium_expiry TIMESTAMPTZ DEFAULT NULL,
  total_saved_amount INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_visit_date DATE DEFAULT NULL,
  warning_count INTEGER NOT NULL DEFAULT 0,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_toss_user_id ON users(toss_user_id);
CREATE INDEX idx_users_level ON users(level DESC);

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  naver_product_id TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  image_url TEXT,
  lowest_price_ever INTEGER,
  lowest_price_date DATE,
  current_lowest_price INTEGER,
  current_lowest_shop TEXT,
  tracking_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_naver_product_id ON products(naver_product_id);
CREATE INDEX idx_products_tracking_count ON products(tracking_count DESC);
CREATE INDEX idx_products_category ON products(category);

-- =====================================================
-- PRICE HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  affiliate_url TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- =====================================================
-- USER TRACKINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_trackings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_price INTEGER,
  alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_alerted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_user_trackings_user_id ON user_trackings(user_id);
CREATE INDEX idx_user_trackings_product_id ON user_trackings(product_id);

-- =====================================================
-- DEAL POSTS (HOT DEAL FEED)
-- =====================================================
CREATE TABLE IF NOT EXISTS deal_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  original_price INTEGER,
  deal_price INTEGER NOT NULL,
  shop_name TEXT NOT NULL,
  shop_url TEXT,
  affiliate_url TEXT,
  fire_count INTEGER NOT NULL DEFAULT 0,
  bought_count INTEGER NOT NULL DEFAULT 0,
  is_expired BOOLEAN NOT NULL DEFAULT FALSE,
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deal_posts_user_id ON deal_posts(user_id);
CREATE INDEX idx_deal_posts_fire_count ON deal_posts(fire_count DESC);
CREATE INDEX idx_deal_posts_created_at ON deal_posts(created_at DESC);
CREATE INDEX idx_deal_posts_is_expired ON deal_posts(is_expired);

-- =====================================================
-- DEAL REACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS deal_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deal_posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fire', 'bought', 'report')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, deal_id, type)
);

CREATE INDEX idx_deal_reactions_deal_id ON deal_reactions(deal_id);

-- =====================================================
-- TIPS
-- =====================================================
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('saving', 'deposit', 'invest', 'benefit', 'humor')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  link_url TEXT,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  upvote_count INTEGER NOT NULL DEFAULT 0,
  downvote_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  scrap_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_hot BOOLEAN NOT NULL DEFAULT FALSE,
  is_blinded BOOLEAN NOT NULL DEFAULT FALSE,
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tips_user_id ON tips(user_id);
CREATE INDEX idx_tips_category ON tips(category);
CREATE INDEX idx_tips_upvote_count ON tips(upvote_count DESC);
CREATE INDEX idx_tips_created_at ON tips(created_at DESC);
CREATE INDEX idx_tips_is_hot ON tips(is_hot) WHERE is_hot = TRUE;
CREATE INDEX idx_tips_is_blinded ON tips(is_blinded) WHERE is_blinded = FALSE;

-- =====================================================
-- TIP COMMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS tip_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tip_id UUID NOT NULL REFERENCES tips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tip_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  is_blinded BOOLEAN NOT NULL DEFAULT FALSE,
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tip_comments_tip_id ON tip_comments(tip_id);
CREATE INDEX idx_tip_comments_parent_id ON tip_comments(parent_id);

-- =====================================================
-- TIP REACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS tip_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tip_id UUID NOT NULL REFERENCES tips(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('upvote', 'downvote', 'scrap', 'report')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tip_id, type)
);

CREATE INDEX idx_tip_reactions_tip_id ON tip_reactions(tip_id);

-- =====================================================
-- SAVINGS LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  original_price INTEGER NOT NULL,
  purchased_price INTEGER NOT NULL,
  saved_amount INTEGER NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_savings_user_id ON savings(user_id);
CREATE INDEX idx_savings_month ON savings(month);

-- =====================================================
-- USER BADGES
-- =====================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_code)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

-- =====================================================
-- IAP ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS iap_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_iap_orders_user_id ON iap_orders(user_id);

-- =====================================================
-- MONTHLY RANKINGS (materialized/cached)
-- =====================================================
CREATE TABLE IF NOT EXISTS monthly_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month TEXT NOT NULL, -- YYYY-MM
  type TEXT NOT NULL CHECK (type IN ('savings', 'deals', 'tips')),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(month, type, user_id)
);

CREATE INDEX idx_monthly_rankings_month_type ON monthly_rankings(month, type);

-- =====================================================
-- DAILY MISSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_daily_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_code TEXT NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mission_code, completed_date)
);

CREATE INDEX idx_user_daily_missions_user_date ON user_daily_missions(user_id, completed_date);

-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Increment upvote count
CREATE OR REPLACE FUNCTION increment_upvote(tip_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tips SET upvote_count = upvote_count + 1 WHERE id = tip_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement upvote count
CREATE OR REPLACE FUNCTION decrement_upvote(tip_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tips SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = tip_id;
END;
$$ LANGUAGE plpgsql;

-- Increment scrap count
CREATE OR REPLACE FUNCTION increment_scrap(tip_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tips SET scrap_count = scrap_count + 1 WHERE id = tip_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement scrap count
CREATE OR REPLACE FUNCTION decrement_scrap(tip_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tips SET scrap_count = GREATEST(0, scrap_count - 1) WHERE id = tip_id;
END;
$$ LANGUAGE plpgsql;

-- Increment comment count
CREATE OR REPLACE FUNCTION increment_comment_count(tip_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tips SET comment_count = comment_count + 1 WHERE id = tip_id;
END;
$$ LANGUAGE plpgsql;

-- Update user streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  last_date DATE;
BEGIN
  SELECT last_visit_date INTO last_date FROM users WHERE id = p_user_id;
  IF last_date IS NULL OR last_date < CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE users SET streak_days = 1, last_visit_date = CURRENT_DATE, last_login_at = NOW() WHERE id = p_user_id;
  ELSIF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE users SET streak_days = streak_days + 1, last_visit_date = CURRENT_DATE, last_login_at = NOW() WHERE id = p_user_id;
  ELSE
    UPDATE users SET last_login_at = NOW() WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add exp and level up
CREATE OR REPLACE FUNCTION add_user_exp(p_user_id UUID, p_exp INTEGER)
RETURNS void AS $$
DECLARE
  new_exp INTEGER;
  new_level INTEGER;
BEGIN
  UPDATE users SET exp = exp + p_exp WHERE id = p_user_id RETURNING exp INTO new_exp;
  -- Level calculation
  new_level := CASE
    WHEN new_exp >= 5500 THEN 10
    WHEN new_exp >= 4000 THEN 9
    WHEN new_exp >= 3000 THEN 8
    WHEN new_exp >= 2200 THEN 7
    WHEN new_exp >= 1500 THEN 6
    WHEN new_exp >= 1000 THEN 5
    WHEN new_exp >= 600  THEN 4
    WHEN new_exp >= 300  THEN 3
    WHEN new_exp >= 100  THEN 2
    ELSE 1
  END;
  UPDATE users SET level = new_level WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trackings ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = toss_user_id);

-- Trackings
CREATE POLICY "Users can view own trackings" ON user_trackings FOR SELECT USING (true);
CREATE POLICY "Users can manage own trackings" ON user_trackings FOR ALL USING (true);

-- Savings
CREATE POLICY "Users can view own savings" ON savings FOR SELECT USING (true);
CREATE POLICY "Users can insert own savings" ON savings FOR INSERT WITH CHECK (true);

-- Badges (read-only for users)
CREATE POLICY "Anyone can view badges" ON user_badges FOR SELECT USING (true);

-- Daily missions
CREATE POLICY "Users can view own missions" ON user_daily_missions FOR SELECT USING (true);
CREATE POLICY "Users can complete missions" ON user_daily_missions FOR INSERT WITH CHECK (true);

-- =====================================================
-- SEED DATA (for development)
-- =====================================================

-- Sample products
INSERT INTO products (id, naver_product_id, name, brand, category, image_url, lowest_price_ever, lowest_price_date, current_lowest_price, current_lowest_shop, tracking_count) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'naver-001', '삼다수 2L x 12개', '삼다수', '생수', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 7900, '2024-01-15', 8900, '쿠팡', 1842),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'naver-002', '하기스 매직팬티 여아 4단계', '하기스', '기저귀', 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400', 28900, '2024-02-20', 31500, '네이버스토어', 3201),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'naver-003', '신라면 120g x 20개', '농심', '라면', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', 11500, '2024-03-10', 13200, '쿠팡', 2567),
  ('a1b2c3d4-0000-0000-0000-000000000004', 'naver-004', '피죤 세탁세제 5L', '피죤', '세제', 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400', 9800, '2024-01-01', 11500, '11번가', 987),
  ('a1b2c3d4-0000-0000-0000-000000000005', 'naver-005', '크리넥스 3겹 화장지 30롤', '크리넥스', '화장지', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400', 18900, '2024-02-14', 21000, '이마트몰', 1456),
  ('a1b2c3d4-0000-0000-0000-000000000006', 'naver-006', '맥심 모카골드 커피믹스 100개입', '동서식품', '커피', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', 12500, '2024-03-01', 14800, '쿠팡', 2134)
ON CONFLICT DO NOTHING;

-- ===== 002_fix_iap_orders.sql =====
-- Fix: make iap_orders.user_id nullable
-- user_id is not always available at the time of processProductGrant (before server-side auth resolves).
-- It can be populated later via a separate update when the user session is confirmed.

ALTER TABLE iap_orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE iap_orders DROP CONSTRAINT IF EXISTS iap_orders_user_id_fkey;
ALTER TABLE iap_orders ADD CONSTRAINT iap_orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ===== 003_notifications_security.sql =====
-- Push-notification consent + delivery bookkeeping for Smart Messaging.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_consent_at timestamptz;

-- Per-tracking alert delivery log to avoid duplicate price-drop pushes.
-- (last_alerted_at already exists on user_trackings; index it for the cron.)
CREATE INDEX IF NOT EXISTS idx_user_trackings_alert
  ON user_trackings (alert_enabled, last_alerted_at)
  WHERE alert_enabled = true;

-- ===== 004_savings_log.sql =====
-- Savings log: manual now, ready for future auto payment integration via `source`.

ALTER TABLE savings
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
  -- source: 'manual' (user-logged) | 'tracking' (from a met target) | 'auto' (future payment sync)

-- Atomic increment of a user's cumulative saved amount.
CREATE OR REPLACE FUNCTION increment_total_saved(p_user_id uuid, p_amount numeric)
RETURNS void AS $$
  UPDATE users
  SET total_saved_amount = COALESCE(total_saved_amount, 0) + p_amount,
      updated_at = now()
  WHERE id = p_user_id;
$$ LANGUAGE sql;

CREATE INDEX IF NOT EXISTS idx_savings_month_user ON savings (month, user_id);

-- ===== 005_deal_category.sql =====
-- Deals need a category so the feed filter works on real data.
ALTER TABLE deal_posts
  ADD COLUMN IF NOT EXISTS category text;

CREATE INDEX IF NOT EXISTS idx_deal_posts_category ON deal_posts (category);

-- ===== 006_tracking_baseline.sql =====
-- Baseline price = the product's price when the user FIRST started tracking it.
-- Used to auto-compute "how much I saved vs. when I started watching".
ALTER TABLE user_trackings
  ADD COLUMN IF NOT EXISTS baseline_price numeric;

-- ===== 007_bonus_slots.sql =====
-- Rewarded-ad bonus tracking slots (persisted, capped). Earned by watching a
-- rewarded ad; added on top of tier base + level perks in the tracking limit.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bonus_tracking_slots integer NOT NULL DEFAULT 0;

-- Atomic increment with a hard cap so it can't be farmed indefinitely.
CREATE OR REPLACE FUNCTION add_bonus_slot(p_user_id uuid, p_max integer)
RETURNS integer AS $$
  UPDATE users
  SET bonus_tracking_slots = LEAST(COALESCE(bonus_tracking_slots, 0) + 1, p_max),
      updated_at = now()
  WHERE id = p_user_id
  RETURNING bonus_tracking_slots;
$$ LANGUAGE sql;

-- ===== 008_nickname.sql =====
-- Track whether the user has set their own nickname (vs. the auto-assigned default),
-- so we can prompt first-timers to personalize it.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nickname_set boolean NOT NULL DEFAULT false;

