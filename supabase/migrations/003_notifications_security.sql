-- Push-notification consent + delivery bookkeeping for Smart Messaging.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_consent_at timestamptz;

-- Per-tracking alert delivery log to avoid duplicate price-drop pushes.
-- (last_alerted_at already exists on user_trackings; index it for the cron.)
CREATE INDEX IF NOT EXISTS idx_user_trackings_alert
  ON user_trackings (alert_enabled, last_alerted_at)
  WHERE alert_enabled = true;
