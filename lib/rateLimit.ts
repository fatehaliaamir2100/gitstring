import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate limiting implementation using in-memory store
 * For production, use Redis or similar distributed cache
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const rateLimitStore: RateLimitStore = {}

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  })
}, 10 * 60 * 1000)

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string
}

/**
 * Rate limit middleware
 * @param config - Rate limit configuration
 * @returns Middleware function
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = config

  return (request: NextRequest): NextResponse | null => {
    // Get identifier (IP address or user ID from auth)
    const identifier = getIdentifier(request)
    const now = Date.now()

    // Initialize or get current rate limit data
    if (!rateLimitStore[identifier] || rateLimitStore[identifier].resetTime < now) {
      rateLimitStore[identifier] = {
        count: 1,
        resetTime: now + windowMs
      }
      return null // Allow request
    }

    // Increment request count
    rateLimitStore[identifier].count++

    // Check if limit exceeded
    if (rateLimitStore[identifier].count > maxRequests) {
      const resetIn = Math.ceil((rateLimitStore[identifier].resetTime - now) / 1000)
      
      return NextResponse.json(
        { error: message, retryAfter: resetIn },
        { 
          status: 429,
          headers: {
            'Retry-After': resetIn.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitStore[identifier].resetTime).toISOString()
          }
        }
      )
    }

    return null // Allow request
  }
}

/**
 * Get identifier for rate limiting
 * Priority: User ID > IP Address
 */
function getIdentifier(request: NextRequest): string {
  // Try to get user ID from authorization header or cookie
  // This is a simplified version - adjust based on your auth implementation
  const userId = request.headers.get('x-user-id')
  if (userId) return `user:${userId}`

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  
  return `ip:${ip}`
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // Strict limit for sensitive operations
  strict: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many requests for this sensitive operation. Please try again later.'
  }),

  // Standard API limit
  api: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'API rate limit exceeded. Please slow down your requests.'
  }),

  // Authentication attempts
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again later.'
  }),

  // Changelog generation (resource intensive)
  generate: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    message: 'Generation rate limit exceeded. Please wait before generating more changelogs.'
  })
}

/**
 * Helper to apply rate limiting to API routes
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: (request: NextRequest) => NextResponse | null
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const limitResponse = limiter(request)
    if (limitResponse) {
      return limitResponse
    }

    // Continue to handler
    return handler(request)
  }
}
