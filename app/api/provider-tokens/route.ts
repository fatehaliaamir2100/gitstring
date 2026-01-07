import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Retrieve provider token
export async function GET(request: NextRequest) {
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

    if (!provider || !['github', 'gitlab'].includes(provider)) {
      return NextResponse.json({ error: 'Valid provider (github/gitlab) is required' }, { status: 400 })
    }

    const { data: tokenRecord, error } = await supabase
      .from('provider_tokens')
      .select('encrypted_token')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching token:', error)
      return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 })
    }

    return NextResponse.json({ 
      hasToken: !!tokenRecord,
      token: tokenRecord?.encrypted_token || null
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save or update provider token
export async function POST(request: NextRequest) {
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
    const { provider, token } = body

    if (!provider || !token || !['github', 'gitlab'].includes(provider)) {
      return NextResponse.json({ error: 'Provider and token are required' }, { status: 400 })
    }

    // Upsert token (insert or update if exists)
    const { data: tokenRecord, error: upsertError } = await supabase
      .from('provider_tokens')
      .upsert(
        {
          user_id: user.id,
          provider,
          encrypted_token: token,
        },
        {
          onConflict: 'user_id,provider',
        }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting token:', upsertError)
      return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
    }

    return NextResponse.json({ success: true, tokenRecord })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove provider token
export async function DELETE(request: NextRequest) {
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

    if (!provider || !['github', 'gitlab'].includes(provider)) {
      return NextResponse.json({ error: 'Valid provider (github/gitlab) is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('provider_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider)

    if (error) {
      console.error('Error deleting token:', error)
      return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
