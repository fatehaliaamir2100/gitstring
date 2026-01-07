import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubRepos, fetchGitLabProjects } from '@/lib/gitApi'
import { validateInput, repoConnectionSchema } from '@/lib/validation'
import { encrypt, sanitizeError } from '@/lib/security'
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

    // Fetch user's connected repositories (exclude sensitive fields)
    const { data: repos, error } = await supabase
      .from('repos')
      .select('id, user_id, provider, repo_name, repo_owner, repo_full_name, repo_url, default_branch, is_private, last_synced_at, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
    }

    return NextResponse.json({ repos })
  } catch (error) {
    const safeError = sanitizeError(error)
    console.error('Repos fetch error:', safeError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Apply strict rate limiting for adding repos
  const rateLimitResponse = rateLimiters.strict(request)
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

    const body = await request.json()
    const { provider, repoName, repoOwner, accessToken, isPrivate, defaultBranch, repoUrl } = body

    // Validate input
    const validatedRepo = validateInput(repoConnectionSchema, {
      provider,
      repoName,
      repoOwner,
      repoUrl,
      defaultBranch,
      isPrivate
    })

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    const repoFullName = `${validatedRepo.repoOwner}/${validatedRepo.repoName}`

    // Store encrypted token in provider_tokens table
    const encryptedToken = encrypt(accessToken)
    const { error: tokenError } = await supabase
      .from('provider_tokens')
      .upsert(
        {
          user_id: user.id,
          provider: validatedRepo.provider,
          encrypted_token: encryptedToken,
        },
        {
          onConflict: 'user_id,provider',
        }
      )

    if (tokenError) {
      return NextResponse.json({ error: 'Failed to store access token' }, { status: 500 })
    }

    // Insert repository (without access_token)
    const { data: repo, error: insertError } = await supabase
      .from('repos')
      .insert({
        user_id: user.id,
        provider: validatedRepo.provider,
        repo_name: validatedRepo.repoName,
        repo_owner: validatedRepo.repoOwner,
        repo_full_name: repoFullName,
        repo_url: validatedRepo.repoUrl,
        default_branch: validatedRepo.defaultBranch || 'main',
        is_private: validatedRepo.isPrivate || false,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to add repository' }, { status: 500 })
    }

    return NextResponse.json({ success: true, repo })
  } catch (error) {
    const safeError = sanitizeError(error)
    console.error('Repo creation error:', safeError)
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
