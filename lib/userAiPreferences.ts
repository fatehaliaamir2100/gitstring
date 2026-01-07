import { aiProvider, AIProvider } from './aiProvider'
import { createClient } from './supabase/server'
import { logger } from './logger'

/**
 * Get the AI provider to use for a specific user
 * Priority: User preference > Environment variable > Default (openai)
 */
export async function getUserAiProvider(userId: string): Promise<{
  provider: AIProvider
  model?: string
}> {
  try {
    const supabase = await createClient()
    
    // Fetch user preferences
    const { data: userData, error } = await supabase
      .from('users')
      .select('ai_provider, ai_model')
      .eq('id', userId)
      .single()

    if (error || !userData) {
      logger.debug('No user preferences found, using default', { userId })
      return {
        provider: aiProvider.getProvider(),
        model: aiProvider.getDefaultModel(),
      }
    }

    // If user has 'default' or no preference, use system default
    if (!userData.ai_provider || userData.ai_provider === 'default') {
      return {
        provider: aiProvider.getProvider(),
        model: userData.ai_model || aiProvider.getDefaultModel(),
      }
    }

    // Use user's preference
    const userProvider = userData.ai_provider as AIProvider
    const userModel = userData.ai_model || aiProvider.getDefaultModel(userProvider)

    logger.info('Using user AI preferences', { 
      userId, 
      provider: userProvider, 
      model: userModel 
    })

    return {
      provider: userProvider,
      model: userModel,
    }
  } catch (error) {
    logger.error('Error fetching user AI provider', error, { userId })
    // Fallback to system default
    return {
      provider: aiProvider.getProvider(),
      model: aiProvider.getDefaultModel(),
    }
  }
}

/**
 * Check if AI is available for a user based on their preferences
 */
export async function isAiAvailableForUser(userId: string): Promise<boolean> {
  const { provider } = await getUserAiProvider(userId)
  return aiProvider.isProviderAvailable(provider)
}
