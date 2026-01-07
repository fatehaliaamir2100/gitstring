import { z } from 'zod'

/**
 * Input validation schemas using Zod
 * Prevents injection attacks and ensures data integrity
 */

// Common validation patterns
const urlPattern = /^https?:\/\/.+/
const slugPattern = /^[a-z0-9-]+$/
const repoNamePattern = /^[a-zA-Z0-9._-]+$/
const repoOwnerPattern = /^[a-zA-Z0-9-]+$/
const gitRefPattern = /^[a-zA-Z0-9._/-]+$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Provider token validation
export const providerTokenSchema = z.object({
  provider: z.enum(['github', 'gitlab'], {
    errorMap: () => ({ message: 'Provider must be either github or gitlab' })
  }),
  token: z.string()
    .min(20, 'Token is too short')
    .max(500, 'Token is too long')
    .refine(val => !val.includes(' '), 'Token cannot contain spaces')
})

// Repository connection validation
export const repoConnectionSchema = z.object({
  provider: z.enum(['github', 'gitlab']),
  repoName: z.string()
    .min(1, 'Repository name is required')
    .max(100, 'Repository name is too long')
    .regex(repoNamePattern, 'Invalid repository name format'),
  repoOwner: z.string()
    .min(1, 'Repository owner is required')
    .max(100, 'Repository owner is too long')
    .regex(repoOwnerPattern, 'Invalid repository owner format'),
  repoUrl: z.string()
    .url('Invalid URL format')
    .regex(urlPattern, 'Must be an HTTP or HTTPS URL')
    .optional(),
  defaultBranch: z.string()
    .regex(gitRefPattern, 'Invalid branch name')
    .max(100)
    .optional(),
  isPrivate: z.boolean().optional()
})

// Changelog generation validation
export const changelogGenerationSchema = z.object({
  repoId: z.string()
    .regex(uuidPattern, 'Invalid repository ID format'),
  startRef: z.string()
    .regex(gitRefPattern, 'Invalid start reference format')
    .max(100)
    .optional(),
  endRef: z.string()
    .regex(gitRefPattern, 'Invalid end reference format')
    .max(100)
    .optional(),
  useAi: z.boolean().optional(),
  title: z.string()
    .max(200, 'Title is too long')
    .optional(),
  isPublic: z.boolean().optional()
})

// Changelog update validation
export const changelogUpdateSchema = z.object({
  title: z.string()
    .max(200, 'Title is too long')
    .optional(),
  isPublic: z.boolean().optional(),
  markdown: z.string()
    .max(50000, 'Markdown content is too large')
    .optional()
})

// Query parameter validation
export const queryParamsSchema = z.object({
  provider: z.enum(['github', 'gitlab']).optional(),
  id: z.string().regex(uuidPattern).optional(),
  slug: z.string().regex(slugPattern).max(100).optional(),
  page: z.coerce.number().int().positive().max(1000).optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
})

/**
 * Validate and parse request body
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed and validated data
 * @throws Error with validation messages
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation failed: ${messages}`)
    }
    throw new Error('Invalid input data')
  }
}

/**
 * Sanitize string input to prevent XSS
 * @param input - String to sanitize
 * @param maxLength - Maximum allowed length
 */
export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .slice(0, maxLength)
    // Remove dangerous HTML/script tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '')
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  return uuidPattern.test(id)
}

/**
 * Validate git reference (branch, tag, commit SHA)
 */
export function isValidGitRef(ref: string): boolean {
  if (!ref || ref.length > 100) return false
  return gitRefPattern.test(ref)
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}
