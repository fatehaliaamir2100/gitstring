# Logging Implementation Summary

## What Was Added

A comprehensive logging system has been integrated throughout the GitString application to provide detailed insights into application behavior, performance, security events, and errors.

## New Files

1. **`lib/logger.ts`** - Core logging utility with structured logging capabilities
2. **`LOGGING.md`** - Comprehensive documentation for the logging system
3. **`.env.logging.example`** - Example logging configuration

## Modified Files

The logging system has been integrated into the following files:

### Core Libraries
- `lib/security.ts` - Encryption/decryption operations, security events
- `lib/gitApi.ts` - GitHub/GitLab API calls, commit fetching
- `lib/openaiHelper.ts` - AI changelog generation
- `lib/tokenHelper.ts` - Token retrieval and management
- `lib/changelogLogic.ts` - Changelog formatting and processing

### API Routes
- `app/api/changelog/generate/route.ts` - Changelog generation with full lifecycle logging
- `app/api/repos/route.ts` - Repository CRUD operations
- `app/auth/callback/route.ts` - Authentication flow

### Middleware
- `middleware.ts` - Request processing and security headers

## Key Features

### 1. **Structured Logging with Context**
Every log includes contextual information:
```typescript
logger.info('Repository connected', { 
  repoId: repo.id, 
  provider: 'github',
  repoName: repo.full_name 
})
```

### 2. **Automatic Sensitive Data Redaction**
Tokens, passwords, and secrets are automatically redacted:
- GitHub tokens (ghp_...)
- GitLab tokens (glpat-...)
- Any field containing 'token', 'password', 'secret', 'apiKey'

### 3. **Performance Tracking**
Automatically tracks operation duration:
```typescript
logger.performance('fetchGitHubCommits', 2341, { 
  commitCount: 150 
})
```

### 4. **Specialized Logging Methods**
- `logger.apiRequest()` / `logger.apiResponse()` - API lifecycle
- `logger.dbQuery()` / `logger.dbQueryComplete()` - Database operations
- `logger.externalApiCall()` / `logger.externalApiResponse()` - External APIs
- `logger.authEvent()` - Authentication events
- `logger.securityEvent()` - Security-related events

### 5. **Configurable Log Levels**
Four log levels (DEBUG, INFO, WARN, ERROR) configurable via environment variable:
```env
LOG_LEVEL=INFO  # Default for production
LOG_LEVEL=DEBUG # Detailed logging for development
```

## Log Coverage Examples

### API Request Lifecycle
```
[INFO] API Request: POST /api/changelog/generate
[INFO] Changelog generation started
[DEBUG] Retrieving provider token
[INFO] Fetching GitHub commits
[INFO] Performance: fetchGitHubCommits took 2600ms
[INFO] Changelog generated and saved
[INFO] API Response: POST /api/changelog/generate - 200 (3750ms)
```

### Security Events
```
[WARN] Security Event: Encryption key not properly configured
[WARN] Security Event: Sensitive data redacted from error message
[WARN] Rate limit exceeded for changelog generation
```

### Database Operations
```
[DEBUG] DB Query: SELECT on repos
[DEBUG] DB Query Complete: SELECT on repos (45ms) {"rowCount":12}
[DEBUG] DB Query: INSERT on changelogs
[DEBUG] DB Query Complete: INSERT on changelogs (50ms)
```

### External API Calls
```
[INFO] External API Call: GitHub - GET /repos/owner/repo/commits
[INFO] External API Response: GitHub - commits - 200 (856ms)
[INFO] External API Call: OpenAI - POST /chat/completions
[INFO] External API Response: OpenAI - chat completions - 200 (2341ms)
```

## Benefits

1. **Debugging** - Detailed logs help track down issues quickly
2. **Performance Monitoring** - Identify slow operations and bottlenecks
3. **Security Auditing** - Track authentication, authorization, and security events
4. **Error Tracking** - Comprehensive error logging with context
5. **API Monitoring** - Track external API calls and responses
6. **User Activity Tracking** - Understand user behavior and usage patterns
7. **Production Troubleshooting** - Diagnose issues in production without debugging

## Configuration

Add to your `.env.local`:

```env
# Set log level (DEBUG, INFO, WARN, ERROR)
LOG_LEVEL=INFO
```

Defaults:
- **Development**: DEBUG (all logs)
- **Production**: INFO (info, warnings, errors)

## Quick Start

The logging system is ready to use immediately. No additional configuration required!

### Using the Logger

```typescript
import { logger } from '@/lib/logger'

// Basic logging
logger.info('Operation completed', { userId: '123' })
logger.error('Operation failed', error, { operation: 'createRepo' })

// API logging
logger.apiRequest('GET', '/api/repos')
logger.apiResponse('GET', '/api/repos', 200, 123)

// Database logging
logger.dbQuery('SELECT', 'repos', { userId: '123' })
logger.dbQueryComplete('SELECT', 'repos', 45, 10)

// Performance tracking
logger.performance('expensiveOperation', 5234, { items: 100 })

// Security events
logger.securityEvent('Unauthorized access attempt', { ip: '192.168.1.1' })
```

### Measuring Execution Time

```typescript
import { measureTime } from '@/lib/logger'

const result = await measureTime(
  'fetchCommits',
  async () => fetchGitHubCommits(token, owner, repo),
  { repo: 'my-repo' }
)
```

## Documentation

See [`LOGGING.md`](./LOGGING.md) for complete documentation including:
- Detailed usage examples
- Best practices
- Security features
- Performance impact
- Troubleshooting
- Monitoring and analysis

## Next Steps

1. **Monitor logs** during development to verify coverage
2. **Adjust LOG_LEVEL** based on your needs
3. **Set up log aggregation** in production (Datadog, Sentry, CloudWatch)
4. **Create alerts** for critical errors and performance issues
5. **Review logs regularly** to identify optimization opportunities

## Notes

- All logs use ISO 8601 timestamps (UTC)
- Logs are written to stdout/stderr (standard for containers/cloud)
- Context data is automatically sanitized for security
- No performance impact in production with appropriate log levels
