import { getProviderToken } from './tokenHelper'
import { logger } from './logger'
import { TokenHealthCache } from './cache'

export interface TokenHealthStatus {
  valid: boolean
  reason?: 'not_found' | 'invalid_or_expired' | 'rate_limited' | 'network_error'
  lastChecked: string
  remainingRequests?: number
  resetAt?: string
  scopes?: string[]
}

/**
 * Test if a GitHub token is valid
 */
async function testGitHubToken(token: string): Promise<TokenHealthStatus> {
  try {
    logger.debug('Testing GitHub token validity')
    
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    const remaining = response.headers.get('x-ratelimit-remaining')
    const reset = response.headers.get('x-ratelimit-reset')
    const scopes = response.headers.get('x-oauth-scopes')

    if (response.ok) {
      logger.info('GitHub token is valid', {
        remainingRequests: remaining,
        scopes: scopes?.split(', '),
      })
      return {
        valid: true,
        lastChecked: new Date().toISOString(),
        remainingRequests: remaining ? parseInt(remaining) : undefined,
        resetAt: reset ? new Date(parseInt(reset) * 1000).toISOString() : undefined,
        scopes: scopes?.split(', '),
      }
    }

    if (response.status === 401) {
      logger.warn('GitHub token is invalid or expired')
      return {
        valid: false,
        reason: 'invalid_or_expired',
        lastChecked: new Date().toISOString(),
      }
    }

    if (response.status === 403) {
      logger.warn('GitHub token is rate limited')
      return {
        valid: false,
        reason: 'rate_limited',
        lastChecked: new Date().toISOString(),
        resetAt: reset ? new Date(parseInt(reset) * 1000).toISOString() : undefined,
      }
    }

    return {
      valid: false,
      reason: 'network_error',
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('Error testing GitHub token', error)
    return {
      valid: false,
      reason: 'network_error',
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Test if a GitLab token is valid
 */
async function testGitLabToken(token: string): Promise<TokenHealthStatus> {
  try {
    logger.debug('Testing GitLab token validity')
    
    const baseUrl = process.env.GITLAB_URL || 'https://gitlab.com'
    const response = await fetch(`${baseUrl}/api/v4/user`, {
      headers: {
        'PRIVATE-TOKEN': token,
      },
    })

    const remaining = response.headers.get('ratelimit-remaining')
    const reset = response.headers.get('ratelimit-reset')

    if (response.ok) {
      logger.info('GitLab token is valid', { remainingRequests: remaining })
      return {
        valid: true,
        lastChecked: new Date().toISOString(),
        remainingRequests: remaining ? parseInt(remaining) : undefined,
        resetAt: reset ? new Date(parseInt(reset) * 1000).toISOString() : undefined,
      }
    }

    if (response.status === 401) {
      logger.warn('GitLab token is invalid or expired')
      return {
        valid: false,
        reason: 'invalid_or_expired',
        lastChecked: new Date().toISOString(),
      }
    }

    if (response.status === 429) {
      logger.warn('GitLab token is rate limited')
      return {
        valid: false,
        reason: 'rate_limited',
        lastChecked: new Date().toISOString(),
      }
    }

    return {
      valid: false,
      reason: 'network_error',
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('Error testing GitLab token', error)
    return {
      valid: false,
      reason: 'network_error',
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Validate token health for a user and provider
 * Results are cached for 10 minutes
 */
export async function validateTokenHealth(
  userId: string,
  provider: 'github' | 'gitlab'
): Promise<TokenHealthStatus> {
  logger.info('Validating token health', { userId, provider })

  // Check cache first
  const cached = TokenHealthCache.get(userId, provider)
  if (cached) {
    logger.debug('Token health retrieved from cache', { userId, provider })
    return cached
  }

  // Get token
  const token = await getProviderToken(userId, provider)
  if (!token) {
    logger.warn('Token not found for health check', { userId, provider })
    const result: TokenHealthStatus = {
      valid: false,
      reason: 'not_found',
      lastChecked: new Date().toISOString(),
    }
    TokenHealthCache.set(userId, provider, result)
    return result
  }

  // Test token validity
  const result =
    provider === 'github'
      ? await testGitHubToken(token)
      : await testGitLabToken(token)

  // Cache the result
  TokenHealthCache.set(userId, provider, result)

  return result
}

/**
 * Check all tokens for a user
 */
export async function validateAllTokens(userId: string): Promise<{
  github?: TokenHealthStatus
  gitlab?: TokenHealthStatus
}> {
  logger.info('Validating all tokens for user', { userId })

  const [github, gitlab] = await Promise.all([
    validateTokenHealth(userId, 'github').catch(() => undefined),
    validateTokenHealth(userId, 'gitlab').catch(() => undefined),
  ])

  return { github, gitlab }
}
