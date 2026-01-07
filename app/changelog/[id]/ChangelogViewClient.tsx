'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Share2, Eye, EyeOff, Copy, Check } from 'lucide-react'

export default function ChangelogViewClient({
  changelog,
  isOwner,
}: {
  changelog: any
  isOwner: boolean
}) {
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'json'>('preview')
  const [copied, setCopied] = useState(false)

  const downloadChangelog = async (format: 'markdown' | 'html' | 'json-data') => {
    try {
      const response = await fetch(`/api/changelog/${changelog.id}?format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const extension = format === 'json-data' ? 'json' : format === 'markdown' ? 'md' : 'html'
      a.download = `changelog-${changelog.id}.${extension}`

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading:', error)
      alert('Failed to download')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareChangelog = () => {
    const shareUrl = `${window.location.origin}/changelog/${changelog.id}`
    copyToClipboard(shareUrl)
  }

  // Extract only the body content from HTML (strip html/head/body tags)
  const getPreviewContent = (html: string) => {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    return bodyMatch ? bodyMatch[1] : html
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-2">
              {isOwner && (
                <span className={`text-sm px-3 py-1 rounded-full ${
                  changelog.is_public 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {changelog.is_public ? (
                    <>
                      <Eye className="w-3 h-3 inline mr-1" />
                      Public
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 inline mr-1" />
                      Private
                    </>
                  )}
                </span>
              )}

              <button
                onClick={() => downloadChangelog('markdown')}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              {changelog.is_public && (
                <button
                  onClick={shareChangelog}
                  className="btn-primary flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Changelog Info */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            {changelog.title || 'Untitled Changelog'}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>{changelog.repos?.repo_full_name}</span>
            {changelog.tag_start && changelog.tag_end && (
              <span>{changelog.tag_start} → {changelog.tag_end}</span>
            )}
            <span>{changelog.commit_count} commits</span>
            <span>{new Date(changelog.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b mb-6 rounded-t-lg">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3 px-4 border-b-2 font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`py-3 px-4 border-b-2 font-medium transition-colors ${
                activeTab === 'markdown'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Markdown
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`py-3 px-4 border-b-2 font-medium transition-colors ${
                activeTab === 'json'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              JSON
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'preview' && (
          <div className="card min-h-[400px]">
            <div 
              className="text-gray-900"
              dangerouslySetInnerHTML={{ __html: getPreviewContent(changelog.html) }}
            />
          </div>
        )}

        {activeTab === 'markdown' && (
          <div className="card min-h-[400px]">
            <div className="relative">
              <button
                onClick={() => copyToClipboard(changelog.markdown)}
                className="absolute top-2 right-2 p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded z-10"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="bg-gray-50 p-6 rounded-lg overflow-x-auto text-sm text-gray-900">
                <code className="text-gray-900">{changelog.markdown}</code>
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="card min-h-[400px]">
            <div className="relative">
              <button
                onClick={() => copyToClipboard(JSON.stringify(changelog.json_data, null, 2))}
                className="absolute top-2 right-2 p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded z-10"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="bg-gray-50 p-6 rounded-lg overflow-x-auto text-sm text-gray-900">
                <code className="text-gray-900">{JSON.stringify(changelog.json_data, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Download Options */}
        <div className="mt-6 card">
          <h3 className="font-semibold mb-4">Export Options</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => downloadChangelog('markdown')}
              className="btn-secondary"
            >
              Download Markdown
            </button>
            <button
              onClick={() => downloadChangelog('html')}
              className="btn-secondary"
            >
              Download HTML
            </button>
            <button
              onClick={() => downloadChangelog('json-data')}
              className="btn-secondary"
            >
              Download JSON
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
