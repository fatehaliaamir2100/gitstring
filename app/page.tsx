import Link from 'next/link'
import { GitBranch, Sparkles, Download, Share2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              GitString
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
              Log In
            </Link>
            <Link href="/login" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Generate Beautiful Changelogs
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your Git commits into professional, AI-powered changelogs. 
            Connect your GitHub or GitLab repository and let us do the magic.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login" className="btn-primary text-lg px-8 py-3">
              Start Free
            </Link>
            <a href="#features" className="btn-secondary text-lg px-8 py-3">
              Learn More
            </a>
          </div>
        </div>

        {/* Demo Preview */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="rounded-xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
            <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-gray-400 text-sm ml-4">changelog.md</span>
            </div>
            <div className="p-8 text-left">
              <pre className="text-sm text-gray-800">
{`# Changelog

**Repository:** owner/repo
**Range:** v1.0.0 → v2.0.0
**Generated:** 2026-01-07

---

## ✨ Features

- **Added dark mode support** (a1b2c3d)
  - _by John Doe_

## 🐛 Bug Fixes

- **Fixed login redirect issue** (d4e5f6g)
  - _by Jane Smith_`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why GitString?</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Multi-Platform</h4>
              <p className="text-gray-600">
                Connect GitHub and GitLab repositories, including self-hosted instances.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">AI-Powered</h4>
              <p className="text-gray-600">
                Use OpenAI to generate human-friendly summaries from your commits.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Multiple Formats</h4>
              <p className="text-gray-600">
                Export as Markdown, HTML, or JSON. Share publicly or keep private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to streamline your changelog workflow?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Get started in minutes. No credit card required.
          </p>
          <Link href="/login" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-block">
            Create Your First Changelog
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 GitString. Built with Next.js, Supabase, and OpenAI.</p>
        </div>
      </footer>
    </div>
  )
}
