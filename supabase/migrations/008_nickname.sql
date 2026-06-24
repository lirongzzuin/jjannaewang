-- Track whether the user has set their own nickname (vs. the auto-assigned default),
-- so we can prompt first-timers to personalize it.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nickname_set boolean NOT NULL DEFAULT false;
