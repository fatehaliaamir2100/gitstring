import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConnectRepoClient from './ConnectRepoClient'

export default async function ConnectRepoPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  return <ConnectRepoClient />
}
