import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ChangelogViewClient from './ChangelogViewClient'

export default async function ChangelogPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = params

  // Fetch changelog
  const { data: changelog, error } = await supabase
    .from('changelogs')
    .select(`
      *,
      repos (
        repo_name,
        repo_owner,
        repo_full_name,
        provider,
        repo_url
      )
    `)
    .eq('id', id)
    .single()

  if (error || !changelog) {
    notFound()
  }

  // Check if user has access (must be owner or changelog must be public)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!changelog.is_public && (!user || user.id !== changelog.user_id)) {
    redirect('/login')
  }

  const isOwner = user?.id === changelog.user_id

  return <ChangelogViewClient changelog={changelog} isOwner={isOwner} />
}
