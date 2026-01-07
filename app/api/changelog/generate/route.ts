import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubCommits, fetchGitLabCommits, compareCommits } from '@/lib/gitApi'
import { groupCommitsByType, formatAsMarkdown, markdownToHtml, formatAsJson } from '@/lib/changelogLogic'
import { generateAiSummary } from '@/lib/openaiHelper'

export async function POST(request: NextRequest) {
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
    const { repoId, startRef, endRef, useAi = false, title } = body

    if (!repoId) {
      return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 })
    }

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

    // Fetch commits from Git provider
    let commits
    if (repo.provider === 'github') {
      if (startRef && endRef) {
        commits = await fetchGitHubCommits(
          repo.access_token,
          repo.repo_owner,
          repo.repo_name,
          startRef,
          endRef
        )
      } else {
        commits = await fetchGitHubCommits(
          repo.access_token,
          repo.repo_owner,
          repo.repo_name
        )
      }
    } else if (repo.provider === 'gitlab') {
      const projectId = `${repo.repo_owner}/${repo.repo_name}`
      commits = await fetchGitLabCommits(
        repo.access_token,
        projectId,
        endRef || repo.default_branch
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
      // Use AI to generate enhanced changelog
      markdown = await generateAiSummary(groups, repo.repo_full_name)
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
    console.error('Error generating changelog:', error)
    return NextResponse.json(
      { error: 'Failed to generate changelog', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
