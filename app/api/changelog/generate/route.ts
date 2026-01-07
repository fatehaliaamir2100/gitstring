import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubCommits, fetchGitLabCommits, compareCommits } from '@/lib/gitApi'
import { groupCommitsByType, formatAsMarkdown, markdownToHtml, formatAsJson } from '@/lib/changelogLogic'
import { generateAiSummaryWithDiffs } from '@/lib/openaiHelper'
import { getProviderToken } from '@/lib/tokenHelper'
import { validateInput, changelogGenerationSchema } from '@/lib/validation'
import { sanitizeError } from '@/lib/security'
import { rateLimiters } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  // Apply rate limiting for changelog generation
  const rateLimitResponse = rateLimiters.generate(request)
  if (rateLimitResponse) return rateLimitResponse
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const { repoId, startRef, endRef, useAi = false, title } = validateInput(
      changelogGenerationSchema,
      body
    )

    // Fetch repository details
    const { data: repo, error: repoError } = await supabase
      .from('repos')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', user.id)
      .single()

    if (repoError || !repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Get decrypted access token securely
    const accessToken = await getProviderToken(user.id, repo.provider as 'github' | 'gitlab')
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token not found. Please reconnect your repository.' }, { status: 401 })
    }

    // Fetch commits from Git provider
    let commits
    if (repo.provider === 'github') {
      if (startRef && endRef) {
        commits = await fetchGitHubCommits(
          accessToken,
          repo.repo_owner,
          repo.repo_name,
          startRef,
          endRef
        )
      } else {
        commits = await fetchGitHubCommits(
          accessToken,
          repo.repo_owner,
          repo.repo_name,
          undefined,
          undefined,
          true // includeDetails to fetch file changes
        )
      }
    } else if (repo.provider === 'gitlab') {
      const projectId = `${repo.repo_owner}/${repo.repo_name}`
      commits = await fetchGitLabCommits(
        accessToken,
        projectId,
        endRef || repo.default_branch,
        startRef,
        endRef,
        true // includeDetails to fetch file changes
      )
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
    }

    if (!commits || commits.length === 0) {
      return NextResponse.json({ error: 'No commits found' }, { status: 404 })
    }

    // Group commits by type
    const groups = groupCommitsByType(commits)

    // Generate changelog in different formats
    let markdown: string

    if (useAi && process.env.OPENAI_API_KEY) {
      // Use AI to generate enhanced changelog with code analysis
      markdown = await generateAiSummaryWithDiffs(groups, repo.repo_full_name)
    } else {
      // Use rule-based formatting
      markdown = formatAsMarkdown(groups, repo.repo_full_name, startRef, endRef)
    }

    const html = await markdownToHtml(markdown)
    const jsonData = formatAsJson(groups, repo.repo_full_name, startRef, endRef)

    // Generate slug for public URL
    const slug = `${repo.repo_name}-${Date.now().toString(36)}`

    // Save to database
    const { data: changelog, error: insertError } = await supabase
      .from('changelogs')
      .insert({
        user_id: user.id,
        repo_id: repo.id,
        title: title || `Changelog for ${repo.repo_full_name}`,
        tag_start: startRef,
        tag_end: endRef,
        commit_count: commits.length,
        markdown,
        html,
        json_data: jsonData,
        slug,
        is_public: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving changelog:', insertError)
      return NextResponse.json({ error: 'Failed to save changelog' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      changelog,
    })
  } catch (error) {
    const safeError = sanitizeError(error)
    console.error('Changelog generation error:', safeError)
    return NextResponse.json(
      { error: 'Failed to generate changelog' },
      { status: 500 }
    )
  }
}
