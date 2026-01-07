import OpenAI from 'openai'
import { logger } from './logger'

export type AIProvider = 'openai' | 'ollama'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
}

export interface ChatCompletionResponse {
  content: string
  tokensUsed?: number
}

/**
 * Abstract AI provider interface that supports both OpenAI and Ollama
 */
class AIProviderService {
  private provider: AIProvider
  private openaiClient?: OpenAI
  private ollamaBaseUrl: string

  constructor() {
    // Determine which AI provider to use
    this.provider = (process.env.AI_PROVIDER as AIProvider) || 'openai'
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

    if (this.provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        logger.warn('OpenAI API key not found, AI features may not work')
      } else {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        })
      }
    }

    logger.info('AI Provider initialized', { provider: this.provider, ollamaBaseUrl: this.ollamaBaseUrl })
  }

  /**
   * Get the current AI provider
   */
  getProvider(): AIProvider {
    return this.provider
  }

  /**
   * Check if AI is available
   */
  isAvailable(): boolean {
    if (this.provider === 'openai') {
      return !!this.openaiClient && !!process.env.OPENAI_API_KEY
    } else if (this.provider === 'ollama') {
      return true // Ollama is assumed available if selected
    }
    return false
  }

  /**
   * Generate chat completion using the configured AI provider
   * @param options - Chat completion options
   * @param overrideProvider - Optional provider to use instead of default (for user preferences)
   */
  async chatCompletion(
    options: ChatCompletionOptions, 
    overrideProvider?: AIProvider
  ): Promise<ChatCompletionResponse> {
    const provider = overrideProvider || this.provider
    
    if (provider === 'openai') {
      return this.openaiChatCompletion(options)
    } else if (provider === 'ollama') {
      return this.ollamaChatCompletion(options)
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`)
    }
  }

  /**
   * OpenAI chat completion implementation
   */
  private async openaiChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized')
    }

    const startTime = Date.now()
    logger.externalApiCall('OpenAI', 'POST /chat/completions', { model: options.model })

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: options.model,
        messages: options.messages as any,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
      })

      const duration = Date.now() - startTime
      logger.externalApiResponse('OpenAI', 'chat completions', 200, duration, {
        model: options.model,
        tokensUsed: response.usage?.total_tokens,
      })

      return {
        content: response.choices[0].message.content || '',
        tokensUsed: response.usage?.total_tokens,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error('OpenAI chat completion failed', error, { model: options.model, duration })
      throw error
    }
  }

  /**
   * Ollama chat completion implementation
   */
  private async ollamaChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const startTime = Date.now()
    logger.externalApiCall('Ollama', 'POST /api/chat', { model: options.model, baseUrl: this.ollamaBaseUrl })

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model,
          messages: options.messages,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.max_tokens || 2000,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const duration = Date.now() - startTime

      logger.externalApiResponse('Ollama', 'chat', 200, duration, {
        model: options.model,
        baseUrl: this.ollamaBaseUrl,
      })

      return {
        content: data.message?.content || '',
        tokensUsed: undefined, // Ollama doesn't provide token count in the same way
      }
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error('Ollama chat completion failed', error, { 
        model: options.model, 
        duration,
        baseUrl: this.ollamaBaseUrl 
      })
      throw error
    }
  }

  /**
   * Get default model for the current provider
   * @param provider - Optional provider to get model for (defaults to current provider)
   */
  getDefaultModel(provider?: AIProvider): string {
    const targetProvider = provider || this.provider
    
    if (targetProvider === 'openai') {
      return process.env.OPENAI_MODEL || 'gpt-4o-mini'
    } else if (targetProvider === 'ollama') {
      return process.env.OLLAMA_MODEL || 'phi4-mini'
    }
    return 'gpt-4o-mini'
  }

  /**
   * Check if a specific provider is available
   * @param provider - Provider to check availability for
   */
  isProviderAvailable(provider: AIProvider): boolean {
    if (provider === 'openai') {
      return !!process.env.OPENAI_API_KEY
    } else if (provider === 'ollama') {
      return true // Ollama is assumed available if selected
    }
    return false
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): { provider: AIProvider; available: boolean; name: string }[] {
    return [
      { 
        provider: 'openai', 
        available: this.isProviderAvailable('openai'),
        name: 'OpenAI (Cloud)'
      },
      { 
        provider: 'ollama', 
        available: this.isProviderAvailable('ollama'),
        name: 'Ollama (Local)'
      },
    ]
  }
}

// Export singleton instance
export const aiProvider = new AIProviderService()
