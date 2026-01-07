import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/security'

/**
 * Secure token retrieval helper
 * INTERNAL USE ONLY - Never expose these functions through API endpoints
 */

/**
 * Get decrypted provider token for server-side operations
 * @param userId - User ID
 * @param provider - Git provider (github/gitlab)
 * @returns Decrypted token or null
 */
export async function getProviderToken(
  userId: string,
  provider: 'github' | 'gitlab'
): Promise<string | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('provider_tokens')
      .select('encrypted_token')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()

    if (error || !data?.encrypted_token) {
      return null
    }

    // Decrypt token for use
    return decrypt(data.encrypted_token)
  } catch (error) {
    console.error('Failed to retrieve provider token')
    return null
  }
}

/**
 * Get decrypted repo access token (if still stored in repos table)
 * This is deprecated - use getProviderToken instead
 * @deprecated
 */
export async function getRepoAccessToken(repoId: string, userId: string): Promise<string | null> {
  try {
    const supabase = await createClient()

    const { data: repo, error } = await supabase
      .from('repos')
      .select('provider, access_token')
      .eq('id', repoId)
      .eq('user_id', userId)
      .single()

    if (error || !repo) {
      return null
    }

    // If access_token still exists in repos (legacy), try to decrypt it
    if (repo.access_token) {
      try {
        return decrypt(repo.access_token)
      } catch {
        // If decryption fails, it might be a plain token (legacy)
        // In production, you should migrate all tokens
        return repo.access_token
      }
    }

    // Otherwise, fetch from provider_tokens table
    return await getProviderToken(userId, repo.provider as 'github' | 'gitlab')
  } catch (error) {
    console.error('Failed to retrieve repo access token')
    return null
  }
}

/**
 * Check if user has a valid provider token
 * @param userId - User ID
 * @param provider - Git provider
 * @returns boolean indicating token existence
 */
export async function hasProviderToken(
  userId: string,
  provider: 'github' | 'gitlab'
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('provider_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()

    return !error && !!data
  } catch {
    return false
  }
}
