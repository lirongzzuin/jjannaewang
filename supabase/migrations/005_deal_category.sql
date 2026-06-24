-- Deals need a category so the feed filter works on real data.
ALTER TABLE deal_posts
  ADD COLUMN IF NOT EXISTS category text;

CREATE INDEX IF NOT EXISTS idx_deal_posts_category ON deal_posts (category);
