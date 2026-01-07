'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GitBranch, Plus, LogOut, FileText, Download, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

interface DashboardClientProps {
  user: any
  initialRepos: any[]
  initialChangelogs: any[]
}

export default function DashboardClient({
  user,
  initialRepos,
  initialChangelogs,
}: DashboardClientProps) {
  const [repos, setRepos] = useState(initialRepos)
  const [changelogs, setChangelogs] = useState(initialChangelogs)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteChangelog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this changelog?')) return

    try {
      const response = await fetch(`/api/changelog?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setChangelogs(changelogs.filter((c) => c.id !== id))
      }
    } catch (error) {
      console.error('Error deleting changelog:', error)
      alert('Failed to delete changelog')
    }
  }

  const downloadChangelog = async (id: string, format: 'markdown' | 'html' | 'json-data') => {
    try {
      const response = await fetch(`/api/changelog/${id}?format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const extension = format === 'json-data' ? 'json' : format === 'markdown' ? 'md' : 'html'
      a.download = `changelog-${id}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading changelog:', error)
      alert('Failed to download changelog')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GitBranch className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              GitString
            </h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Manage your repositories and changelogs</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            href="/dashboard/generate"
            className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-primary-300 bg-primary-50 block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary-900">Generate Changelog</h3>
                <p className="text-primary-700">Create a new changelog from your commits</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Connected Repositories */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Repositories</h3>
            <Link href="/dashboard/repos/connect" className="btn-primary text-sm">
              <Plus className="w-4 h-4 inline mr-1" />
              Connect
            </Link>
          </div>

          {repos.length === 0 ? (
            <div className="card text-center py-8">
              <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm mb-3">No repositories connected yet</p>
              <Link href="/dashboard/repos/connect" className="btn-primary text-sm">
                Connect Repository
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {repos.map((repo) => {
                const repoChangelogCount = changelogs.filter(c => c.repo_id === repo.id).length
                return (
                  <div key={repo.id} className="card hover:shadow-lg transition-shadow p-4">
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{repo.repo_name}</h4>
                        <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ml-1 ${
                          repo.provider === 'github' 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-orange-600 text-white'
                        }`}>
                          {repo.provider === 'github' ? 'GH' : 'GL'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1 mb-2">{repo.repo_owner}</p>
                      <div className="flex items-center gap-1 text-xs text-purple-600">
                        <FileText className="w-3 h-3" />
                        <span className="font-medium">{repoChangelogCount} changelog{repoChangelogCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/generate?repo=${repo.id}`}
                      className="btn-primary text-xs w-full block text-center py-2"
                    >
                      Generate
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recent Changelogs */}
        <section>
          <h3 className="text-xl font-bold mb-4 text-gray-900">Recent Changelogs</h3>

          {changelogs.length === 0 ? (
            <div className="card text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm mb-3">No changelogs generated yet</p>
              <Link href="/dashboard/generate" className="btn-primary text-sm">
                Generate Changelog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {changelogs.map((changelog: any) => (
                <div key={changelog.id} className="card p-4 hover:shadow-lg transition-shadow">
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm mb-1 text-gray-900 line-clamp-2">
                      {changelog.title || 'Untitled Changelog'}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                      {changelog.repos?.repo_full_name || 'Unknown Repository'}
                    </p>
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <span>{changelog.commit_count} commits</span>
                      <span className="line-clamp-1">{new Date(changelog.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-1 pt-3 border-t border-gray-200">
                    <Link
                      href={`/changelog/${changelog.id}`}
                      className="flex-1 p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded text-center"
                      title="View"
                    >
                      <Eye className="w-4 h-4 mx-auto" />
                    </Link>
                    
                    <button
                      onClick={() => downloadChangelog(changelog.id, 'markdown')}
                      className="flex-1 p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Download"
                    >
                      <Download className="w-4 h-4 mx-auto" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteChangelog(changelog.id)}
                      className="flex-1 p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
