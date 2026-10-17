-- Map pin for buyer addresses (set from the Leaflet picker or device GPS).
-- Riders use it to navigate to the exact drop-off point.

ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_coordinates_check;
ALTER TABLE public.addresses
  ADD CONSTRAINT addresses_coordinates_check
  CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  );

SELECT
  count(*) AS address_count,
  count(latitude) AS pinned_address_count
FROM public.addresses;
