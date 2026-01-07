import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt, sanitizeError } from '@/lib/security'
import { validateInput, queryParamsSchema, providerTokenSchema } from '@/lib/validation'
import { rateLimiters } from '@/lib/rateLimit'

// GET - Check if provider token exists (NEVER returns actual token)
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimiters.api(request)
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
    return NextResponse.json({ 
      hasToken: !!tokenRecord,
      createdAt: tokenRecord?.created_at || null,
      updatedAt: tokenRecord?.updated_at || null
    })
  } catch (error) {
    const safeError = sanitizeError(error)
    console.error('Token check error:', safeError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save or update provider token
export async function POST(request: NextRequest) {
  // Apply strict rate limiting for token operations
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

    const body = await request.json()
    
    // Validate input
    const { provider, token } = validateInput(providerTokenSchema, body)

    // Encrypt token before storing
    const encryptedToken = encrypt(token)

    // Upsert token (insert or update if exists)
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

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
    }

    // SECURITY: Never return the token or encrypted value
    return NextResponse.json({ success: true })
  } catch (error) {
    const safeError = sanitizeError(error)
    console.error('Token save error:', safeError)
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
