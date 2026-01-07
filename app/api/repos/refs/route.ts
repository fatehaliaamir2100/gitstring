import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubTags, fetchGitHubBranches, fetchGitLabTags, fetchGitLabBranches } from '@/lib/gitApi'
import { getProviderToken } from '@/lib/tokenHelper'
import { validateInput, queryParamsSchema } from '@/lib/validation'
import { sanitizeError } from '@/lib/security'
import { rateLimiters } from '@/lib/rateLimit'

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
    const repoId = searchParams.get('repoId')
    const type = searchParams.get('type') || 'branches' // 'branches' or 'tags'

    // Validate input
    const validated = validateInput(queryParamsSchema, { id: repoId })
    if (!validated.id) {
      return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 })
    }

    // Fetch repo details
    const { data: repo, error: repoError } = await supabase
      .from('repos')
      .select('id, provider, repo_name, repo_owner')
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .single()

    if (repoError || !repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Get decrypted access token securely
    const accessToken = await getProviderToken(user.id, repo.provider as 'github' | 'gitlab')
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token not found. Please reconnect your repository.' }, { status: 401 })
    }

    let refs

    if (repo.provider === 'github') {
      if (type === 'tags') {
        refs = await fetchGitHubTags(accessToken, repo.repo_owner, repo.repo_name)
      } else {
        refs = await fetchGitHubBranches(accessToken, repo.repo_owner, repo.repo_name)
      }
    } else if (repo.provider === 'gitlab') {
      const projectId = `${repo.repo_owner}/${repo.repo_name}`
      if (type === 'tags') {
        refs = await fetchGitLabTags(accessToken, projectId)
      } else {
        refs = await fetchGitLabBranches(accessToken, projectId)
      }
    }

    return NextResponse.json({ refs })
  } catch (error) {
    const safeError = sanitizeError(error)
    console.error('Refs fetch error:', safeError)
    return NextResponse.json(
      { error: 'Failed to fetch refs' },
      { status: 500 }
    )
  }
}
