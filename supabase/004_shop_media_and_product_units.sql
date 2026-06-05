-- ============================================================
-- Negros Farmers Weekend Market - Migration 004
-- Seller shop media branding and product selling units
-- Run after 003_store_driven_categories.sql
-- ============================================================

-- 1. Seller storefront media
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS shop_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS shop_banner_url TEXT;

-- 2. Multi-unit product pricing
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unit_type TEXT NOT NULL DEFAULT 'pc';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_unit_type_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_unit_type_check
  CHECK (unit_type IN ('pc', 'kg', 'g', 'bundle', 'serving'));

CREATE INDEX IF NOT EXISTS idx_products_unit_type ON public.products (unit_type);

-- 3. Backfill safety for older rows
UPDATE public.products
SET unit_type = 'pc'
WHERE unit_type IS NULL OR unit_type NOT IN ('pc', 'kg', 'g', 'bundle', 'serving');

-- 4. Verification
SELECT
  (SELECT count(*) FROM public.users WHERE role = 'seller') AS seller_count,
  (SELECT count(*) FROM public.products WHERE unit_type IS NOT NULL) AS products_with_units;
