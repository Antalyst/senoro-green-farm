-- 016_identity_verification.sql
-- Profile photos for every account, and identity verification on signup:
-- each new buyer, seller and rider uploads a selfie and a photo of a valid ID,
-- and stays "pending" until an admin approves them. (safe to re-run)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS selfie_path text,
  ADD COLUMN IF NOT EXISTS id_document_path text,
  ADD COLUMN IF NOT EXISTS id_type text CHECK (id_type IS NULL OR length(id_type) <= 60),
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejection_reason text CHECK (rejection_reason IS NULL OR length(rejection_reason) <= 300);

-- Private bucket for selfies and ID photos. Not public, and no anon/authenticated
-- policies: only the server (service-role key) can upload or read these files.
-- Admins see them through short-lived signed URLs from /api/admin/approvals.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-docs',
  'verification-docs',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Profile photos go to the existing public "product-images" bucket under avatars/
-- (see migration 013), so no new policy is needed for them.

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
  AND column_name IN ('avatar_url', 'selfie_path', 'id_document_path', 'id_type', 'verification_submitted_at', 'rejection_reason');
