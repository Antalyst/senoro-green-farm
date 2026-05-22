-- ============================================================
-- Senoro Green Farm — Supabase Migration
-- Custom auth users table (no auth.users dependency)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Drop existing table if re-running migration
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

-- Disable Row Level Security for rapid prototyping
-- WARNING: Enable and configure RLS before going to production
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Seed: Demo accounts for testing each role
-- Password stored as plain text for prototyping only
-- ============================================================
INSERT INTO public.users (full_name, email, password, role) VALUES
  ('Admin User',    'admin@senoro.com',    'admin123',    'admin'),
  ('Seller User',   'seller@senoro.com',   'seller123',   'seller'),
  ('Buyer User',    'buyer@senoro.com',    'buyer123',    'buyer'),
  ('Delivery User', 'delivery@senoro.com', 'delivery123', 'delivery');

-- ============================================================
-- Verify the setup
-- ============================================================
SELECT id, full_name, email, role, created_at FROM public.users;
