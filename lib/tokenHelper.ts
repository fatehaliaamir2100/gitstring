import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/security'
import { logger } from './logger'

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
  const startTime = Date.now()
  logger.debug('Retrieving provider token', { userId, provider })
  
  try {
    const supabase = await createClient()

    logger.dbQuery('SELECT', 'provider_tokens', { userId, provider })
    const dbStartTime = Date.now()
    const { data, error } = await supabase
      .from('provider_tokens')
      .select('encrypted_token')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()
    logger.dbQueryComplete('SELECT', 'provider_tokens', Date.now() - dbStartTime, data ? 1 : 0)

    if (error || !data?.encrypted_token) {
      logger.warn('Provider token not found', { userId, provider, error: error?.message })
      return null
    }

    // Decrypt token for use
    logger.debug('Decrypting provider token', { provider })
    const token = decrypt(data.encrypted_token)
    
    const duration = Date.now() - startTime
    logger.info('Provider token retrieved successfully', { provider, duration })
    
    return token
  } catch (error) {
    logger.error('Failed to retrieve provider token', error, { userId, provider })
    return null
  }
}

/**
 * Get decrypted repo access token (if still stored in repos table)
 * This is deprecated - use getProviderToken instead
 * @deprecated
 */
export async function getRepoAccessToken(repoId: string, userId: string): Promise<string | null> {
  logger.warn('Using deprecated getRepoAccessToken function', { repoId, userId })
  
  try {
    const supabase = await createClient()

    logger.dbQuery('SELECT', 'repos', { repoId, userId })
    const { data: repo, error } = await supabase
      .from('repos')
      .select('provider, access_token')
      .eq('id', repoId)
      .eq('user_id', userId)
      .single()

    if (error || !repo) {
      logger.warn('Repository not found in getRepoAccessToken', { repoId, userId })
      return null
    }

    // If access_token still exists in repos (legacy), try to decrypt it
    if (repo.access_token) {
      logger.debug('Found legacy access_token in repos table', { repoId })
      try {
        return decrypt(repo.access_token)
      } catch {
        // If decryption fails, it might be a plain token (legacy)
        // In production, you should migrate all tokens
        logger.securityEvent('Found unencrypted legacy token in repos table', { repoId })
        return repo.access_token
      }
    }

    // Otherwise, fetch from provider_tokens table
    logger.debug('Falling back to provider_tokens table', { repoId, provider: repo.provider })
    return await getProviderToken(userId, repo.provider as 'github' | 'gitlab')
  } catch (error) {
    logger.error('Failed to retrieve repo access token', error, { repoId, userId })
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
