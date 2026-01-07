'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { GitBranch, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

interface Repo {
  id: string
  repo_name: string
  repo_owner: string
  repo_full_name: string
  provider: string
  default_branch: string
}

export default function GenerateChangelogClient({ repos }: { repos: Repo[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedRepo = searchParams.get('repo')

  const [selectedRepo, setSelectedRepo] = useState(preselectedRepo || '')
  const [refType, setRefType] = useState<'branches' | 'tags'>('branches')
  const [startRef, setStartRef] = useState('')
  const [endRef, setEndRef] = useState('')
  const [title, setTitle] = useState('')
  const [useAi, setUseAi] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [refs, setRefs] = useState<any[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)

  // Fetch refs when repo or refType changes
  useEffect(() => {
    if (selectedRepo) {
      fetchRefs()
    }
  }, [selectedRepo, refType])

  const fetchRefs = async () => {
    setLoadingRefs(true)
    try {
      const response = await fetch(`/api/repos/refs?repoId=${selectedRepo}&type=${refType}`)
      const data = await response.json()
      setRefs(data.refs || [])
    } catch (error) {
      console.error('Error fetching refs:', error)
    } finally {
      setLoadingRefs(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/changelog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: selectedRepo,
          startRef: startRef || undefined,
          endRef: endRef || undefined,
          title,
          useAi,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/changelog/${data.changelog.id}`)
      } else {
        alert(data.error || 'Failed to generate changelog')
      }
    } catch (error) {
      console.error('Error generating changelog:', error)
      alert('An error occurred while generating the changelog')
    } finally {
      setIsLoading(false)
    }
  }

  if (repos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Repositories Connected</h2>
          <p className="text-gray-600 mb-6">
            You need to connect a repository before generating a changelog.
          </p>
          <Link href="/dashboard/repos/connect" className="btn-primary">
            Connect Repository
          </Link>
        </main>
      </div>
    )
  }

  const selectedRepoData = repos.find((r) => r.id === selectedRepo)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Generate Changelog</h2>
          <p className="text-gray-600">Select a repository and commit range</p>
        </div>

        <form onSubmit={handleGenerate} className="card space-y-6">
          {/* Repository Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repository *
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="input"
              required
            >
              <option value="">Select a repository</option>
              {repos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.repo_full_name} ({repo.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Changelog Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedRepoData ? `Changelog for ${selectedRepoData.repo_full_name}` : 'Enter title'}
              className="input"
            />
          </div>

          {/* Ref Type Selection */}
          {selectedRepo && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="branches"
                      checked={refType === 'branches'}
                      onChange={(e) => setRefType(e.target.value as 'branches')}
                      className="mr-2"
                    />
                    Branches
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="tags"
                      checked={refType === 'tags'}
                      onChange={(e) => setRefType(e.target.value as 'tags')}
                      className="mr-2"
                    />
                    Tags
                  </label>
                </div>
              </div>

              {/* Start Ref */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From (optional)
                </label>
                <select
                  value={startRef}
                  onChange={(e) => setStartRef(e.target.value)}
                  className="input"
                  disabled={loadingRefs}
                >
                  <option value="">Select start {refType === 'tags' ? 'tag' : 'branch'}</option>
                  {refs.map((ref) => (
                    <option key={ref.name} value={ref.name}>
                      {ref.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Ref */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To (optional)
                </label>
                <select
                  value={endRef}
                  onChange={(e) => setEndRef(e.target.value)}
                  className="input"
                  disabled={loadingRefs}
                >
                  <option value="">Select end {refType === 'tags' ? 'tag' : 'branch'} (defaults to HEAD)</option>
                  {refs.map((ref) => (
                    <option key={ref.name} value={ref.name}>
                      {ref.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* AI Enhancement */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Use AI Enhancement</span>
                </div>
                <p className="text-sm text-gray-600">
                  Generate human-friendly summaries using OpenAI (requires API key)
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading || !selectedRepo}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Changelog'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
