# Logging Quick Reference

## Import the Logger

```typescript
import { logger } from '@/lib/logger'
```

## Common Patterns

### API Route Handler

```typescript
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  logger.apiRequest('POST', '/api/your-endpoint')
  
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.warn('Unauthorized attempt', { authError: authError?.message })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Processing request', { userId: user.id })
    
    // Your logic here
    
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/your-endpoint', 200, duration)
    return NextResponse.json({ success: true })
    
  } catch (error) {
    logger.error('Request failed', error, { duration: Date.now() - startTime })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Database Operations

```typescript
logger.dbQuery('SELECT', 'table_name', { userId: user.id })
const startTime = Date.now()

const { data, error } = await supabase.from('table_name').select('*')

logger.dbQueryComplete('SELECT', 'table_name', Date.now() - startTime, data?.length || 0)
```

### External API Calls

```typescript
logger.externalApiCall('GitHub', 'GET /repos/owner/repo', { repo: 'myrepo' })
const startTime = Date.now()

const response = await fetch(url, { headers })

logger.externalApiResponse('GitHub', 'repos', response.status, Date.now() - startTime)
```

### Function with Performance Tracking

```typescript
import { measureTime } from '@/lib/logger'

export async function myExpensiveFunction(param: string) {
  return await measureTime(
    'myExpensiveFunction',
    async () => {
      // Your expensive logic here
      return result
    },
    { param }
  )
}
```

### Security Operations

```typescript
// Encryption
logger.debug('Starting encryption operation')
const encrypted = encrypt(token)
logger.debug('Encryption completed')

// Token retrieval
logger.debug('Retrieving provider token', { provider: 'github' })
const token = await getProviderToken(userId, 'github')
logger.info('Token retrieved successfully', { provider: 'github' })

// Security events
logger.securityEvent('Rate limit exceeded', { ip: request.ip })
logger.securityEvent('Invalid token detected', { userId })
```

### Error Handling

```typescript
try {
  // Your code
} catch (error) {
  logger.error('Operation failed', error, { 
    operation: 'operationName',
    userId: user.id,
    additionalContext: 'value'
  })
  throw error
}
```

## Log Levels

### DEBUG
```typescript
logger.debug('Detailed diagnostic info', { variable: value })
```
Use for: Variable values, internal state, flow details

### INFO
```typescript
logger.info('Important business event', { userId: '123' })
```
Use for: Successful operations, important events

### WARN
```typescript
logger.warn('Potential issue detected', { responseTime: 5000 })
```
Use for: Degraded performance, recoverable errors, unusual conditions

### ERROR
```typescript
logger.error('Operation failed', error, { context: 'data' })
```
Use for: Failed operations, exceptions, critical issues

## Specialized Methods

```typescript
// API lifecycle
logger.apiRequest(method, path, context?)
logger.apiResponse(method, path, statusCode, duration, context?)

// Database operations
logger.dbQuery(operation, table, context?)
logger.dbQueryComplete(operation, table, duration, rowCount?, context?)

// External APIs
logger.externalApiCall(service, endpoint, context?)
logger.externalApiResponse(service, endpoint, statusCode, duration, context?)

// Authentication
logger.authEvent(event, context?)

// Security
logger.securityEvent(event, context?)

// Performance
logger.performance(operation, duration, context?)
```

## Context Best Practices

Always include relevant context:

```typescript
// Good ✅
logger.info('User logged in', { 
  userId: user.id,
  provider: 'github',
  timestamp: Date.now()
})

// Not helpful ❌
logger.info('User logged in')
```

## What NOT to Log

Avoid logging:
- **Sensitive data** (tokens, passwords, API keys) - they're auto-redacted, but don't rely on it
- **Large objects** (entire request bodies, huge arrays)
- **Inside loops** (for each item) - log once with count instead
- **Too frequently** (every millisecond) - log at meaningful checkpoints

## Configuration

```env
# .env.local
LOG_LEVEL=DEBUG  # Development (all logs)
LOG_LEVEL=INFO   # Production (info, warn, error)
LOG_LEVEL=WARN   # High-traffic (warn, error only)
LOG_LEVEL=ERROR  # Critical only
```

## Example: Complete Flow

```typescript
export async function generateChangelog(repoId: string, userId: string) {
  const startTime = Date.now()
  logger.info('Starting changelog generation', { repoId, userId })
  
  try {
    // Get repo
    logger.dbQuery('SELECT', 'repos', { repoId })
    const repo = await getRepo(repoId)
    logger.info('Repository fetched', { repoName: repo.full_name })
    
    // Get token
    logger.debug('Retrieving access token')
    const token = await getProviderToken(userId, repo.provider)
    
    // Fetch commits
    logger.externalApiCall(repo.provider, 'commits', { repo: repo.full_name })
    const commits = await fetchCommits(token, repo)
    logger.info('Commits fetched', { count: commits.length })
    
    // Generate
    logger.debug('Generating changelog')
    const changelog = await generate(commits)
    
    // Save
    logger.dbQuery('INSERT', 'changelogs')
    await saveChangelog(changelog)
    
    const duration = Date.now() - startTime
    logger.performance('generateChangelog', duration, { 
      repoId, 
      commitCount: commits.length 
    })
    logger.info('Changelog generated successfully', { changelogId: changelog.id })
    
    return changelog
    
  } catch (error) {
    logger.error('Changelog generation failed', error, { 
      repoId, 
      userId,
      duration: Date.now() - startTime 
    })
    throw error
  }
}
```

## Filtering Logs

### In Development Console
```bash
# Filter by level
grep "ERROR:" logs.txt
grep "WARN:" logs.txt

# Filter by operation
grep "fetchGitHubCommits" logs.txt

# Filter by user
grep '"userId":"abc123"' logs.txt
```

### In Production (Log Aggregator)
- **By level**: Filter for `ERROR:` or `WARN:`
- **By user**: Search for `userId` in context
- **By operation**: Search for function/operation names
- **By performance**: Filter where `duration > 5000`

## Tips

1. **Start of operation**: Log with context
2. **End of operation**: Log with duration and result
3. **Errors**: Always include error object and context
4. **Performance**: Track operations > 1 second
5. **Security**: Log all auth and authorization events
6. **Database**: Log all write operations
7. **External APIs**: Log all calls and responses

## Need More Info?

See full documentation in [`LOGGING.md`](./LOGGING.md)
