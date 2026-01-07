-- Migration: Remove access_token from repos table
-- Tokens are now stored in provider_tokens table only

-- Drop the access_token column from repos table
ALTER TABLE public.repos DROP COLUMN IF EXISTS access_token;

-- Note: All access tokens should be migrated to provider_tokens table
-- before running this migration. If you need to migrate data, run this first:
--
-- INSERT INTO public.provider_tokens (user_id, provider, encrypted_token)
-- SELECT user_id, provider, access_token
-- FROM public.repos
-- WHERE access_token IS NOT NULL
-- ON CONFLICT (user_id, provider) DO NOTHING;
