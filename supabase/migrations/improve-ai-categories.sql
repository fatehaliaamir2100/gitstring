-- Migration: Remove ai_impact and improve categories
-- Run this AFTER add-commit-tracking.sql

-- Drop the ai_impact column from commit_summaries
ALTER TABLE public.commit_summaries DROP COLUMN IF EXISTS ai_impact;

-- Update the comment on ai_category to reflect new categories
COMMENT ON COLUMN public.commit_summaries.ai_category IS 'Commit category: feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|security|breaking';

-- Update the comment on ai_summary
COMMENT ON COLUMN public.commit_summaries.ai_summary IS 'AI-generated changelog entry describing the overall commit changes';
COMMENT ON COLUMN public.file_changes.ai_summary IS 'AI-generated description of what changed in this specific file';
