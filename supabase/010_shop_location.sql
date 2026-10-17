-- Shop pickup location (seller pins it in Shop Settings).
-- Riders use it to find each shop when they collect an order.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS shop_latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS shop_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS shop_address   TEXT;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_shop_coordinates_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_shop_coordinates_check
  CHECK (
    (shop_latitude IS NULL AND shop_longitude IS NULL)
    OR (shop_latitude BETWEEN -90 AND 90 AND shop_longitude BETWEEN -180 AND 180)
  );

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_shop_address_length_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_shop_address_length_check
  CHECK (shop_address IS NULL OR length(shop_address) <= 300);

SELECT
  count(*) FILTER (WHERE role = 'seller') AS seller_count,
  count(shop_latitude) FILTER (WHERE role = 'seller') AS sellers_with_location
FROM public.users;
