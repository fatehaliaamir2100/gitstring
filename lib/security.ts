import crypto from 'crypto'

/**
 * Security utility functions for encryption and token handling
 * CRITICAL: Never log or expose tokens in error messages or responses
 */

// Get encryption key from environment or generate one
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 32)
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const TAG_POSITION = SALT_LENGTH + IV_LENGTH
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error('⚠️  WARNING: TOKEN_ENCRYPTION_KEY not properly configured!')
}

/**
 * Encrypt sensitive data (tokens, secrets)
 * @param text - Plain text to encrypt
 * @returns Encrypted string with salt, IV, and auth tag
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const salt = crypto.randomBytes(SALT_LENGTH)

    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY!, salt, 100000, 32, 'sha512')
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
  } catch (error) {
    console.error('Encryption failed')
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data
 * @param encryptedData - Encrypted string with salt, IV, and auth tag
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  try {
    const buffer = Buffer.from(encryptedData, 'base64')

    const salt = buffer.subarray(0, SALT_LENGTH)
    const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION)
    const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION)
    const encrypted = buffer.subarray(ENCRYPTED_POSITION)

    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY!, salt, 100000, 32, 'sha512')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    return decipher.update(encrypted) + decipher.final('utf8')
  } catch (error) {
    console.error('Decryption failed')
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Hash sensitive data for comparison (one-way)
 * Use for non-reversible storage
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

/**
 * Generate a secure random token
 * @param length - Length in bytes (default 32)
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Sanitize error messages to prevent token leakage
 * Removes potential tokens from error strings
 */
export function sanitizeError(error: any): string {
  if (!error) return 'An error occurred'
  
  const message = error.message || error.toString()
  
  // Remove anything that looks like a token (base64, hex strings > 20 chars)
  return message
    .replace(/[A-Za-z0-9+/=]{40,}/g, '[REDACTED]')
    .replace(/[0-9a-f]{40,}/gi, '[REDACTED]')
    .replace(/ghp_[A-Za-z0-9]{36}/g, '[REDACTED]')
    .replace(/glpat-[A-Za-z0-9_-]{20,}/g, '[REDACTED]')
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Basic XSS prevention
}

/**
 * Check if a string looks like a sensitive token
 * Use to prevent accidental logging
 */
export function looksLikeSensitiveData(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  
  // GitHub tokens
  if (text.startsWith('ghp_') || text.startsWith('gho_') || text.startsWith('github_pat_')) return true
  
  // GitLab tokens
  if (text.startsWith('glpat-')) return true
  
  // Long base64 or hex strings
  if (/^[A-Za-z0-9+/=]{40,}$/.test(text)) return true
  if (/^[0-9a-f]{40,}$/i.test(text)) return true
  
  return false
}
