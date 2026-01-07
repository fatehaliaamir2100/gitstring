import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubRepos, fetchGitLabProjects } from '@/lib/gitApi'
import { validateInput, repoConnectionSchema } from '@/lib/validation'
import { encrypt, sanitizeError } from '@/lib/security'
import { getProviderToken } from '@/lib/tokenHelper'
import { rateLimiters } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { RepoCache, CommitCache, ChangelogCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  logger.apiRequest('GET', '/api/repos')
  
  // Apply rate limiting
  const rateLimitResponse = rateLimiters.api(request)
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for repos GET', { ip: request.headers.get('x-forwarded-for') || 'unknown' })
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
      logger.warn('Unauthorized repos GET attempt', { authError: authError?.message })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Fetching user repositories', { userId: user.id })

    // Fetch user's connected repositories (exclude sensitive fields)
    logger.dbQuery('SELECT', 'repos', { userId: user.id })
    const dbStartTime = Date.now()
    const { data: repos, error } = await supabase
      .from('repos')
      .select('id, user_id, provider, repo_name, repo_owner, repo_full_name, repo_url, default_branch, is_private, last_synced_at, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    logger.dbQueryComplete('SELECT', 'repos', Date.now() - dbStartTime, repos?.length || 0)

    if (error) {
      logger.error('Failed to fetch repositories', error, { userId: user.id })
      return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/repos', 200, duration, { repoCount: repos.length })
    return NextResponse.json({ repos })
  } catch (error) {
    const safeError = sanitizeError(error)
    logger.error('Repos fetch error', error, { safeError, duration: Date.now() - startTime })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  logger.apiRequest('POST', '/api/repos')
  
  // Apply strict rate limiting for adding repos
  const rateLimitResponse = rateLimiters.strict(request)
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for repos POST', { ip: request.headers.get('x-forwarded-for') || 'unknown' })
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
      logger.warn('Unauthorized repo connection attempt', { authError: authError?.message })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, repoName, repoOwner, isPrivate, defaultBranch, repoUrl } = body

    logger.info('Repository connection request', { provider, repoName, repoOwner, userId: user.id })

    // Validate input
    const validatedRepo = validateInput(repoConnectionSchema, {
      provider,
      repoName,
      repoOwner,
      repoUrl,
      defaultBranch,
      isPrivate
    })

    const repoFullName = `${validatedRepo.repoOwner}/${validatedRepo.repoName}`
    logger.debug('Repository validated', { repoFullName, provider: validatedRepo.provider })

    // Get encrypted token from storage (server-side only)
    logger.debug('Retrieving provider token from storage', { provider: validatedRepo.provider, userId: user.id })
    const accessToken = await getProviderToken(user.id, validatedRepo.provider as 'github' | 'gitlab')
    
    if (!accessToken) {
      logger.warn('No provider token found for repo connection', { userId: user.id, provider: validatedRepo.provider })
      return NextResponse.json({ 
        error: 'No access token found. Please save your provider token first.',
        needsToken: true 
      }, { status: 401 })
    }

    logger.info('Provider token retrieved successfully', { provider: validatedRepo.provider })

    // Insert repository (without access_token)
    logger.dbQuery('INSERT', 'repos', { userId: user.id, repoFullName })
    const insertStartTime = Date.now()
    const { data: repo, error: insertError } = await supabase
      .from('repos')
      .insert({
        user_id: user.id,
        provider: validatedRepo.provider,
        repo_name: validatedRepo.repoName,
        repo_owner: validatedRepo.repoOwner,
        repo_full_name: repoFullName,
        repo_url: validatedRepo.repoUrl,
        default_branch: validatedRepo.defaultBranch || 'main',
        is_private: validatedRepo.isPrivate || false,
      })
      .select()
      .single()
    logger.dbQueryComplete('INSERT', 'repos', Date.now() - insertStartTime, 1)

    if (insertError) {
      logger.error('Failed to add repository', insertError, { userId: user.id, repoFullName })
      return NextResponse.json({ error: 'Failed to add repository' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.info('Repository connected successfully', { repoId: repo.id, repoFullName, duration })
    logger.apiResponse('POST', '/api/repos', 200, duration, { repoId: repo.id })
    
    // Invalidate repo cache after adding new repo
    RepoCache.invalidate(user.id, validatedRepo.provider as 'github' | 'gitlab')
    logger.debug('Repo cache invalidated after adding new repo', { provider: validatedRepo.provider })
    
    return NextResponse.json({ success: true, repo })
  } catch (error) {
    const safeError = sanitizeError(error)
    logger.error('Repo creation error', error, { safeError, duration: Date.now() - startTime })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  logger.apiRequest('DELETE', '/api/repos')
  
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized repo deletion attempt', { authError: authError?.message })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const repoId = searchParams.get('id')

    logger.info('Repository deletion request', { repoId: repoId || 'unknown', userId: user.id })

    if (!repoId) {
      logger.warn('Repository ID missing in deletion request', { userId: user.id })
      return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 })
    }

    // Delete repository
    logger.dbQuery('DELETE', 'repos', { repoId, userId: user.id })
    const deleteStartTime = Date.now()
    const { error } = await supabase
      .from('repos')
      .delete()
      .eq('id', repoId)
      .eq('user_id', user.id)
    logger.dbQueryComplete('DELETE', 'repos', Date.now() - deleteStartTime)

    if (error) {
      logger.error('Error deleting repository', error, { repoId, userId: user.id })
      return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    logger.info('Repository deleted successfully', { repoId, duration })
    logger.apiResponse('DELETE', '/api/repos', 200, duration, { repoId })
    
    // Invalidate all related caches
    RepoCache.invalidate(user.id) // Invalidates all providers for user
    logger.debug('Caches invalidated after repo deletion', { repoId })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Repository deletion error', error, { duration: Date.now() - startTime })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
