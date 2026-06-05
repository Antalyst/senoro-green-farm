-- ============================================================
-- Senoro Green Farm - Migration 003
-- Store-driven seller categories and seller shop names
-- Run after migration.sql and 002_addresses_logistics_analytics.sql
-- ============================================================

-- 1. Seller-managed categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT categories_seller_name_unique UNIQUE (seller_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_seller_id ON public.categories (seller_id);
CREATE INDEX IF NOT EXISTS idx_categories_seller_name ON public.categories (seller_id, name);

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- 2. Seller shop display name
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS shop_name VARCHAR(160);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_shop_name_unique
  ON public.users (lower(trim(shop_name)))
  WHERE shop_name IS NOT NULL AND trim(shop_name) <> '';

UPDATE public.users
SET shop_name = full_name
WHERE role = 'seller'
  AND (shop_name IS NULL OR trim(shop_name) = '');

-- 3. Product category foreign key
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_category_id_fkey'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_category_id_fkey
      FOREIGN KEY (category_id)
      REFERENCES public.categories(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_category ON public.products (seller_id, category_id);

-- 4. Backfill category rows from the legacy products.category string.
-- The legacy products.category column is intentionally retained as deprecated
-- compatibility data while the application moves to products.category_id.
INSERT INTO public.categories (seller_id, name)
SELECT DISTINCT
  p.seller_id,
  trim(p.category)::VARCHAR(120) AS name
FROM public.products p
WHERE p.seller_id IS NOT NULL
  AND p.category IS NOT NULL
  AND trim(p.category) <> ''
ON CONFLICT (seller_id, name) DO NOTHING;

UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE c.seller_id = p.seller_id
  AND c.name = trim(p.category)
  AND p.category_id IS NULL;

-- Optional future cleanup after all code reads category_id:
-- ALTER TABLE public.products DROP COLUMN category;

-- 5. Verification
SELECT
  (SELECT count(*) FROM public.categories) AS category_count,
  (SELECT count(*) FROM public.products WHERE category_id IS NOT NULL) AS categorized_product_count,
  (SELECT count(*) FROM public.users WHERE role = 'seller' AND shop_name IS NOT NULL) AS sellers_with_shop_name;
