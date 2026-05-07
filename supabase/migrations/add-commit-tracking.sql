-- Migration: Add commit tracking and AI summaries
-- This enables real-time changelog generation

-- ============================================
-- COMMIT SUMMARIES TABLE
-- ============================================
-- Stores each commit with AI-generated summary
CREATE TABLE IF NOT EXISTS public.commit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  commit_sha TEXT NOT NULL,
  commit_message TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  author_date TIMESTAMP WITH TIME ZONE,
  committer_name TEXT,
  committer_date TIMESTAMP WITH TIME ZONE,
  
  -- AI-generated summaries
  ai_summary TEXT, -- Overall commit summary
  ai_impact TEXT, -- Impact analysis (breaking, feature, fix, etc.)
  ai_category TEXT, -- Categorization (feat, fix, docs, etc.)
  
  -- Metadata
  branch TEXT,
  parent_shas TEXT[], -- Array of parent commit SHAs
  stats_additions INTEGER DEFAULT 0,
  stats_deletions INTEGER DEFAULT 0,
  stats_total_changes INTEGER DEFAULT 0,
  files_changed_count INTEGER DEFAULT 0,
  
  -- Processing status
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one entry per commit per repo
  UNIQUE(repo_id, commit_sha)
);

-- Enable Row Level Security
ALTER TABLE public.commit_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can view commits for their repos
CREATE POLICY "Users can view commits for their repos" ON public.commit_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.repos 
      WHERE repos.id = commit_summaries.repo_id 
      AND repos.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert commits" ON public.commit_summaries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update commits" ON public.commit_summaries
  FOR UPDATE USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_commit_summaries_repo_id ON public.commit_summaries(repo_id);
CREATE INDEX IF NOT EXISTS idx_commit_summaries_commit_sha ON public.commit_summaries(commit_sha);
CREATE INDEX IF NOT EXISTS idx_commit_summaries_author_date ON public.commit_summaries(author_date DESC);
CREATE INDEX IF NOT EXISTS idx_commit_summaries_is_processed ON public.commit_summaries(is_processed) WHERE is_processed = false;
CREATE INDEX IF NOT EXISTS idx_commit_summaries_repo_date ON public.commit_summaries(repo_id, author_date DESC);

-- ============================================
-- FILE CHANGES TABLE
-- ============================================
-- Stores individual file changes per commit
CREATE TABLE IF NOT EXISTS public.file_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commit_summary_id UUID NOT NULL REFERENCES public.commit_summaries(id) ON DELETE CASCADE,
  
  -- File information
  filename TEXT NOT NULL,
  previous_filename TEXT, -- For renames
  status TEXT NOT NULL, -- added, modified, removed, renamed
  
  -- Change statistics
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  changes INTEGER DEFAULT 0,
  
  -- AI-generated file-level summary
  ai_summary TEXT, -- What changed in this file
  ai_purpose TEXT, -- Why this change was made
  
  -- Patch/diff data (optional, can be large)
  patch TEXT, -- Git diff patch
  
  -- Processing
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.file_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can view file changes for their commits
CREATE POLICY "Users can view file changes for their commits" ON public.file_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.commit_summaries cs
      JOIN public.repos r ON cs.repo_id = r.id
      WHERE cs.id = file_changes.commit_summary_id 
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert file changes" ON public.file_changes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update file changes" ON public.file_changes
  FOR UPDATE USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_changes_commit_id ON public.file_changes(commit_summary_id);
CREATE INDEX IF NOT EXISTS idx_file_changes_filename ON public.file_changes(filename);
CREATE INDEX IF NOT EXISTS idx_file_changes_status ON public.file_changes(status);
CREATE INDEX IF NOT EXISTS idx_file_changes_is_processed ON public.file_changes(is_processed) WHERE is_processed = false;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Trigger for updated_at on commit_summaries
CREATE TRIGGER update_commit_summaries_updated_at 
  BEFORE UPDATE ON public.commit_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on file_changes
CREATE TRIGGER update_file_changes_updated_at 
  BEFORE UPDATE ON public.file_changes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get unprocessed commits count
CREATE OR REPLACE FUNCTION get_unprocessed_commits_count(repo_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.commit_summaries 
    WHERE repo_id = repo_uuid 
    AND is_processed = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.commit_summaries IS 'Stores commits with AI-generated summaries for real-time changelog generation';
COMMENT ON TABLE public.file_changes IS 'Stores individual file changes per commit with AI analysis';
COMMENT ON COLUMN public.commit_summaries.ai_summary IS 'AI-generated human-readable summary of the commit';
COMMENT ON COLUMN public.commit_summaries.ai_impact IS 'AI assessment of commit impact (breaking, feature, fix, etc.)';
COMMENT ON COLUMN public.file_changes.ai_summary IS 'AI-generated summary of what changed in this specific file';
