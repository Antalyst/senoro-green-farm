-- ============================================================
-- Add is_confirmed column to order_items to support multi-shop confirmation gates.
-- If not exist, adds the boolean column defaulting to false.
-- ============================================================
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN NOT NULL DEFAULT false;
