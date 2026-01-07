-- Database Schema for Changelog Generator
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth handles this, but we can extend it)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Repository connections table
CREATE TABLE IF NOT EXISTS public.repos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'gitlab')),
  repo_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  repo_full_name TEXT NOT NULL, -- e.g., "owner/repo"
  repo_url TEXT,
  default_branch TEXT DEFAULT 'main',
  access_token TEXT, -- Encrypted OAuth token
  is_private BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, repo_full_name)
);

-- Enable Row Level Security
ALTER TABLE public.repos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own repos" ON public.repos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own repos" ON public.repos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repos" ON public.repos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own repos" ON public.repos
  FOR DELETE USING (auth.uid() = user_id);

-- Generated changelogs table
CREATE TABLE IF NOT EXISTS public.changelogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  title TEXT,
  tag_start TEXT,
  tag_end TEXT,
  commit_start TEXT, -- SHA
  commit_end TEXT,   -- SHA
  commit_count INTEGER DEFAULT 0,
  markdown TEXT,
  html TEXT,
  json_data JSONB,
  is_public BOOLEAN DEFAULT false,
  slug TEXT, -- For public URLs
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.changelogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own changelogs" ON public.changelogs
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own changelogs" ON public.changelogs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own changelogs" ON public.changelogs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own changelogs" ON public.changelogs
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repos_user_id ON public.repos(user_id);
CREATE INDEX IF NOT EXISTS idx_repos_provider ON public.repos(provider);
CREATE INDEX IF NOT EXISTS idx_changelogs_user_id ON public.changelogs(user_id);
CREATE INDEX IF NOT EXISTS idx_changelogs_repo_id ON public.changelogs(repo_id);
CREATE INDEX IF NOT EXISTS idx_changelogs_slug ON public.changelogs(slug) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_changelogs_is_public ON public.changelogs(is_public);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repos_updated_at BEFORE UPDATE ON public.repos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_changelogs_updated_at BEFORE UPDATE ON public.changelogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
