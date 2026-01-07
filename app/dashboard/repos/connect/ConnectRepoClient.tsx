'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Github, Search, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'

interface GitRepo {
  id: string | number
  name: string
  full_name: string
  owner: {
    login: string
  }
  default_branch: string
  private: boolean
  html_url: string
}

export default function ConnectRepoClient() {
  const router = useRouter()
  const [provider, setProvider] = useState<'github' | 'gitlab'>('github')
  const [isLoading, setIsLoading] = useState(false)
  const [repos, setRepos] = useState<GitRepo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [hasToken, setHasToken] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualForm, setManualForm] = useState({
    repoOwner: '',
    repoName: '',
    defaultBranch: 'main',
    isPrivate: false,
    repoUrl: '',
  })

  // Load saved token status on mount and when provider changes
  useEffect(() => {
    checkTokenStatus()
  }, [provider])

  const checkTokenStatus = async () => {
    try {
      const response = await fetch(`/api/provider-tokens?provider=${provider}`)
      const data = await response.json()

      if (response.ok && data.hasToken) {
        setHasToken(true)
        setShowTokenInput(false)
        // Auto-fetch repos if token exists
        await discoverRepos()
      } else {
        setHasToken(false)
        setShowTokenInput(true)
      }
    } catch (error) {
      console.error('Error checking token status:', error)
      setShowTokenInput(true)
    }
  }

  const saveToken = async (token: string) => {
    try {
      const response = await fetch('/api/provider-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, token }),
      })

      if (response.ok) {
        setHasToken(true)
        setShowTokenInput(false)
        setAccessToken('') // Clear from memory
        // Now discover repos using the saved token
        await discoverRepos()
      } else {
        alert('Failed to save token')
      }
    } catch (error) {
      console.error('Error saving token:', error)
      alert('Failed to save token')
    }
  }

  const discoverRepos = async () => {
    setIsLoading(true)
    try {
      // Use server-side endpoint that uses stored encrypted token
      const response = await fetch(`/api/repos/discover?provider=${provider}`)
      
      if (!response.ok) {
        const data = await response.json()
        if (data.needsToken) {
          setHasToken(false)
          setShowTokenInput(true)
          alert('Please enter your access token to discover repositories')
          return
        }
        throw new Error(`Failed to discover repositories: ${response.status}`)
      }

      const data = await response.json()
      setRepos(data.repos || [])
    } catch (error) {
      console.error('Error discovering repos:', error)
      alert('Failed to discover repositories. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteToken = async () => {
    if (!confirm('Are you sure you want to remove the saved token? You will need to enter it again.')) {
      return
    }

    try {
      const response = await fetch(`/api/provider-tokens?provider=${provider}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setHasToken(false)
        setShowTokenInput(true)
        setRepos([])
      }
    } catch (error) {
      console.error('Error deleting token:', error)
      alert('Failed to delete token')
    }
  }

  const handleTokenSubmit = async () => {
    if (!accessToken) {
      alert('Please enter an access token')
      return
    }

    // Save token securely on server
    await saveToken(accessToken)
  }

  const refreshRepos = async () => {
    if (!hasToken) {
      alert('No token available. Please enter an access token.')
      return
    }

    await discoverRepos()
  }

  const connectRepo = async (repo: GitRepo) => {
    setIsLoading(true)
    try {
      // Server will use stored encrypted token - no need to send it from client
      const response = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          repoName: repo.name,
          repoOwner: repo.owner.login,
          isPrivate: repo.private,
          defaultBranch: repo.default_branch,
          repoUrl: repo.html_url,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        alert(data.error || 'Failed to connect repository')
      }
    } catch (error) {
      console.error('Error connecting repo:', error)
      alert('An error occurred while connecting the repository')
    } finally {
      setIsLoading(false)
    }
  }

  const connectManualRepo = async () => {
    if (!manualForm.repoOwner || !manualForm.repoName) {
      alert('Please fill in repository owner and name')
      return
    }

    if (!hasToken) {
      alert('Please save your access token first')
      return
    }

    setIsLoading(true)
    try {
      // Server will use stored encrypted token - no need to send it from client
      const response = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          repoName: manualForm.repoName,
          repoOwner: manualForm.repoOwner,
          isPrivate: manualForm.isPrivate,
          defaultBranch: manualForm.defaultBranch || 'main',
          repoUrl: manualForm.repoUrl,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        alert(data.error || 'Failed to connect repository')
      }
    } catch (error) {
      console.error('Error connecting repo:', error)
      alert('An error occurred while connecting the repository')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Connect Repository</h2>
          <p className="text-gray-600">Add a repository to start generating changelogs</p>
        </div>

        <div className="card space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Git Provider</label>
            <div className="flex gap-4">
              <button
                onClick={() => setProvider('github')}
                className={`flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-lg border-2 transition-all ${
                  provider === 'github'
                    ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700 bg-white'
                }`}
              >
                <Github className="w-6 h-6" />
                <span className="font-semibold text-base">GitHub</span>
              </button>
              <button
                onClick={() => setProvider('gitlab')}
                className={`flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-lg border-2 transition-all ${
                  provider === 'gitlab'
                    ? 'border-orange-600 bg-orange-600 text-white shadow-md'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700 bg-white'
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.428 1.9l2.658 2.66c.645-.23 1.387-.096 1.903.428.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.6-.401-.545-.545-.676-1.342-.396-2.009L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187" />
                </svg>
                <span className="font-semibold text-base">GitLab</span>
              </button>
            </div>
          </div>

          {/* Access Token */}
          {!hasToken || showTokenInput ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token *
                <span className="text-xs text-gray-500 ml-2">
                  {provider === 'github' ? (
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Create GitHub token
                    </a>
                  ) : (
                    <a
                      href="https://gitlab.com/-/profile/personal_access_tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Create GitLab token
                    </a>
                  )}
                </span>
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={provider === 'github' ? 'ghp_xxxxxxxxxxxx' : 'glpat-xxxxxxxxxxxx'}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                {provider === 'github'
                  ? 'Requires "repo" scope for accessing repositories'
                  : 'Requires "read_api", "read_repository" scopes'}
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">
                    Token saved for {provider === 'github' ? 'GitHub' : 'GitLab'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTokenInput(true)}
                    className="text-xs text-green-700 hover:text-green-900 underline"
                  >
                    Update token
                  </button>
                  <button
                    onClick={deleteToken}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Remove saved token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fetch/Refresh Repos Button */}
          <div className="flex gap-3">
            {!hasToken || showTokenInput ? (
              <button
                onClick={handleTokenSubmit}
                disabled={isLoading || !accessToken}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading repositories...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Save Token & Discover Repositories
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={refreshRepos}
                disabled={isLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Refresh Repositories
                  </>
                )}
              </button>
            )}
          </div>

          {/* Repository List */}
          {repos.length > 0 && (
            <>
              <hr className="border-gray-200" />

              <div>
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredRepos.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No repositories found</p>
                ) : (
                  filteredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors gap-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{repo.name}</h4>
                        <p className="text-sm text-gray-600">{repo.full_name}</p>
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {repo.default_branch || 'main'}
                          </span>
                          {repo.private && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Private
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => connectRepo(repo)}
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        Connect
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Manual Entry Option */}
          <hr className="border-gray-200" />

          <div>
            <button
              onClick={() => setShowManual(!showManual)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {showManual ? '− Hide' : '+ Show'} manual entry
            </button>

            {showManual && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repository Owner *
                    </label>
                    <input
                      type="text"
                      value={manualForm.repoOwner}
                      onChange={(e) => setManualForm({ ...manualForm, repoOwner: e.target.value })}
                      placeholder="username or org"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repository Name *
                    </label>
                    <input
                      type="text"
                      value={manualForm.repoName}
                      onChange={(e) => setManualForm({ ...manualForm, repoName: e.target.value })}
                      placeholder="my-repo"
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Branch
                  </label>
                  <input
                    type="text"
                    value={manualForm.defaultBranch}
                    onChange={(e) => setManualForm({ ...manualForm, defaultBranch: e.target.value })}
                    placeholder="main"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository URL (optional)
                  </label>
                  <input
                    type="text"
                    value={manualForm.repoUrl}
                    onChange={(e) => setManualForm({ ...manualForm, repoUrl: e.target.value })}
                    placeholder="https://github.com/owner/repo"
                    className="input"
                  />
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={manualForm.isPrivate}
                    onChange={(e) => setManualForm({ ...manualForm, isPrivate: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Private repository</span>
                </label>

                <button
                  onClick={connectManualRepo}
                  disabled={isLoading}
                  className="btn-primary w-full"
                >
                  Connect Manually
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
