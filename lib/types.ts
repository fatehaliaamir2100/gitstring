export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Repo {
  id: string
  user_id: string
  provider: 'github' | 'gitlab'
  repo_name: string
  repo_owner: string
  repo_full_name: string
  repo_url?: string
  default_branch: string
  access_token?: string
  is_private: boolean
  last_synced_at?: string
  created_at: string
  updated_at: string
}

export interface Changelog {
  id: string
  user_id: string
  repo_id: string
  title?: string
  tag_start?: string
  tag_end?: string
  commit_start?: string
  commit_end?: string
  commit_count: number
  markdown?: string
  html?: string
  json_data?: ChangelogJsonData
  is_public: boolean
  slug?: string
  view_count: number
  created_at: string
  updated_at: string
}

export interface ChangelogJsonData {
  commits: CommitGroup[]
  stats: {
    total_commits: number
    total_additions: number
    total_deletions: number
    contributors: number
  }
  metadata: {
    repo: string
    start_date: string
    end_date: string
    generated_at: string
  }
}

export interface CommitGroup {
  category: string
  commits: GitCommit[]
}

export interface GitCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
  url: string
  stats?: {
    additions: number
    deletions: number
  }
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  html_url: string
  stats?: {
    additions: number
    deletions: number
  }
  author?: {
    login: string
    avatar_url: string
  }
}

export interface GitLabCommit {
  id: string
  short_id: string
  title: string
  message: string
  author_name: string
  author_email: string
  authored_date: string
  web_url: string
  stats?: {
    additions: number
    deletions: number
  }
}

export interface RepoConnection {
  provider: 'github' | 'gitlab'
  repoName: string
  repoOwner: string
  accessToken: string
}
