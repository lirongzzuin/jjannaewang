-- Fix: make iap_orders.user_id nullable
-- user_id is not always available at the time of processProductGrant (before server-side auth resolves).
-- It can be populated later via a separate update when the user session is confirmed.

ALTER TABLE iap_orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE iap_orders DROP CONSTRAINT IF EXISTS iap_orders_user_id_fkey;
ALTER TABLE iap_orders ADD CONSTRAINT iap_orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
