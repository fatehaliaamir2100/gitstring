import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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
      console.error('Error fetching changelogs:', error)
      return NextResponse.json({ error: 'Failed to fetch changelogs' }, { status: 500 })
    }

    return NextResponse.json({ changelogs })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    if (!changelogId) {
      return NextResponse.json({ error: 'Changelog ID is required' }, { status: 400 })
    }

    // Delete changelog
    const { error } = await supabase
      .from('changelogs')
      .delete()
      .eq('id', changelogId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting changelog:', error)
      return NextResponse.json({ error: 'Failed to delete changelog' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
