import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubRepos, fetchGitLabProjects } from '@/lib/gitApi'

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

    // Fetch user's connected repositories
    const { data: repos, error } = await supabase
      .from('repos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching repos:', error)
      return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
    }

    return NextResponse.json({ repos })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { provider, repoName, repoOwner, accessToken, isPrivate, defaultBranch, repoUrl } = body

    if (!provider || !repoName || !repoOwner || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const repoFullName = `${repoOwner}/${repoName}`

    // Insert repository
    const { data: repo, error: insertError } = await supabase
      .from('repos')
      .insert({
        user_id: user.id,
        provider,
        repo_name: repoName,
        repo_owner: repoOwner,
        repo_full_name: repoFullName,
        repo_url: repoUrl,
        default_branch: defaultBranch || 'main',
        access_token: accessToken,
        is_private: isPrivate || false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting repo:', insertError)
      return NextResponse.json({ error: 'Failed to add repository' }, { status: 500 })
    }

    return NextResponse.json({ success: true, repo })
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
    const repoId = searchParams.get('id')

    if (!repoId) {
      return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 })
    }

    // Delete repository
    const { error } = await supabase
      .from('repos')
      .delete()
      .eq('id', repoId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting repo:', error)
      return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
