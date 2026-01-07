import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateInput, queryParamsSchema } from '@/lib/validation'
import { sanitizeError } from '@/lib/security'
import { rateLimiters } from '@/lib/rateLimit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = rateLimiters.api(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const changelogId = params.id

    // Validate ID format
    const validated = validateInput(queryParamsSchema, { id: changelogId })
    if (!validated.id) {
      return NextResponse.json({ error: 'Invalid changelog ID' }, { status: 400 })
    }

    // Fetch changelog
    const { data: changelog, error } = await supabase
      .from('changelogs')
      .select('*')
      .eq('id', validated.id)
      .single()

    if (error || !changelog) {
      return NextResponse.json({ error: 'Changelog not found' }, { status: 404 })
    }

    // Check authentication for private changelogs
    if (!changelog.is_public) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || user.id !== changelog.user_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const format = request.nextUrl.searchParams.get('format') || 'json'

    // Return requested format
    if (format === 'markdown') {
      return new NextResponse(changelog.markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="changelog-${changelogId}.md"`,
        },
      })
    } else if (format === 'html') {
      return new NextResponse(changelog.html, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    } else if (format === 'json-data') {
      return new NextResponse(JSON.stringify(changelog.json_data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="changelog-${changelogId}.json"`,
        },
      })
    }

    return NextResponse.json({ changelog })
  } catch (error) {
    console.error('Error fetching changelog:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
