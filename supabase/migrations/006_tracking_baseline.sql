-- Baseline price = the product's price when the user FIRST started tracking it.
-- Used to auto-compute "how much I saved vs. when I started watching".
ALTER TABLE user_trackings
  ADD COLUMN IF NOT EXISTS baseline_price numeric;
