import { GitCommit, CommitGroup, ChangelogJsonData } from './types'
import { marked } from 'marked'
import { logger } from './logger'

/**
 * Group commits by conventional commit types
 */
export function groupCommitsByType(commits: GitCommit[]): CommitGroup[] {
  const startTime = Date.now()
  logger.debug('Grouping commits by type', { commitCount: commits.length })
  
  const groups: Record<string, GitCommit[]> = {
    features: [],
    fixes: [],
    breaking: [],
    performance: [],
    docs: [],
    style: [],
    refactor: [],
    test: [],
    build: [],
    ci: [],
    chore: [],
    other: [],
  }

  const categoryMap: Record<string, keyof typeof groups> = {
    feat: 'features',
    fix: 'fixes',
    breaking: 'breaking',
    perf: 'performance',
    docs: 'docs',
    style: 'style',
    refactor: 'refactor',
    test: 'test',
    build: 'build',
    ci: 'ci',
    chore: 'chore',
  }

  commits.forEach((commit) => {
    const message = commit.message.toLowerCase()
    let categorized = false

    // Check for breaking changes first
    if (message.includes('breaking change') || message.includes('!:')) {
      groups.breaking.push(commit)
      categorized = true
    }

    // Match conventional commit pattern: type(scope): message
    const match = message.match(/^(\w+)(\(.+?\))?!?:\s*(.+)/)
    if (match && !categorized) {
      const type = match[1]
      const category = categoryMap[type]
      if (category) {
        groups[category].push(commit)
        categorized = true
      }
    }

    // If not categorized, put in "other"
    if (!categorized) {
      groups.other.push(commit)
    }
  })

  // Convert to array format, filtering out empty groups
  const result: CommitGroup[] = []
  const categoryLabels: Record<keyof typeof groups, string> = {
    breaking: '🚨 Breaking Changes',
    features: '✨ Features',
    fixes: '🐛 Bug Fixes',
    performance: '⚡ Performance',
    docs: '📝 Documentation',
    style: '💄 Styling',
    refactor: '♻️ Refactoring',
    test: '✅ Tests',
    build: '📦 Build',
    ci: '👷 CI/CD',
    chore: '🔧 Chores',
    other: '📌 Other Changes',
  }

  Object.entries(groups).forEach(([key, commits]) => {
    if (commits.length > 0) {
      result.push({
        category: categoryLabels[key as keyof typeof groups],
        commits,
      })
    }
  })

  const duration = Date.now() - startTime
  logger.debug('Commits grouped successfully', { 
    groupCount: result.length, 
    totalCommits: commits.length,
    duration 
  })

  return result
}

/**
 * Format commits into Markdown changelog
 */
export function formatAsMarkdown(
  groups: CommitGroup[],
  repoName: string,
  startRef?: string,
  endRef?: string
): string {
  const startTime = Date.now()
  logger.debug('Formatting changelog as markdown', { groupCount: groups.length, repoName })
  
  const date = new Date().toISOString().split('T')[0]
  let markdown = `# Changelog\n\n`
  markdown += `**Repository:** ${repoName}\n`

  if (startRef && endRef) {
    markdown += `**Range:** ${startRef} → ${endRef}\n`
  }

  markdown += `**Generated:** ${date}\n\n`
  markdown += `---\n\n`

  groups.forEach((group) => {
    markdown += `## ${group.category}\n\n`

    group.commits.forEach((commit) => {
      const shortSha = commit.sha.substring(0, 7)
      const message = commit.message.split('\n')[0] // First line only
      const cleanMessage = message.replace(/^(\w+)(\(.+?\))?!?:\s*/, '') // Remove prefix

      markdown += `- **${cleanMessage}** ([${shortSha}](${commit.url}))\n`

      // Add author info
      markdown += `  - _by ${commit.author.name}_\n`

      // Add file changes if available
      if (commit.files && commit.files.length > 0) {
        markdown += `  - **Files changed:** ${commit.files.length}\n`
        commit.files.forEach((file) => {
          const statusBadge = file.status === 'added' ? '🟢' 
            : file.status === 'modified' ? '🔵' 
            : file.status === 'removed' ? '🔴'
            : file.status === 'renamed' ? '🟡'
            : '⚪'
          
          const changeStats = file.additions || file.deletions 
            ? ` (+${file.additions || 0}/-${file.deletions || 0})`
            : ''
          
          markdown += `    - ${statusBadge} \`${file.filename}\`${changeStats}\n`
          
          if (file.previous_filename && file.status === 'renamed') {
            markdown += `      - _Renamed from \`${file.previous_filename}\`_\n`
          }
        })
      }
    })

    markdown += `\n`
  })

  const duration = Date.now() - startTime
  logger.debug('Markdown formatting completed', { duration, markdownLength: markdown.length })

  return markdown
}

/**
 * Convert Markdown to HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const startTime = Date.now()
  logger.debug('Converting markdown to HTML', { markdownLength: markdown.length })
  
  const html = await marked(markdown)
  
  const duration = Date.now() - startTime
  logger.debug('HTML conversion completed', { duration, htmlLength: html.length })
  
  // Wrap in a styled container
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Changelog</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 30px 0; }
  </style>
</head>
<body>
  ${html}
</body>
</html>
  `.trim()
}

/**
 * Format commits as JSON
 */
export function formatAsJson(
  groups: CommitGroup[],
  repoName: string,
  startRef?: string,
  endRef?: string
): ChangelogJsonData {
  const allCommits = groups.flatMap((g) => g.commits)

  const stats = {
    total_commits: allCommits.length,
    total_additions: allCommits.reduce((sum, c) => sum + (c.stats?.additions || 0), 0),
    total_deletions: allCommits.reduce((sum, c) => sum + (c.stats?.deletions || 0), 0),
    contributors: new Set(allCommits.map((c) => c.author.email)).size,
  }

  const dates = allCommits.map((c) => new Date(c.author.date))
  const startDate = new Date(Math.min(...dates.map((d) => d.getTime())))
  const endDate = new Date(Math.max(...dates.map((d) => d.getTime())))

  return {
    commits: groups,
    stats,
    metadata: {
      repo: repoName,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      generated_at: new Date().toISOString(),
    },
  }
}

/**
 * Clean and normalize commit message
 */
export function cleanCommitMessage(message: string): string {
  // Take only the first line
  const firstLine = message.split('\n')[0]

  // Remove conventional commit prefix
  const cleaned = firstLine.replace(/^(\w+)(\(.+?\))?!?:\s*/, '')

  return cleaned.trim()
}

/**
 * Extract commit metadata
 */
export function extractCommitMetadata(message: string): {
  type?: string
  scope?: string
  isBreaking: boolean
  message: string
} {
  const match = message.match(/^(\w+)(\((.+?)\))?(!)?: (.+)/)

  if (match) {
    return {
      type: match[1],
      scope: match[3],
      isBreaking: !!match[4],
      message: match[5],
    }
  }

  return {
    isBreaking: message.toLowerCase().includes('breaking change'),
    message: message.split('\n')[0],
  }
}

/**
 * Generate slug for public changelog URL
 */
export function generateSlug(repoName: string, version?: string): string {
  const base = repoName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  if (version) {
    const versionSlug = version
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-|-$/g, '')
    return `${base}-${versionSlug}`
  }

  // Add timestamp for uniqueness
  const timestamp = Date.now().toString(36)
  return `${base}-${timestamp}`
}
