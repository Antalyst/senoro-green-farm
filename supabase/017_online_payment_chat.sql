-- 017_online_payment_chat.sql
-- Online payment (GCash / Maya / bank QR) and buyer <-> seller chat with images. (safe to re-run)
--
-- How it works:
-- - A seller adds a payment account (type, account name, number, QR image) in Shop Settings.
-- - At checkout the buyer picks, per shop, "online" (only if that shop has an account) or "cod".
-- - Each order gets one order_payments row per shop. Online: the buyer sends a receipt photo and
--   reference number in chat, and the seller confirms it before accepting the order.
--   COD: a rider accepts the job right after checkout and pays the shop first (receipt in the
--   rider <-> shop chat, or cash at the shop); the seller confirms, then accepts the order.
-- - The delivery fee is always paid to the rider at the door.

-- 1. Seller payment account ------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS payout_method text CHECK (payout_method IS NULL OR payout_method IN ('gcash', 'maya', 'bank')),
  ADD COLUMN IF NOT EXISTS payout_account_name text CHECK (payout_account_name IS NULL OR length(payout_account_name) <= 60),
  ADD COLUMN IF NOT EXISTS payout_account_number text CHECK (payout_account_number IS NULL OR length(payout_account_number) <= 20),
  ADD COLUMN IF NOT EXISTS payout_bank_name text CHECK (payout_bank_name IS NULL OR length(payout_bank_name) <= 60),
  ADD COLUMN IF NOT EXISTS payout_qr_url text;

-- 2. Delivery fee stored on its own ------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(10, 2) CHECK (delivery_fee IS NULL OR delivery_fee >= 0);

-- 3. One payment row per order + shop ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.users(id),
  method text NOT NULL CHECK (method IN ('online', 'cod')),
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  -- online: awaiting_payment -> submitted -> confirmed (or rejected -> submitted again)
  -- cod:    cod_unpaid -> rider_paid
  status text NOT NULL CHECK (status IN ('awaiting_payment', 'submitted', 'confirmed', 'rejected', 'cod_unpaid', 'rider_paid')),
  -- Copy of the shop's account at checkout, so old orders show what the buyer paid to.
  payout_method text,
  payout_account_name text,
  payout_account_number text,
  payout_bank_name text,
  payout_qr_url text,
  reference_number text CHECK (reference_number IS NULL OR length(reference_number) <= 20),
  receipt_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  submitted_at timestamptz,
  rejection_reason text CHECK (rejection_reason IS NULL OR length(rejection_reason) <= 300),
  confirmed_at timestamptz,
  rider_paid_at timestamptz,
  rider_paid_method text CHECK (rider_paid_method IS NULL OR rider_paid_method IN ('cash', 'gcash', 'maya', 'bank')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_payments_pkey PRIMARY KEY (id),
  CONSTRAINT order_payments_order_seller_key UNIQUE (order_id, seller_id)
);

-- The same receipt reference number cannot be used on two active payments
-- (buyer receipts and rider receipts for COD shops).
DROP INDEX IF EXISTS public.order_payments_reference_active_idx;
CREATE UNIQUE INDEX order_payments_reference_active_idx
  ON public.order_payments (upper(reference_number))
  WHERE reference_number IS NOT NULL AND status IN ('submitted', 'confirmed', 'rider_paid');

CREATE INDEX IF NOT EXISTS order_payments_seller_idx ON public.order_payments (seller_id);

-- Access control is done in the server code (same as all other tables).
ALTER TABLE public.order_payments DISABLE ROW LEVEL SECURITY;

-- 4. Chat: images and receipt messages ---------------------------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS image_path text,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'text';

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_kind_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_kind_check CHECK (kind IN ('text', 'image', 'receipt'));

-- Image messages may have no text.
ALTER TABLE public.messages ALTER COLUMN message_text SET DEFAULT '';

CREATE INDEX IF NOT EXISTS messages_order_pair_idx ON public.messages (order_id, sender_id, receiver_id);

-- 5. Private bucket for chat photos and receipts ----------------------------------------
-- No anon/authenticated policies: only the server (service-role key) can upload or read.
-- People in the chat see photos through short-lived signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 6. Order cancellation ------------------------------------------------------------------
-- The buyer can cancel while no shop has been paid yet. The reason is shown to the shops.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text CHECK (cancel_reason IS NULL OR length(cancel_reason) <= 200);

-- Check
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name IN ('cancelled_at', 'cancel_reason')) AS cancel_columns, -- expect 2
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name LIKE 'payout_%') AS payout_columns, -- expect 5
  (SELECT count(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'order_payments') AS order_payments_table,               -- expect 1
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name IN ('image_path', 'kind')) AS message_columns, -- expect 2
  (SELECT count(*) FROM storage.buckets WHERE id = 'chat-images') AS chat_bucket;                           -- expect 1
