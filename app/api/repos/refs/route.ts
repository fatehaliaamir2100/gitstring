import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubTags, fetchGitHubBranches, fetchGitLabTags, fetchGitLabBranches } from '@/lib/gitApi'

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
    const repoId = searchParams.get('repoId')
    const type = searchParams.get('type') || 'branches' // 'branches' or 'tags'

    if (!repoId) {
      return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 })
    }

    // Fetch repo details
    const { data: repo, error: repoError } = await supabase
      .from('repos')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', user.id)
      .single()

    if (repoError || !repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    let refs

    if (repo.provider === 'github') {
      if (type === 'tags') {
        refs = await fetchGitHubTags(repo.access_token, repo.repo_owner, repo.repo_name)
      } else {
        refs = await fetchGitHubBranches(repo.access_token, repo.repo_owner, repo.repo_name)
      }
    } else if (repo.provider === 'gitlab') {
      const projectId = `${repo.repo_owner}/${repo.repo_name}`
      if (type === 'tags') {
        refs = await fetchGitLabTags(repo.access_token, projectId)
      } else {
        refs = await fetchGitLabBranches(repo.access_token, projectId)
      }
    }

    return NextResponse.json({ refs })
  } catch (error) {
    console.error('Error fetching refs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
