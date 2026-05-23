-- ============================================================
-- Senoro Green Farm — Migration 002
-- Addresses, order logistics lifecycle, mock analytics seed
-- Run in Supabase SQL Editor AFTER migration.sql (safe to re-run)
-- ============================================================

-- ------------------------------------------------------------
-- 1. User addresses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  phone_number     TEXT NOT NULL,
  city             TEXT NOT NULL,
  barangay         TEXT NOT NULL,
  detailed_address TEXT NOT NULL,
  is_default       BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_default ON public.addresses (user_id, is_default);

ALTER TABLE public.addresses DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2. Orders — logistics columns
-- ------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_rider_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Drop legacy check if re-running, then enforce lifecycle statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'processing',
    'ready_for_pickup',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ));

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_rider ON public.orders (delivery_rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- ------------------------------------------------------------
-- 3. Demo catalog (for order_items analytics seed)
-- ------------------------------------------------------------
INSERT INTO public.products (seller_id, name, description, price, stock, category)
SELECT u.id, p.name, p.description, p.price, p.stock, p.category
FROM public.users u
CROSS JOIN (
  VALUES
    ('Organic Pechay', 'Fresh bok choy from local farms', 45.00, 120, 'Vegetables'),
    ('Native Tomatoes', 'Ripe red tomatoes, 1 kg', 85.00, 80, 'Vegetables'),
    ('Saba Bananas', 'Sweet cooking bananas, 1 bunch', 65.00, 60, 'Fruits'),
    ('Fresh Kangkong', 'Water spinach bundle', 35.00, 100, 'Vegetables'),
    ('Free-range Eggs', 'Dozen farm eggs', 180.00, 40, 'Dairy')
) AS p(name, description, price, stock, category)
WHERE u.email = 'seller@senoro.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.products pr
    WHERE pr.seller_id = u.id AND pr.name = p.name
  );

-- ------------------------------------------------------------
-- 4. Default buyer address
-- ------------------------------------------------------------
INSERT INTO public.addresses (
  user_id, full_name, phone_number, city, barangay, detailed_address, is_default
)
SELECT
  u.id,
  'Buyer User',
  '09171234567',
  'Quezon City',
  'UP Campus',
  '123 Academic Avenue, Unit 4B',
  true
FROM public.users u
WHERE u.email = 'buyer@senoro.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.addresses a WHERE a.user_id = u.id
  );

-- ------------------------------------------------------------
-- 5. Mock orders for analytics charts
-- ------------------------------------------------------------
INSERT INTO public.orders (
  buyer_id, address_id, delivery_rider_id, total_amount, status, created_at
)
SELECT
  b.id,
  a.id,
  CASE WHEN o.status IN ('out_for_delivery', 'delivered') THEN r.id ELSE NULL END,
  o.total_amount,
  o.status,
  o.created_at
FROM public.users b
JOIN public.addresses a ON a.user_id = b.id AND a.is_default = true
CROSS JOIN public.users r
CROSS JOIN (
  VALUES
    (1500.00, 'ready_for_pickup', now() - interval '2 days'),
    (2450.00, 'delivered',      now() - interval '5 days'),
    (890.00,  'delivered',      now() - interval '18 days'),
    (1320.00, 'delivered',      now() - interval '35 days'),
    (760.00,  'delivered',      now() - interval '52 days'),
    (2100.00, 'delivered',      now() - interval '68 days'),
    (540.00,  'processing',     now() - interval '1 day'),
    (320.00,  'pending',        now() - interval '3 hours')
) AS o(total_amount, status, created_at)
WHERE b.email = 'buyer@senoro.com'
  AND r.email = 'delivery@senoro.com'
  AND NOT EXISTS (
    SELECT 1
    FROM public.orders ord
    WHERE ord.buyer_id = b.id
      AND ord.total_amount = o.total_amount
      AND ord.status = o.status
      AND ord.created_at::date = o.created_at::date
  );

-- Phase 1 spec rows (idempotent fallback)
INSERT INTO public.orders (buyer_id, total_amount, status)
SELECT u.id, v.total_amount, v.status
FROM public.users u
CROSS JOIN (
  VALUES
    (1500.00, 'ready_for_pickup'),
    (2450.00, 'delivered')
) AS v(total_amount, status)
WHERE u.email = 'buyer@senoro.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.buyer_id = u.id
      AND o.total_amount = v.total_amount
      AND o.status = v.status
      AND o.address_id IS NULL
  );

-- One order_items row per seeded order (analytics revenue lines)
INSERT INTO public.order_items (order_id, product_id, seller_id, quantity, price, created_at)
SELECT
  o.id,
  p.id,
  p.seller_id,
  GREATEST(1, (o.total_amount / 400)::int),
  p.price,
  o.created_at
FROM public.orders o
JOIN public.users b ON b.id = o.buyer_id AND b.email = 'buyer@senoro.com'
CROSS JOIN LATERAL (
  SELECT pr.id, pr.seller_id, pr.price
  FROM public.products pr
  JOIN public.users s ON s.id = pr.seller_id AND s.email = 'seller@senoro.com'
  ORDER BY pr.created_at ASC
  LIMIT 1
) p
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_items oi WHERE oi.order_id = o.id
);

-- ------------------------------------------------------------
-- Verify
-- ------------------------------------------------------------
SELECT
  (SELECT count(*) FROM public.addresses) AS address_count,
  (SELECT count(*) FROM public.orders) AS order_count,
  (SELECT count(*) FROM public.order_items) AS order_item_count;

SELECT status, count(*) AS orders_by_status
FROM public.orders
GROUP BY status
ORDER BY status;
