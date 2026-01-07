import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl
  
  logger.debug('Middleware processing request', { 
    method: request.method,
    pathname,
    userAgent: request.headers.get('user-agent')?.substring(0, 50)
  })

  // Update Supabase session
  const response = await updateSession(request)

  // Add security headers
  const headers = new Headers(response.headers)
  
  logger.debug('Adding security headers', { pathname })
  
  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS protection (legacy but still useful)
  headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions policy
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.github.com https://gitlab.com https://api.openai.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ]
  headers.set('Content-Security-Policy', cspDirectives.join('; '))
  
  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    logger.debug('HSTS header added', { pathname })
  }

  const duration = Date.now() - startTime
  if (duration > 100) {
    logger.warn('Slow middleware execution', { pathname, duration })
  }

  return NextResponse.next({
    request,
    headers
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
