import { GitHubCommit, GitLabCommit, GitCommit, FileChange } from './types'

/**
 * Fetch detailed commit data from GitHub (includes files and diffs)
 */
async function fetchGitHubCommitDetails(
  token: string,
  owner: string,
  repo: string,
  sha: string
): Promise<{ files: FileChange[]; stats: { additions: number; deletions: number; total: number }; diff?: string }> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  }

  const response = await fetch(url, { headers })
  if (!response.ok) return { files: [], stats: { additions: 0, deletions: 0, total: 0 } }

  const data = await response.json()

  const files: FileChange[] = (data.files || []).map((file: any) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions || 0,
    deletions: file.deletions || 0,
    changes: file.changes || 0,
    patch: file.patch,
    previous_filename: file.previous_filename,
  }))

  return {
    files,
    stats: {
      additions: data.stats?.additions || 0,
      deletions: data.stats?.deletions || 0,
      total: data.stats?.total || 0,
    },
  }
}

/**
 * Fetch commits from GitHub repository with enhanced file details
 */
export async function fetchGitHubCommits(
  token: string,
  owner: string,
  repo: string,
  base?: string,
  head?: string,
  includeDetails: boolean = true
): Promise<GitCommit[]> {
  const baseUrl = 'https://api.github.com'
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  }

  try {
    let url = `${baseUrl}/repos/${owner}/${repo}/commits`
    const params = new URLSearchParams()

    if (base) params.append('sha', head || 'HEAD')
    if (base && head) {
      // Compare commits between two refs
      url = `${baseUrl}/repos/${owner}/${repo}/compare/${base}...${head}`
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Handle comparison response vs commits list
    const commits: GitHubCommit[] = data.commits || data

    // Fetch detailed file information for each commit if requested
    const enrichedCommits = await Promise.all(
      commits.map(async (commit: GitHubCommit) => {
        let details: { files: FileChange[]; stats: { additions: number; deletions: number; total: number }; diff?: string } = { 
          files: [], 
          stats: { additions: 0, deletions: 0, total: 0 } 
        }
        
        if (includeDetails) {
          try {
            details = await fetchGitHubCommitDetails(token, owner, repo, commit.sha)
          } catch (err) {
            console.warn(`Failed to fetch details for commit ${commit.sha}`)
          }
        }

        return {
          sha: commit.sha,
          message: commit.commit.message,
          author: {
            name: commit.commit.author.name,
            email: commit.commit.author.email,
            date: commit.commit.author.date,
          },
          url: commit.html_url,
          stats: details.stats,
          files: details.files,
        }
      })
    )

    return enrichedCommits
  } catch (error) {
    console.error('Error fetching GitHub commits:', error)
    throw error
  }
}

/**
 * Fetch tags from GitHub repository
 */
export async function fetchGitHubTags(
  token: string,
  owner: string,
  repo: string
): Promise<{ name: string; commit: { sha: string } }[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/tags`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch branches from GitHub repository
 */
export async function fetchGitHubBranches(
  token: string,
  owner: string,
  repo: string
): Promise<{ name: string; commit: { sha: string } }[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/branches`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch user's GitHub repositories
 */
export async function fetchGitHubRepos(token: string) {
  const url = 'https://api.github.com/user/repos?per_page=100&sort=updated'
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch detailed commit data from GitLab (includes files and diffs)
 */
async function fetchGitLabCommitDetails(
  token: string,
  projectId: string,
  sha: string
): Promise<{ files: FileChange[]; stats: { additions: number; deletions: number; total: number } }> {
  const baseUrl = process.env.GITLAB_URL || 'https://gitlab.com'
  const url = `${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/repository/commits/${sha}/diff`
  const headers = {
    'PRIVATE-TOKEN': token,
  }

  try {
    const response = await fetch(url, { headers })
    if (!response.ok) return { files: [], stats: { additions: 0, deletions: 0, total: 0 } }

    const diffs = await response.json()

    let totalAdditions = 0
    let totalDeletions = 0

    const files: FileChange[] = (diffs || []).map((diff: any) => {
      // Count additions and deletions from the diff text
      const additions = (diff.diff?.match(/^\+(?!\+)/gm) || []).length
      const deletions = (diff.diff?.match(/^-(?!-)/gm) || []).length
      
      totalAdditions += additions
      totalDeletions += deletions

      return {
        filename: diff.new_path,
        status: diff.new_file ? 'added' : diff.deleted_file ? 'removed' : diff.renamed_file ? 'renamed' : 'modified',
        additions,
        deletions,
        changes: additions + deletions,
        patch: diff.diff,
        previous_filename: diff.old_path !== diff.new_path ? diff.old_path : undefined,
      }
    })

    return {
      files,
      stats: {
        additions: totalAdditions,
        deletions: totalDeletions,
        total: totalAdditions + totalDeletions,
      },
    }
  } catch (err) {
    return { files: [], stats: { additions: 0, deletions: 0, total: 0 } }
  }
}

/**
 * Fetch commits from GitLab repository with enhanced file details
 */
export async function fetchGitLabCommits(
  token: string,
  projectId: string,
  refName?: string,
  since?: string,
  until?: string,
  includeDetails: boolean = true
): Promise<GitCommit[]> {
  const baseUrl = process.env.GITLAB_URL || 'https://gitlab.com'
  const headers = {
    'PRIVATE-TOKEN': token,
  }

  try {
    const params = new URLSearchParams()
    if (refName) params.append('ref_name', refName)
    if (since) params.append('since', since)
    if (until) params.append('until', until)
    params.append('per_page', '100')

    const url = `${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/repository/commits?${params}`
    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status} ${response.statusText}`)
    }

    const commits: GitLabCommit[] = await response.json()

    // Fetch detailed file information for each commit if requested
    const enrichedCommits = await Promise.all(
      commits.map(async (commit: GitLabCommit) => {
        let details: { files: FileChange[]; stats: { additions: number; deletions: number; total: number } } = { 
          files: [], 
          stats: { additions: 0, deletions: 0, total: 0 } 
        }
        
        if (includeDetails) {
          try {
            details = await fetchGitLabCommitDetails(token, projectId, commit.id)
          } catch (err) {
            console.warn(`Failed to fetch details for commit ${commit.id}`)
          }
        }

        return {
          sha: commit.id,
          message: commit.message,
          author: {
            name: commit.author_name,
            email: commit.author_email,
            date: commit.authored_date,
          },
          url: commit.web_url,
          stats: details.stats,
          files: details.files,
        }
      })
    )

    return enrichedCommits
  } catch (error) {
    console.error('Error fetching GitLab commits:', error)
    throw error
  }
}

/**
 * Fetch tags from GitLab repository
 */
export async function fetchGitLabTags(token: string, projectId: string) {
  const baseUrl = process.env.GITLAB_URL || 'https://gitlab.com'
  const url = `${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/repository/tags`
  const headers = {
    'PRIVATE-TOKEN': token,
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch branches from GitLab repository
 */
export async function fetchGitLabBranches(token: string, projectId: string) {
  const baseUrl = process.env.GITLAB_URL || 'https://gitlab.com'
  const url = `${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/repository/branches`
  const headers = {
    'PRIVATE-TOKEN': token,
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch user's GitLab projects
 */
export async function fetchGitLabProjects(token: string) {
  const baseUrl = process.env.GITLAB_URL || 'https://gitlab.com'
  const url = `${baseUrl}/api/v4/projects?membership=true&per_page=100&order_by=updated_at`
  const headers = {
    'PRIVATE-TOKEN': token,
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Get commit comparison between two refs
 */
export async function compareCommits(
  provider: 'github' | 'gitlab',
  token: string,
  repoIdentifier: { owner: string; repo: string } | { projectId: string },
  base: string,
  head: string
): Promise<GitCommit[]> {
  if (provider === 'github' && 'owner' in repoIdentifier) {
    return fetchGitHubCommits(token, repoIdentifier.owner, repoIdentifier.repo, base, head)
  } else if (provider === 'gitlab' && 'projectId' in repoIdentifier) {
    // GitLab doesn't have a direct compare, so we fetch commits for the ref
    return fetchGitLabCommits(token, repoIdentifier.projectId, head)
  }

  throw new Error('Invalid provider or repository identifier')
}
