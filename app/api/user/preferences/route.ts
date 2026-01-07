import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/user/preferences
 * Get current user's AI preferences
 */
export async function GET(request: NextRequest) {
  logger.apiRequest('GET', '/api/user/preferences')
  
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized preferences request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user preferences
    logger.dbQuery('SELECT', 'users', { userId: user.id })
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('ai_provider, ai_model, preferences')
      .eq('id', user.id)
      .single()

    if (dbError) {
      logger.error('Error fetching user preferences', dbError, { userId: user.id })
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    logger.apiResponse('GET', '/api/user/preferences', 200, 0, { userId: user.id })

    return NextResponse.json({
      ai_provider: userData?.ai_provider || 'default',
      ai_model: userData?.ai_model || null,
      preferences: userData?.preferences || {},
    })
  } catch (error) {
    logger.error('Error in GET /api/user/preferences', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/user/preferences
 * Update current user's AI preferences
 */
export async function PUT(request: NextRequest) {
  logger.apiRequest('PUT', '/api/user/preferences')
  
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized preferences update')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ai_provider, ai_model } = body

    // Validate ai_provider
    if (ai_provider && !['openai', 'ollama', 'default'].includes(ai_provider)) {
      return NextResponse.json(
        { error: 'Invalid AI provider. Must be: openai, ollama, or default' },
        { status: 400 }
      )
    }

    logger.info('Updating user AI preferences', { 
      userId: user.id, 
      ai_provider, 
      ai_model 
    })

    // Update user preferences
    logger.dbQuery('UPDATE', 'users', { userId: user.id })
    const { data, error: updateError } = await supabase
      .from('users')
      .update({
        ai_provider: ai_provider || 'default',
        ai_model: ai_model || null,
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating user preferences', updateError, { userId: user.id })
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    logger.apiResponse('PUT', '/api/user/preferences', 200, 0, { 
      userId: user.id,
      ai_provider: data.ai_provider 
    })

    return NextResponse.json({
      success: true,
      ai_provider: data.ai_provider,
      ai_model: data.ai_model,
    })
  } catch (error) {
    logger.error('Error in PUT /api/user/preferences', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
