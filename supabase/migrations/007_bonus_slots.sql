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
