-- 008_user_acceptance.sql
-- Admin-mediated account approval workflow (safe to re-run)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_approval_status_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_approval_status_check
  CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));

CREATE INDEX IF NOT EXISTS idx_users_approval_status ON public.users (approval_status);

-- Grandfather seed and admin accounts so dev logins keep working
UPDATE public.users
SET approval_status = 'approved'
WHERE role = 'admin'
   OR email IN (
     'admin@senoro.com',
     'seller@senoro.com',
     'buyer@senoro.com',
     'delivery@senoro.com'
   );
