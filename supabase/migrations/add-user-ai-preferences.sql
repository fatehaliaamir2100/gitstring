-- Add user preferences for AI provider selection
-- Run this migration in your Supabase SQL Editor

-- Add columns to users table for AI preferences
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS ai_provider TEXT CHECK (ai_provider IN ('openai', 'ollama', 'default')) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS ai_model TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.users.ai_provider IS 'User preference for AI provider: openai, ollama, or default (use system setting)';
COMMENT ON COLUMN public.users.ai_model IS 'Optional: specific model to use (e.g., gpt-4o-mini, llama3.2)';
COMMENT ON COLUMN public.users.preferences IS 'Additional user preferences in JSON format';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_ai_provider ON public.users(ai_provider);

-- RLS policies are already in place for users table, so users can update their own preferences
