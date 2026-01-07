# Logging System Documentation

## Overview

This application now includes a comprehensive logging system that provides detailed insights into application behavior, performance, and security events. The logging infrastructure is centralized in `lib/logger.ts` and integrated throughout the codebase.

## Features

### Log Levels

The logging system supports four log levels with configurable minimum thresholds:

1. **DEBUG** (0) - Detailed diagnostic information
2. **INFO** (1) - General informational messages
3. **WARN** (2) - Warning messages for potentially harmful situations
4. **ERROR** (3) - Error messages for failure events

### Configuration

Set the minimum log level using the `LOG_LEVEL` environment variable:

```env
# .env.local
LOG_LEVEL=DEBUG  # Show all logs (development)
LOG_LEVEL=INFO   # Show info, warn, and error (default production)
LOG_LEVEL=WARN   # Show only warnings and errors
LOG_LEVEL=ERROR  # Show only errors
```

If not set, the system defaults to:
- **DEBUG** in development (`NODE_ENV=development`)
- **INFO** in production

## Usage Examples

### Basic Logging

```typescript
import { logger } from '@/lib/logger'

// Debug messages (development details)
logger.debug('Processing user request', { userId: '123', action: 'create' })

// Info messages (general information)
logger.info('User logged in successfully', { userId: '123' })

// Warning messages (concerning but non-fatal)
logger.warn('Slow query detected', { query: 'SELECT...', duration: 3000 })

// Error messages (failures)
logger.error('Database connection failed', error, { database: 'postgres' })
```

### Specialized Logging Methods

#### API Request/Response Logging

```typescript
// Log incoming API request
logger.apiRequest('POST', '/api/changelog/generate', { userId: user.id })

// Log API response with duration
logger.apiResponse('POST', '/api/changelog/generate', 200, 1523, { 
  changelogId: 'abc123' 
})
```

#### Database Operation Logging

```typescript
// Log database query
logger.dbQuery('SELECT', 'repos', { userId: user.id })

// Log query completion with duration and row count
logger.dbQueryComplete('SELECT', 'repos', 45, 12)
```

#### External API Call Logging

```typescript
// Log external API call
logger.externalApiCall('GitHub', 'GET /repos/owner/repo/commits', { repo: 'myrepo' })

// Log external API response
logger.externalApiResponse('GitHub', 'commits', 200, 856, { 
  commitCount: 25 
})
```

#### Authentication Events

```typescript
// Log auth-related events
logger.authEvent('user login', { userId: '123', provider: 'github' })
logger.authEvent('password reset requested', { email: 'user@example.com' })
```

#### Security Events

```typescript
// Log security-related events
logger.securityEvent('Rate limit exceeded', { ip: '192.168.1.1' })
logger.securityEvent('Invalid token detected', { userId: '123' })
```

#### Performance Tracking

```typescript
// Log performance metrics
logger.performance('fetchGitHubCommits', 2341, { 
  commitCount: 150,
  includeDetails: true 
})
```

### Measuring Execution Time

Use the `measureTime` helper to automatically track and log operation duration:

```typescript
import { measureTime } from '@/lib/logger'

const commits = await measureTime(
  'fetchCommits',
  async () => fetchGitHubCommits(token, owner, repo),
  { repo: 'my-repo', provider: 'github' }
)
```

This will:
1. Log when the operation starts (DEBUG level)
2. Execute the async function
3. Log performance metrics on success
4. Log errors with duration on failure

## Security Features

### Automatic Sensitive Data Redaction

The logger automatically redacts sensitive information from logs:

- Tokens (GitHub, GitLab, access tokens, etc.)
- Passwords
- API keys
- Any field containing "secret" in the name

Example:

```typescript
logger.info('Token retrieved', { 
  token: 'ghp_abc123...',  // Will be logged as '[REDACTED]'
  userId: '123'             // Will be logged normally
})
```

### Context Sanitization

All log context objects are automatically sanitized before being logged to prevent accidental exposure of sensitive data.

## Logging Coverage

The logging system has been integrated across the entire application:

### Core Libraries

- **security.ts** - Encryption/decryption operations, security events
- **gitApi.ts** - Git provider API calls, commit fetching
- **openaiHelper.ts** - AI changelog generation with OpenAI
- **tokenHelper.ts** - Token retrieval and management
- **changelogLogic.ts** - Changelog formatting and processing

### API Routes

- **changelog/generate/route.ts** - Comprehensive changelog generation logging
- **repos/route.ts** - Repository CRUD operations
- **auth/callback/route.ts** - Authentication flow

### Middleware

- **middleware.ts** - Request processing and security headers

## Log Format

All logs follow a consistent format:

```
[2026-01-07T12:34:56.789Z] LEVEL: Message {"context":"data","key":"value"}
```

Example:

```
[2026-01-07T12:34:56.789Z] INFO: API Request: POST /api/changelog/generate {"userId":"abc123"}
[2026-01-07T12:34:57.312Z] INFO: Changelog generation started {"userId":"abc123"}
[2026-01-07T12:34:58.145Z] INFO: Fetching GitHub commits {"owner":"myorg","repo":"myrepo"}
[2026-01-07T12:35:01.523Z] INFO: Performance: fetchGitHubCommits took 3378ms {"commitCount":150}
[2026-01-07T12:35:02.789Z] INFO: API Response: POST /api/changelog/generate - 200 (6000ms) {"changelogId":"xyz789"}
```

## Best Practices

### 1. Use Appropriate Log Levels

- **DEBUG**: Detailed flow information, variable values, internal state
- **INFO**: Important business events, successful operations
- **WARN**: Degraded functionality, slow operations, recoverable errors
- **ERROR**: Failed operations, exceptions, critical issues

### 2. Provide Context

Always include relevant context:

```typescript
// Good
logger.info('Repository connected', { 
  repoId: repo.id, 
  provider: 'github',
  repoName: repo.full_name 
})

// Not as helpful
logger.info('Repository connected')
```

### 3. Log at Key Points

- Start of operations
- Completion with duration
- Error conditions
- Security events
- Performance issues

### 4. Don't Over-Log

Avoid logging inside tight loops or for every item in large collections:

```typescript
// Bad
commits.forEach(commit => {
  logger.debug('Processing commit', { sha: commit.sha })
})

// Good
logger.debug('Processing commits', { count: commits.length })
```

### 5. Use Performance Logging for Slow Operations

Track operations that might be slow:

```typescript
const startTime = Date.now()
const result = await expensiveOperation()
logger.performance('expensiveOperation', Date.now() - startTime)
```

## Monitoring and Analysis

### Development

In development, all logs are visible in the console with full context. Use DEBUG level to see detailed execution flow.

### Production

In production:

1. Set `LOG_LEVEL=INFO` or `LOG_LEVEL=WARN` to reduce noise
2. Logs are written to stdout/stderr and can be collected by:
   - Cloud platform logging (Vercel, AWS CloudWatch, etc.)
   - Log aggregation services (Datadog, LogRocket, Sentry, etc.)
   - Custom log processors

### Filtering Logs

Filter logs by pattern in your log aggregator:

- All errors: `ERROR:`
- Specific operation: `"fetchGitHubCommits"`
- User activity: `{"userId":"abc123"}`
- Performance issues: `"slow"` or `duration > 5000`
- Security events: `"Security Event"`

## Performance Impact

The logging system is designed to be lightweight:

- Minimal overhead for disabled log levels
- No expensive operations in hot paths
- Automatic data sanitization is optimized
- Context objects are only serialized when needed

## Troubleshooting

### No Logs Appearing

1. Check `LOG_LEVEL` environment variable
2. Verify logs aren't filtered by your platform
3. Check that `NODE_ENV` is set correctly

### Too Many Logs

1. Increase `LOG_LEVEL` to `WARN` or `ERROR`
2. Configure platform-specific log filtering
3. Review and reduce DEBUG-level logging

### Sensitive Data in Logs

If sensitive data appears in logs:

1. Check field naming - avoid common sensitive field names
2. Update `sanitizeContext()` in `logger.ts` to add more patterns
3. Use `sanitizeError()` from `security.ts` for error messages

## Future Enhancements

Potential improvements:

1. **Structured logging to external services** (Datadog, Sentry)
2. **Request ID tracking** across the entire request lifecycle
3. **User session tracking** to correlate logs by user
4. **Log sampling** for high-volume endpoints
5. **Performance alerting** for operations exceeding thresholds
6. **Log retention policies** and archiving
7. **Dashboard integration** for real-time monitoring

## Example: Full Request Lifecycle

Here's how a complete changelog generation request is logged:

```
[2026-01-07T10:00:00.000Z] INFO: API Request: POST /api/changelog/generate
[2026-01-07T10:00:00.050Z] INFO: Changelog generation started {"userId":"user123"}
[2026-01-07T10:00:00.100Z] INFO: Changelog generation request validated {"repoId":"repo456","startRef":"v1.0","endRef":"v1.1"}
[2026-01-07T10:00:00.150Z] DEBUG: DB Query: SELECT on repos {"repoId":"repo456"}
[2026-01-07T10:00:00.200Z] DEBUG: DB Query Complete: SELECT on repos (50ms) {"rowCount":1}
[2026-01-07T10:00:00.250Z] INFO: Repository fetched {"repoId":"repo456","provider":"github"}
[2026-01-07T10:00:00.300Z] DEBUG: Retrieving provider token {"provider":"github"}
[2026-01-07T10:00:00.350Z] INFO: Access token retrieved successfully {"provider":"github"}
[2026-01-07T10:00:00.400Z] INFO: Fetching GitHub commits {"owner":"myorg","repo":"myrepo"}
[2026-01-07T10:00:03.000Z] INFO: Performance: fetchGitHubCommits took 2600ms {"commitCount":50}
[2026-01-07T10:00:03.050Z] DEBUG: Grouping commits by type {"commitCount":50}
[2026-01-07T10:00:03.100Z] DEBUG: Commits grouped successfully {"groupCount":5}
[2026-01-07T10:00:03.150Z] INFO: Generating rule-based changelog
[2026-01-07T10:00:03.500Z] INFO: Rule-based changelog generated successfully
[2026-01-07T10:00:03.550Z] DEBUG: Converting markdown to HTML
[2026-01-07T10:00:03.600Z] DEBUG: DB Query: INSERT on changelogs
[2026-01-07T10:00:03.650Z] DEBUG: DB Query Complete: INSERT on changelogs (50ms)
[2026-01-07T10:00:03.700Z] INFO: Changelog generated and saved {"changelogId":"cl789"}
[2026-01-07T10:00:03.750Z] INFO: API Response: POST /api/changelog/generate - 200 (3750ms) {"changelogId":"cl789"}
```

This provides complete visibility into the request processing, performance, and any issues that occur.
