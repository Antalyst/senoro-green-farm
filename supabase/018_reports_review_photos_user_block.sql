-- 018_reports_review_photos_user_block.sql
-- NFWM update (safe to re-run):
-- 1. Admin can block or soft delete accounts (the row stays, so it can be restored).
-- 2. Buyers can attach up to 3 photos to a review.
-- 3. Orders remember when they were delivered (for the rider's order history).

-- 1. Block / soft delete ------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_reason text CHECK (blocked_reason IS NULL OR length(blocked_reason) <= 300),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_blocked_at ON public.users (blocked_at) WHERE blocked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users (deleted_at) WHERE deleted_at IS NOT NULL;

-- 2. Review photos (public links in the "product-images" bucket, under reviews/) ----------
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_image_urls_max_check;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_image_urls_max_check CHECK (coalesce(array_length(image_urls, 1), 0) <= 3);

-- 3. Delivered time ------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Check
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
      AND column_name IN ('blocked_at', 'blocked_reason', 'deleted_at')) AS user_columns,   -- expect 3
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'image_urls') AS review_column, -- expect 1
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivered_at') AS order_column; -- expect 1
