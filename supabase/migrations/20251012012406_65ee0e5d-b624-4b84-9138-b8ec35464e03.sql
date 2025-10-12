-- Clean up existing users to allow fresh super admin registration
-- This deletes all user roles and profiles, but keeps auth.users intact
-- Users will need to be manually deleted from auth.users via Supabase dashboard

-- Delete all user roles
DELETE FROM public.user_roles;

-- Delete all profiles
DELETE FROM public.profiles;

-- Reset any related data (optional, but recommended for clean slate)
DELETE FROM public.tickets;
DELETE FROM public.messages;
DELETE FROM public.contacts;
DELETE FROM public.channels;
DELETE FROM public.queues;

-- Note: To fully delete users, you need to delete them from the auth.users table
-- This must be done via Supabase Dashboard or Admin API