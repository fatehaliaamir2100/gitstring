import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubCommits, fetchGitLabCommits, compareCommits } from '@/lib/gitApi'
import { groupCommitsByType, formatAsMarkdown, markdownToHtml, formatAsJson } from '@/lib/changelogLogic'
import { generateAiSummaryWithDiffs } from '@/lib/openaiHelper'
import { getProviderToken } from '@/lib/tokenHelper'
import { validateInput, changelogGenerationSchema } from '@/lib/validation'
import { sanitizeError } from '@/lib/security'
import { rateLimiters } from '@/lib/rateLimit'
import { logger, measureTime } from '@/lib/logger'
import { CommitCache, ChangelogCache } from '@/lib/cache'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  logger.apiRequest('POST', '/api/changelog/generate')
  
  // Apply rate limiting for changelog generation
  const rateLimitResponse = rateLimiters.generate(request)
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for changelog generation', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown' 
    })
    return rateLimitResponse
  }
  
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized changelog generation attempt', { authError: authError?.message })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Changelog generation started', { userId: user.id })

    const body = await request.json()
    
    // Validate input
    const { repoId, startRef, endRef, useAi = false, title } = validateInput(
      changelogGenerationSchema,
      body
    )

    logger.info('Changelog generation request validated', { repoId, startRef, endRef, useAi, userId: user.id })

    // Fetch repository details
    logger.dbQuery('SELECT', 'repos', { repoId, userId: user.id })
    const dbStartTime = Date.now()
    const { data: repo, error: repoError } = await supabase
      .from('repos')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', user.id)
      .single()
    logger.dbQueryComplete('SELECT', 'repos', Date.now() - dbStartTime, repo ? 1 : 0)

    if (repoError || !repo) {
      logger.warn('Repository not found for changelog generation', { repoId, userId: user.id, error: repoError?.message })
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    logger.info('Repository fetched', { repoId, provider: repo.provider, repoName: `${repo.repo_owner}/${repo.repo_name}` })

    // Get decrypted access token securely
    logger.debug('Retrieving provider token', { provider: repo.provider, userId: user.id })
    const accessToken = await getProviderToken(user.id, repo.provider as 'github' | 'gitlab')
    
    if (!accessToken) {
      logger.error('Access token not found', undefined, { userId: user.id, provider: repo.provider, repoId })
      return NextResponse.json({ error: 'Access token not found. Please reconnect your repository.' }, { status: 401 })
    }

    logger.info('Access token retrieved successfully', { provider: repo.provider })

    // Fetch commits from Git provider
    logger.info('Fetching commits from provider', { provider: repo.provider, owner: repo.repo_owner, repoName: repo.repo_name })
    
    // Check cache for commits first
    const cacheKey = `${repo.provider}:${repo.repo_owner}/${repo.repo_name}:${startRef || 'HEAD'}:${endRef || 'HEAD'}`
    let commits = CommitCache.get(cacheKey)
    
    if (commits) {
      logger.info('Commits retrieved from cache', { commitCount: commits.length, cacheKey })
    } else {
      // Fetch from provider
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
      
      // Cache the commits
      if (commits && commits.length > 0) {
        CommitCache.set(cacheKey, commits)
        logger.debug('Commits cached', { commitCount: commits.length, cacheKey })
      }
    }

    if (!commits || commits.length === 0) {
      logger.warn('No commits found for changelog generation', { repoId, startRef, endRef })
      return NextResponse.json({ error: 'No commits found' }, { status: 404 })
    }

    logger.info('Commits fetched successfully', { commitCount: commits.length, repoId })

    // Group commits by type
    logger.debug('Grouping commits by type', { commitCount: commits.length })
    const groups = groupCommitsByType(commits)
    logger.debug('Commits grouped', { groupCount: groups.length })

    // Generate changelog in different formats
    let markdown: string

    if (useAi && process.env.OPENAI_API_KEY) {
      logger.info('Generating AI-enhanced changelog', { repoId, useAi: true })
      // Use AI to generate enhanced changelog with code analysis
      markdown = await generateAiSummaryWithDiffs(groups, repo.repo_full_name)
      logger.info('AI changelog generated successfully')
    } else {
      logger.info('Generating rule-based changelog', { repoId, useAi: false })
      // Use rule-based formatting
      markdown = formatAsMarkdown(groups, repo.repo_full_name, startRef, endRef)
      logger.info('Rule-based changelog generated successfully')
    }

    const html = await markdownToHtml(markdown)
    const jsonData = formatAsJson(groups, repo.repo_full_name, startRef, endRef)

    // Generate slug for public URL
    const slug = `${repo.repo_name}-${Date.now().toString(36)}`
    logger.debug('Generated changelog slug', { slug })

    // Save to database
    logger.dbQuery('INSERT', 'changelogs', { userId: user.id, repoId })
    const saveStartTime = Date.now()
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
    logger.dbQueryComplete('INSERT', 'changelogs', Date.now() - saveStartTime, 1)

    if (insertError) {
      logger.error('Error saving changelog', insertError, { userId: user.id, repoId })
      return NextResponse.json({ error: 'Failed to save changelog' }, { status: 500 })
    }

    const totalDuration = Date.now() - startTime
    logger.apiResponse('POST', '/api/changelog/generate', 200, totalDuration, { 
      changelogId: changelog.id,
      commitCount: commits.length,
      useAi 
    })

    return NextResponse.json({
      success: true,
      changelog,
    })
  } catch (error) {
    const safeError = sanitizeError(error)
    logger.error('Changelog generation error', error, { 
      safeError,
      duration: Date.now() - startTime 
    })
    return NextResponse.json(
      { error: 'Failed to generate changelog' },
      { status: 500 }
    )
  }
}
