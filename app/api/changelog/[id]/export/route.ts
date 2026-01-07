import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportChangelog, getMimeType, getFileExtension, type ExportFormat } from '@/lib/exporters'
import { sanitizeError } from '@/lib/security'
import { rateLimiters } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

/**
 * GET /api/changelog/[id]/export?format=markdown|json|html|text
 * Export a specific changelog in different formats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  logger.apiRequest('GET', '/api/changelog/[id]/export')

  // Apply rate limiting
  const rateLimitResponse = rateLimiters.api(request)
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for changelog export')
    return rateLimitResponse
  }

  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized changelog export attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'markdown') as ExportFormat
    const changelogId = params.id

    logger.info('Exporting changelog', { userId: user.id, changelogId, format })

    // Validate format
    if (!['markdown', 'json', 'html', 'text'].includes(format)) {
      logger.warn('Invalid export format requested', { format })
      return NextResponse.json({ 
        error: 'Invalid format. Supported formats: markdown, json, html, text' 
      }, { status: 400 })
    }

    // Fetch changelog
    const { data: changelog, error: changelogError } = await supabase
      .from('changelogs')
      .select('*, repos!inner(repo_name, repo_full_name)')
      .eq('id', changelogId)
      .eq('user_id', user.id)
      .single()

    if (changelogError || !changelog) {
      logger.warn('Changelog not found for export', { changelogId, userId: user.id })
      return NextResponse.json({ error: 'Changelog not found' }, { status: 404 })
    }

    // Prepare changelog data
    const changelogData = {
      version: changelog.tag_end || 'Unreleased',
      date: changelog.created_at,
      repository: changelog.repos.repo_full_name,
      commits: changelog.json_data?.commits || [],
      formattedChangelog: format === 'html' ? changelog.html : changelog.markdown,
      startRef: changelog.tag_start,
      endRef: changelog.tag_end,
    }

    // Export in requested format
    const exported = exportChangelog(changelogData, format)
    const mimeType = getMimeType(format)
    const extension = getFileExtension(format)
    const filename = `changelog-${changelog.repos.repo_name}-${Date.now()}.${extension}`

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/changelog/[id]/export', 200, duration, { 
      format, 
      size: exported.length 
    })

    // Return as downloadable file
    return new NextResponse(exported, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': exported.length.toString(),
      },
    })
  } catch (error) {
    const safeError = sanitizeError(error)
    logger.error('Changelog export error', error, { safeError, duration: Date.now() - startTime })
    return NextResponse.json({ error: 'Failed to export changelog' }, { status: 500 })
  }
}
