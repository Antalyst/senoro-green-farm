-- Keep the product name and image on each order item (copied at checkout),
-- so order history still shows them after a seller edits or deletes the product.
-- (order_items.product_id becomes NULL when a product is deleted.)

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS product_image_url TEXT;

-- Backfill items whose product still exists.
UPDATE public.order_items oi
SET
  product_name = COALESCE(oi.product_name, p.name),
  product_image_url = COALESCE(oi.product_image_url, p.image_url)
FROM public.products p
WHERE p.id = oi.product_id
  AND (oi.product_name IS NULL OR oi.product_image_url IS NULL);

SELECT
  count(*) AS order_item_count,
  count(product_name) AS items_with_saved_name
FROM public.order_items;
