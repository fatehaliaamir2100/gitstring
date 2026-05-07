-- ============================================
-- COMPLETE DATABASE SCHEMA FOR GITSTRING
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  ai_provider TEXT CHECK (ai_provider IN ('openai', 'ollama', 'default')) DEFAULT 'default',
  ai_model TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

COMMENT ON COLUMN public.users.ai_provider IS 'User preference for AI provider: openai, ollama, or default (use system setting)';
COMMENT ON COLUMN public.users.ai_model IS 'Optional: specific model to use (e.g., gpt-4o-mini, llama3.2)';
COMMENT ON COLUMN public.users.preferences IS 'Additional user preferences in JSON format';

CREATE INDEX IF NOT EXISTS idx_users_ai_provider ON public.users(ai_provider);

-- ============================================
-- PROVIDER TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.provider_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'gitlab')),
  encrypted_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.provider_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens" ON public.provider_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON public.provider_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON public.provider_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON public.provider_tokens
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_provider_tokens_user_provider ON public.provider_tokens(user_id, provider);

-- ============================================
-- REPOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.repos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'gitlab')),
  repo_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  repo_full_name TEXT NOT NULL,
  repo_url TEXT,
  default_branch TEXT DEFAULT 'main',
  is_private BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, repo_full_name)
);

ALTER TABLE public.repos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own repos" ON public.repos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own repos" ON public.repos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repos" ON public.repos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own repos" ON public.repos
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_repos_user_id ON public.repos(user_id);
CREATE INDEX IF NOT EXISTS idx_repos_provider ON public.repos(provider);

-- ============================================
-- CHANGELOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.changelogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  title TEXT,
  tag_start TEXT,
  tag_end TEXT,
  commit_start TEXT,
  commit_end TEXT,
  commit_count INTEGER DEFAULT 0,
  markdown TEXT,
  html TEXT,
  json_data JSONB,
  is_public BOOLEAN DEFAULT false,
  slug TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.changelogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own changelogs" ON public.changelogs
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own changelogs" ON public.changelogs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own changelogs" ON public.changelogs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own changelogs" ON public.changelogs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_changelogs_user_id ON public.changelogs(user_id);
CREATE INDEX IF NOT EXISTS idx_changelogs_repo_id ON public.changelogs(repo_id);
CREATE INDEX IF NOT EXISTS idx_changelogs_slug ON public.changelogs(slug) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_changelogs_is_public ON public.changelogs(is_public);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repos_updated_at BEFORE UPDATE ON public.repos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_changelogs_updated_at BEFORE UPDATE ON public.changelogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_tokens_updated_at BEFORE UPDATE ON public.provider_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- New user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DONE!
-- ============================================
-- Your database is now ready for GitString
