-- ============================================================
-- Senoro Green Farm — Supabase Migration
-- Custom auth users table (no auth.users dependency)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Drop existing tables if re-running migration
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
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

-- Create orders table
CREATE TABLE public.orders (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    UUID          REFERENCES public.users(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

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
-- Verify the setup
-- ============================================================
SELECT id, full_name, email, role, created_at FROM public.users;
