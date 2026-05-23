-- ============================================================
-- Senoro Green Farm — Supabase Migration
-- Custom auth users table (no auth.users dependency)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Drop existing tables if re-running migration
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with role constraint
CREATE TABLE public.users (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT          NOT NULL,
  email       TEXT          UNIQUE NOT NULL,
  password    TEXT          NOT NULL,
  role        TEXT          NOT NULL CHECK (role IN ('admin', 'seller', 'buyer', 'delivery')),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Index for fast login lookups
CREATE INDEX idx_users_email ON public.users (email);

-- Create user addresses table
CREATE TABLE public.addresses (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name        TEXT          NOT NULL,
  phone_number     TEXT          NOT NULL,
  city             TEXT          NOT NULL,
  barangay         TEXT          NOT NULL,
  detailed_address TEXT          NOT NULL,
  is_default       BOOLEAN       NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_addresses_user_id ON public.addresses (user_id);
CREATE INDEX idx_addresses_user_default ON public.addresses (user_id, is_default);

-- Create products table
CREATE TABLE public.products (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID          REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT          NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  stock       INTEGER       NOT NULL DEFAULT 0,
  category    TEXT          NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    UUID          REFERENCES public.users(id) ON DELETE CASCADE,
  product_id  UUID          REFERENCES public.products(id) ON DELETE CASCADE,
  quantity    INTEGER       NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, product_id)
);

-- Create reviews table
CREATE TABLE public.reviews (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID          REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id    UUID          REFERENCES public.users(id) ON DELETE CASCADE,
  rating      INTEGER       NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  seller_reply TEXT         DEFAULT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Create orders table (logistics lifecycle)
CREATE TABLE public.orders (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id           UUID          REFERENCES public.users(id) ON DELETE SET NULL,
  address_id         UUID          REFERENCES public.addresses(id) ON DELETE SET NULL,
  delivery_rider_id  UUID          REFERENCES public.users(id) ON DELETE SET NULL,
  total_amount       NUMERIC(10,2) NOT NULL,
  status             TEXT          NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'processing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled'
    )),
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_orders_delivery_rider ON public.orders (delivery_rider_id);
CREATE INDEX idx_orders_buyer_id ON public.orders (buyer_id);
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);

-- Create order_items table
CREATE TABLE public.order_items (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID          REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID          REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id   UUID          REFERENCES public.users(id) ON DELETE SET NULL,
  quantity    INTEGER       NOT NULL,
  price       NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Disable Row Level Security for rapid prototyping
-- WARNING: Enable and configure RLS before going to production
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Seed: Demo accounts for testing each role
-- Password stored as bcrypt hashes
-- ============================================================
INSERT INTO public.users (full_name, email, password, role) VALUES
  ('Admin User',    'admin@senoro.com',    '$2b$10$1/vuB9wXb.u3DxEpRkmeTeamHvUa2NSfsHZ6/aTsUXzAaVq83QcpC',    'admin'),
  ('Seller User',   'seller@senoro.com',   '$2b$10$E6QvQWgk5vq0Q9XRm/p1RuNKClmIqyQt1RGT8.w0zWziqOtk/Yx1C',   'seller'),
  ('Buyer User',    'buyer@senoro.com',    '$2b$10$WfJXuQrM20fjJlwxGNt0ie5oRyP2RxbXkxDtQww6JbrEETvLt3ini',    'buyer'),
  ('Delivery User', 'delivery@senoro.com', '$2b$10$7HFd6OBIIKr4GGPG.fG9weFEAu8wHGL1.ZQqt6740NyXrPKTdJ/si', 'delivery');

-- ============================================================
-- Seed: Demo catalog, address, and analytics mock orders
-- ============================================================
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
WHERE u.email = 'seller@senoro.com';

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
WHERE u.email = 'buyer@senoro.com';

-- Phase 1 spec orders + extended analytics spread
INSERT INTO public.orders (buyer_id, address_id, delivery_rider_id, total_amount, status, created_at)
SELECT
  b.id,
  a.id,
  CASE WHEN o.status IN ('out_for_delivery', 'delivered') THEN d.id ELSE NULL END,
  o.total_amount,
  o.status,
  o.created_at
FROM public.users b
JOIN public.addresses a ON a.user_id = b.id AND a.is_default = true
CROSS JOIN public.users d
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
  AND d.email = 'delivery@senoro.com';

INSERT INTO public.order_items (order_id, product_id, seller_id, quantity, price, created_at)
SELECT
  ord.id,
  pr.id,
  pr.seller_id,
  CASE
    WHEN ord.total_amount >= 2000 THEN 4
    WHEN ord.total_amount >= 1000 THEN 3
    WHEN ord.total_amount >= 500 THEN 2
    ELSE 1
  END,
  pr.price,
  ord.created_at
FROM public.orders ord
JOIN public.users b ON b.id = ord.buyer_id AND b.email = 'buyer@senoro.com'
JOIN public.products pr ON pr.name = 'Organic Pechay'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_items oi WHERE oi.order_id = ord.id
);

-- ============================================================
-- Verify the setup
-- ============================================================
SELECT id, full_name, email, role, created_at FROM public.users;
SELECT status, count(*) AS orders_by_status FROM public.orders GROUP BY status ORDER BY status;
