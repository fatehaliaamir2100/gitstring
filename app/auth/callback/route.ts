import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const startTime = Date.now()
  logger.apiRequest('GET', '/auth/callback')
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  logger.info('Auth callback initiated', { hasCode: !!code, next })

  if (code) {
    const supabase = await createClient()
    logger.authEvent('exchanging code for session')
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const duration = Date.now() - startTime
      logger.authEvent('authentication successful', { duration })
      logger.apiResponse('GET', '/auth/callback', 302, duration)
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      logger.error('Auth code exchange failed', error, { hasCode: !!code })
    }
  } else {
    logger.warn('Auth callback missing code parameter')
  }

  // Return the user to an error page with instructions
  const duration = Date.now() - startTime
  logger.apiResponse('GET', '/auth/callback', 302, duration, { error: 'auth_failed' })
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
