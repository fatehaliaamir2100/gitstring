-- Migration: Add provider_tokens table for storing encrypted access tokens
-- Run this in your Supabase SQL Editor

-- Create provider_tokens table to store access tokens separately
CREATE TABLE IF NOT EXISTS public.provider_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'gitlab')),
  encrypted_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Enable Row Level Security
ALTER TABLE public.provider_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tokens" ON public.provider_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON public.provider_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON public.provider_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON public.provider_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_provider_tokens_user_provider 
  ON public.provider_tokens(user_id, provider);

-- Add trigger for updated_at
CREATE TRIGGER update_provider_tokens_updated_at 
  BEFORE UPDATE ON public.provider_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Supabase handles encryption at rest automatically
-- But for additional security, you can enable column-level encryption
-- using Supabase's Vault extension (optional, for production)
