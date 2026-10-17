-- QR handoff flow: the rider scans each shop's receipt QR at pickup.
-- picked_up_at is set per shop (seller) when its package is scanned.
-- The order becomes out_for_delivery when every item has been picked up.

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;

SELECT
  count(*) AS order_item_count,
  count(picked_up_at) AS picked_up_item_count
FROM public.order_items;
