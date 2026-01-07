import OpenAI from 'openai'
import { CommitGroup, GitCommit } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate AI-enhanced changelog summary using OpenAI with code diff analysis
 */
export async function generateAiSummaryWithDiffs(
  groups: CommitGroup[],
  repoName: string
): Promise<string> {
  try {
    // Prepare detailed commit data including file changes
    const commitDetails = groups
      .map((group) => {
        const commits = group.commits
          .map((c) => {
            const fileChanges = c.files && c.files.length > 0
              ? `\n  Files changed:\n${c.files.slice(0, 5).map(f => `    - ${f.filename} (+${f.additions}/-${f.deletions})`).join('\n')}`
              : ''
            const stats = c.stats 
              ? `\n  Changes: +${c.stats.additions}/-${c.stats.deletions}`
              : ''
            return `- ${c.message.split('\n')[0]}${fileChanges}${stats}`
          })
          .join('\n')
        return `${group.category}:\n${commits}`
      })
      .join('\n\n')

    const prompt = `You are a technical writer creating a professional changelog for the repository "${repoName}".

Below are the commits with their file changes and statistics:

${commitDetails}

Generate a well-structured, professional changelog in Markdown format that:
1. Groups changes by category with appropriate emojis
2. Analyzes the actual file changes to understand what features/fixes were implemented
3. Summarizes related changes into concise, meaningful bullet points
4. Highlights breaking changes, security fixes, and major features
5. Uses clear, user-friendly language that explains WHAT changed and WHY it matters
6. Includes a brief executive summary at the top
7. When multiple files relate to the same feature, group them together

Focus on the impact and purpose of changes, not just listing commit messages.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional technical writer specializing in creating clear, insightful changelogs that help users understand code changes.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    })

    return response.choices[0].message.content || ''
  } catch (error) {
    console.error('Error generating AI summary with diffs:', error)
    throw new Error('Failed to generate AI summary')
  }
}

/**
 * Generate AI-enhanced changelog summary using OpenAI (legacy method)
 */
export async function generateAiSummary(
  groups: CommitGroup[],
  repoName: string
): Promise<string> {
  try {
    // Prepare commit data for the prompt
    const commitSummary = groups
      .map((group) => {
        const commits = group.commits
          .map((c) => `- ${c.message.split('\n')[0]}`)
          .join('\n')
        return `${group.category}:\n${commits}`
      })
      .join('\n\n')

    const prompt = `You are a technical writer creating a professional changelog for the repository "${repoName}".

Below are the commits grouped by type:

${commitSummary}

Generate a well-structured, professional changelog in Markdown format that:
1. Groups changes by category with appropriate emojis
2. Summarizes related changes into concise bullet points
3. Highlights the most important changes
4. Uses clear, user-friendly language (not just raw commit messages)
5. Includes a brief overview paragraph at the top

Format the output as clean Markdown.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional technical writer specializing in creating clear, concise changelogs for software projects.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    return response.choices[0].message.content || ''
  } catch (error) {
    console.error('Error generating AI summary:', error)
    throw new Error('Failed to generate AI summary')
  }
}

/**
 * Analyze a single commit's code changes using AI
 */
export async function analyzeCommitChanges(commit: GitCommit): Promise<string> {
  try {
    if (!commit.files || commit.files.length === 0) {
      return commit.message.split('\n')[0]
    }

    const filesSummary = commit.files.slice(0, 10).map(f => 
      `${f.filename} (${f.status}): +${f.additions}/-${f.deletions}`
    ).join('\n')

    const prompt = `Analyze this commit and explain what it does in one clear, concise sentence:

Commit message: ${commit.message}

Files changed:
${filesSummary}

Provide a single sentence that explains the purpose and impact of this commit.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a code reviewer analyzing commits. Provide concise, clear explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 150,
    })

    return response.choices[0].message.content || commit.message.split('\n')[0]
  } catch (error) {
    console.error('Error analyzing commit changes:', error)
    return commit.message.split('\n')[0]
  }
}

/**
 * Generate a short AI summary for a single commit
 */
export async function summarizeCommit(commit: GitCommit): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a technical writer. Summarize the following commit message in one clear, concise sentence.',
        },
        {
          role: 'user',
          content: commit.message,
        },
      ],
      temperature: 0.5,
      max_tokens: 100,
    })

    return response.choices[0].message.content || commit.message
  } catch (error) {
    console.error('Error summarizing commit:', error)
    return commit.message.split('\n')[0]
  }
}

/**
 * Generate release notes with AI enhancement
 */
export async function generateReleaseNotes(
  groups: CommitGroup[],
  repoName: string,
  version?: string
): Promise<string> {
  try {
    const commitSummary = groups
      .map((group) => {
        const commits = group.commits
          .map((c) => `- ${c.message.split('\n')[0]}`)
          .join('\n')
        return `${group.category}:\n${commits}`
      })
      .join('\n\n')

    const prompt = `Create release notes for ${repoName}${version ? ` version ${version}` : ''}.

Commits:
${commitSummary}

Generate professional release notes that:
1. Start with a brief "What's New" summary paragraph
2. Group changes by category with clear headers
3. Highlight breaking changes prominently if any
4. Use clear, user-focused language
5. Include upgrade instructions if there are breaking changes

Format as Markdown.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a product manager creating user-friendly release notes.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    })

    return response.choices[0].message.content || ''
  } catch (error) {
    console.error('Error generating release notes:', error)
    throw new Error('Failed to generate release notes')
  }
}
