import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt, sanitizeError } from '@/lib/security'
import { validateInput, queryParamsSchema, providerTokenSchema } from '@/lib/validation'
import { rateLimiters } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

// GET - Check if provider token exists (NEVER returns actual token)
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  logger.apiRequest('GET', '/api/provider-tokens')
  
  // Apply rate limiting
  const rateLimitResponse = rateLimiters.api(request)
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for provider-tokens GET')
    return rateLimitResponse
  }

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    // Validate provider
    const validation = validateInput(queryParamsSchema, { provider })
    if (!validation.provider || !['github', 'gitlab'].includes(validation.provider)) {
      return NextResponse.json({ error: 'Valid provider (github/gitlab) is required' }, { status: 400 })
    }

    const { data: tokenRecord, error } = await supabase
      .from('provider_tokens')
      .select('id, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('provider', validation.provider)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to check token' }, { status: 500 })
    }

    // SECURITY: Never return the actual token, only metadata
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/provider-tokens', 200, duration, { 
      hasToken: !!tokenRecord,
      provider: validation.provider 
    })
    
    return NextResponse.json({ 
      hasToken: !!tokenRecord,
      createdAt: tokenRecord?.created_at || null,
      updatedAt: tokenRecord?.updated_at || null
    })
  } catch (error) {
    const safeError = sanitizeError(error)
    logger.error('Token check error', error, { safeError })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save or update provider token
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  logger.apiRequest('POST', '/api/provider-tokens')
  
  // Apply strict rate limiting for token operations
  const rateLimitResponse = rateLimiters.strict(request)
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for provider-tokens POST')
    return rateLimitResponse
  }

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const { provider, token } = validateInput(providerTokenSchema, body)
    
    logger.info('Saving provider token', { provider, userId: user.id, tokenLength: token?.length })

    // Encrypt token before storing
    logger.debug('Encrypting provider token', { provider })
    const encryptedToken = encrypt(token)
    logger.debug('Token encrypted successfully', { provider, encryptedLength: encryptedToken.length })

    // Upsert token (insert or update if exists)
    logger.dbQuery('UPSERT', 'provider_tokens', { userId: user.id, provider })
    const dbStartTime = Date.now()
    const { error: upsertError } = await supabase
      .from('provider_tokens')
      .upsert(
        {
          user_id: user.id,
          provider,
          encrypted_token: encryptedToken,
        },
        {
          onConflict: 'user_id,provider',
        }
      )
    logger.dbQueryComplete('UPSERT', 'provider_tokens', Date.now() - dbStartTime)

    if (upsertError) {
      logger.error('Failed to save provider token', upsertError, { userId: user.id, provider })
      return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
    }

    logger.info('Provider token saved successfully', { provider, userId: user.id })
    // SECURITY: Never return the token or encrypted value
    return NextResponse.json({ success: true })
  } catch (error) {
    const safeError = sanitizeError(error)
    logger.error('Token save error', error, { safeError })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove provider token
export async function DELETE(request: NextRequest) {
  // Apply strict rate limiting
  const rateLimitResponse = rateLimiters.strict(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    // Validate provider
    const validation = validateInput(queryParamsSchema, { provider })
    if (!validation.provider || !['github', 'gitlab'].includes(validation.provider)) {
      return NextResponse.json({ error: 'Valid provider (github/gitlab) is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('provider_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', validation.provider)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const safeError = sanitizeError(error)
    console.error('Token deletion error:', safeError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
