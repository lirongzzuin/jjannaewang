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
