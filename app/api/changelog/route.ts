import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateInput, queryParamsSchema } from '@/lib/validation'
import { sanitizeError } from '@/lib/security'
import { rateLimiters } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimiters.api(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's changelogs
    const { data: changelogs, error } = await supabase
      .from('changelogs')
      .select(`
        *,
        repos (
          repo_name,
          repo_owner,
          repo_full_name,
          provider
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch changelogs' }, { status: 500 })
    }

    return NextResponse.json({ changelogs })
  } catch (error) {
    const safeError = sanitizeError(error)
    console.error('Changelogs fetch error:', safeError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimiters.api(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const changelogId = searchParams.get('id')

    // Validate ID
    const validated = validateInput(queryParamsSchema, { id: changelogId })
    if (!validated.id) {
      return NextResponse.json({ error: 'Changelog ID is required' }, { status: 400 })
    }

    // Delete changelog (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('changelogs')
      .delete()
      .eq('id', validated.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete changelog' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const safeError = sanitizeError(error)
    console.error('Changelog deletion error:', safeError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
