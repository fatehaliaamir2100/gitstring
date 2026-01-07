import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubRepos, fetchGitLabProjects } from '@/lib/gitApi'
import { getProviderToken } from '@/lib/tokenHelper'
import { sanitizeError } from '@/lib/security'
import { rateLimiters } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { RepoCache } from '@/lib/cache'

/**
 * GET /api/repos/discover - Fetch available repositories from provider
 * Uses stored encrypted token - never exposes tokens to client
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  logger.apiRequest('GET', '/api/repos/discover')
  
  // Apply rate limiting
  const rateLimitResponse = rateLimiters.api(request)
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for repos discover')
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
      logger.warn('Unauthorized repos discover attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get provider from query params
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as 'github' | 'gitlab'

    if (!provider || !['github', 'gitlab'].includes(provider)) {
      logger.warn('Invalid provider in repos discover', { provider })
      return NextResponse.json({ error: 'Valid provider (github/gitlab) is required' }, { status: 400 })
    }

    logger.info('Discovering repositories', { provider, userId: user.id })

    // Check cache first
    const cached = RepoCache.get(user.id, provider)
    if (cached) {
      logger.info('Repositories retrieved from cache', { provider, userId: user.id, repoCount: cached.length })
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/repos/discover', 200, duration, { 
        provider, 
        repoCount: cached.length,
        cached: true
      })
      return NextResponse.json({ repos: cached })
    }

    // Get stored encrypted token (server-side only)
    const accessToken = await getProviderToken(user.id, provider)
    
    if (!accessToken) {
      logger.warn('No provider token found for discovery', { provider, userId: user.id })
      return NextResponse.json({ 
        error: 'No access token found. Please connect your provider first.',
        needsToken: true 
      }, { status: 401 })
    }

    // Fetch repositories from provider
    let repos
    if (provider === 'github') {
      logger.externalApiCall('GitHub', 'GET /user/repos', { userId: user.id })
      repos = await fetchGitHubRepos(accessToken)
    } else if (provider === 'gitlab') {
      logger.externalApiCall('GitLab', 'GET /projects', { userId: user.id })
      repos = await fetchGitLabProjects(accessToken)
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
    }

    // Cache the results
    if (repos && repos.length > 0) {
      RepoCache.set(user.id, provider, repos)
      logger.debug('Repositories cached', { provider, userId: user.id, repoCount: repos.length })
    }

    const duration = Date.now() - startTime
    logger.info('Repositories discovered successfully', { 
      provider, 
      userId: user.id, 
      repoCount: repos?.length || 0,
      duration 
    })
    logger.apiResponse('GET', '/api/repos/discover', 200, duration, { 
      provider, 
      repoCount: repos?.length || 0 
    })

    return NextResponse.json({ repos })
    
  } catch (error) {
    const safeError = sanitizeError(error)
    logger.error('Repos discovery error', error, { 
      safeError, 
      duration: Date.now() - startTime 
    })
    return NextResponse.json({ 
      error: 'Failed to discover repositories' 
    }, { status: 500 })
  }
}
