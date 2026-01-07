-- Fix: Sync existing auth users to public.users table
-- Run this AFTER running the main schema.sql
-- This is needed if you logged in before running the schema

-- Insert any auth.users that don't exist in public.users yet
INSERT INTO public.users (id, email, full_name, avatar_url, created_at)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Verify the sync worked
SELECT COUNT(*) as synced_users FROM public.users;
