import { LRUCache } from 'lru-cache'
import { logger } from './logger'

/**
 * Cache configuration for different data types
 */
const cacheConfigs = {
  commits: {
    max: 500,
    ttl: 1000 * 60 * 15, // 15 minutes
  },
  repos: {
    max: 1000,
    ttl: 1000 * 60 * 5, // 5 minutes
  },
  changelogs: {
    max: 200,
    ttl: 1000 * 60 * 30, // 30 minutes
  },
  tokenHealth: {
    max: 100,
    ttl: 1000 * 60 * 10, // 10 minutes
  },
}

// Create cache instances
const commitCache = new LRUCache<string, any>(cacheConfigs.commits)
const repoCache = new LRUCache<string, any>(cacheConfigs.repos)
const changelogCache = new LRUCache<string, any>(cacheConfigs.changelogs)
const tokenHealthCache = new LRUCache<string, any>(cacheConfigs.tokenHealth)

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join('|')
  return `${prefix}:${sortedParams}`
}

/**
 * Commit cache operations
 */
export const CommitCache = {
  get(repoId: string, fromRef?: string, toRef?: string): any | undefined {
    const key = generateCacheKey('commits', { repoId, fromRef, toRef })
    const cached = commitCache.get(key)
    if (cached) {
      logger.debug('Cache hit: commits', { repoId, fromRef, toRef })
    } else {
      logger.debug('Cache miss: commits', { repoId, fromRef, toRef })
    }
    return cached
  },

  set(repoId: string, data: any, fromRef?: string, toRef?: string): void {
    const key = generateCacheKey('commits', { repoId, fromRef, toRef })
    commitCache.set(key, data)
    logger.debug('Cache set: commits', { repoId, commitCount: data.length })
  },

  invalidate(repoId: string): void {
    // Clear all commit cache entries for this repo
    const keysToDelete: string[] = []
    commitCache.forEach((_, key) => {
      if (key.includes(`repoId:${repoId}`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => commitCache.delete(key))
    logger.info('Cache invalidated: commits', { repoId, keysCleared: keysToDelete.length })
  },
}

/**
 * Repository cache operations
 */
export const RepoCache = {
  get(userId: string, provider: string): any | undefined {
    const key = generateCacheKey('repos', { userId, provider })
    const cached = repoCache.get(key)
    if (cached) {
      logger.debug('Cache hit: repos', { userId, provider })
    }
    return cached
  },

  set(userId: string, provider: string, data: any): void {
    const key = generateCacheKey('repos', { userId, provider })
    repoCache.set(key, data)
    logger.debug('Cache set: repos', { userId, provider, repoCount: data.length })
  },

  invalidate(userId: string, provider?: string): void {
    if (provider) {
      const key = generateCacheKey('repos', { userId, provider })
      repoCache.delete(key)
    } else {
      // Clear all repo entries for this user
      const keysToDelete: string[] = []
      repoCache.forEach((_, key) => {
        if (key.includes(`userId:${userId}`)) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach((key) => repoCache.delete(key))
    }
    logger.info('Cache invalidated: repos', { userId, provider })
  },
}

/**
 * Changelog cache operations
 */
export const ChangelogCache = {
  get(repoId: string, fromRef?: string, toRef?: string): any | undefined {
    const key = generateCacheKey('changelog', { repoId, fromRef, toRef })
    return changelogCache.get(key)
  },

  set(repoId: string, data: any, fromRef?: string, toRef?: string): void {
    const key = generateCacheKey('changelog', { repoId, fromRef, toRef })
    changelogCache.set(key, data)
    logger.debug('Cache set: changelog', { repoId })
  },

  invalidate(repoId: string): void {
    const keysToDelete: string[] = []
    changelogCache.forEach((_, key) => {
      if (key.includes(`repoId:${repoId}`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => changelogCache.delete(key))
    logger.info('Cache invalidated: changelog', { repoId })
  },
}

/**
 * Token health cache operations
 */
export const TokenHealthCache = {
  get(userId: string, provider: string): any | undefined {
    const key = generateCacheKey('tokenHealth', { userId, provider })
    return tokenHealthCache.get(key)
  },

  set(userId: string, provider: string, health: any): void {
    const key = generateCacheKey('tokenHealth', { userId, provider })
    tokenHealthCache.set(key, health)
    logger.debug('Cache set: token health', { userId, provider, valid: health.valid })
  },

  invalidate(userId: string, provider?: string): void {
    if (provider) {
      const key = generateCacheKey('tokenHealth', { userId, provider })
      tokenHealthCache.delete(key)
    } else {
      const keysToDelete: string[] = []
      tokenHealthCache.forEach((_, key) => {
        if (key.includes(`userId:${userId}`)) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach((key) => tokenHealthCache.delete(key))
    }
    logger.info('Cache invalidated: token health', { userId, provider })
  },
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  commitCache.clear()
  repoCache.clear()
  changelogCache.clear()
  tokenHealthCache.clear()
  logger.info('All caches cleared')
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    commits: {
      size: commitCache.size,
      max: commitCache.max,
    },
    repos: {
      size: repoCache.size,
      max: repoCache.max,
    },
    changelogs: {
      size: changelogCache.size,
      max: changelogCache.max,
    },
    tokenHealth: {
      size: tokenHealthCache.size,
      max: tokenHealthCache.max,
    },
  }
}
