import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch user's repositories
  const { data: repos } = await supabase
    .from('repos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch user's changelogs
  const { data: changelogs } = await supabase
    .from('changelogs')
    .select(`
      *,
      repos (
        repo_name,
        repo_owner,
        repo_full_name,
        provider
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <DashboardClient
      user={user}
      initialRepos={repos || []}
      initialChangelogs={changelogs || []}
    />
  )
}
