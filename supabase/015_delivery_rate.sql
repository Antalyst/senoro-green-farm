-- Delivery fee set by the admin: rate per kilometer from the shop to the buyer's pinned address.
-- fallback_fee is charged per shop when the buyer's address or the shop has no map pin yet.
-- One row only (id = 1).

CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id           SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  rate_per_km  NUMERIC(10, 2) NOT NULL DEFAULT 15 CHECK (rate_per_km >= 0),
  fallback_fee NUMERIC(10, 2) NOT NULL DEFAULT 50 CHECK (fallback_fee >= 0),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Access control is done in the server code (same as all other tables).
ALTER TABLE public.delivery_settings DISABLE ROW LEVEL SECURITY;

INSERT INTO public.delivery_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

SELECT * FROM public.delivery_settings;
