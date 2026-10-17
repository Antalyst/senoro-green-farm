-- Image storage for product photos and shop avatar/banner (replaces ImgBB).
-- Public bucket: anyone can view images by URL; uploads go through /api/products/upload,
-- which checks the seller login, file type and size before storing.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- The server uploads with the anon key (this app does not use Supabase Auth),
-- so allow inserts into this bucket only.
DROP POLICY IF EXISTS "NFWM uploads product images" ON storage.objects;
CREATE POLICY "NFWM uploads product images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'product-images');

SELECT id, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';
