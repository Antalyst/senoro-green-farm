-- Make notifications and chat work without a service key.
-- Migrations 006/007 added auth.uid() policies, but this app does not use Supabase Auth,
-- so those policies blocked every insert (error 42501) and hid every row.
-- Access control is done in the server code (same as all other tables).

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "Order participants can send messages" ON public.messages;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN ('notifications', 'messages');
