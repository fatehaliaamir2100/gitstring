import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GenerateChangelogClient from './GenerateChangelogClient'

export default async function GenerateChangelogPage() {
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

  return <GenerateChangelogClient repos={repos || []} />
}
