import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateTokenHealth, validateAllTokens } from '@/lib/tokenHealth'
import { sanitizeError } from '@/lib/security'
import { rateLimiters } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

/**
 * GET /api/token-health - Check token health status
 * Query params: provider (optional) - 'github' or 'gitlab'
 * If provider specified, checks that token only
 * If no provider, checks all tokens
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  logger.apiRequest('GET', '/api/token-health')

  // Apply rate limiting
  const rateLimitResponse = rateLimiters.api(request)
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for token health check')
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
      logger.warn('Unauthorized token health check attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as 'github' | 'gitlab' | null

    if (provider) {
      // Check specific provider
      if (!['github', 'gitlab'].includes(provider)) {
        logger.warn('Invalid provider for token health check', { provider })
        return NextResponse.json({ error: 'Invalid provider. Must be github or gitlab' }, { status: 400 })
      }

      logger.info('Checking token health for provider', { userId: user.id, provider })
      const health = await validateTokenHealth(user.id, provider)

      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/token-health', 200, duration, { 
        provider, 
        valid: health.valid 
      })

      return NextResponse.json({ [provider]: health })
    } else {
      // Check all providers
      logger.info('Checking token health for all providers', { userId: user.id })
      const allHealth = await validateAllTokens(user.id)

      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/token-health', 200, duration, { 
        providers: Object.keys(allHealth).length 
      })

      return NextResponse.json(allHealth)
    }
  } catch (error) {
    const safeError = sanitizeError(error)
    logger.error('Token health check error', error, { safeError, duration: Date.now() - startTime })
    return NextResponse.json({ error: 'Failed to check token health' }, { status: 500 })
  }
}
