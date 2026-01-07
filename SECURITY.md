# 🔒 Security Guide

## Overview

This document outlines the security measures implemented in the GitString application and best practices for maintaining a secure environment.

## 🛡️ Security Measures Implemented

### 1. Token Encryption

**Problem:** OAuth tokens and API keys stored in plain text are vulnerable to database breaches.

**Solution:** All sensitive tokens are encrypted before storage using AES-256-GCM encryption.

```typescript
import { encrypt, decrypt } from '@/lib/security'

// Encrypt before storing
const encryptedToken = encrypt(userToken)
await saveToDatabase(encryptedToken)

// Decrypt when needed (server-side only)
const decryptedToken = decrypt(encryptedData)
```

**Key Points:**
- Tokens are encrypted with AES-256-GCM (authenticated encryption)
- Each encrypted value uses a unique salt and IV
- Encryption keys are stored in environment variables
- Tokens are NEVER returned through API responses

### 2. Secure Token Storage

**Architecture:**
```
provider_tokens table (encrypted)
├── user_id (foreign key)
├── provider (github/gitlab)
└── encrypted_token (AES-256-GCM encrypted)
```

**Security Rules:**
- Tokens are stored in a separate `provider_tokens` table
- Row-level security (RLS) ensures users can only access their own tokens
- The `access_token` column has been removed from the `repos` table
- Supabase provides encryption at rest for all database columns

### 3. API Security

#### Rate Limiting
All API endpoints are protected with rate limiting:

```typescript
import { rateLimiters } from '@/lib/rateLimit'

// Apply rate limiting
const rateLimitResponse = rateLimiters.api(request)
if (rateLimitResponse) return rateLimitResponse
```

**Rate Limits:**
- Standard API: 60 requests/minute
- Sensitive operations: 5 requests/15 minutes
- Authentication: 10 attempts/15 minutes
- Changelog generation: 10 requests/5 minutes

#### Input Validation
All user input is validated using Zod schemas:

```typescript
import { validateInput, providerTokenSchema } from '@/lib/validation'

// Validate and sanitize input
const validatedData = validateInput(providerTokenSchema, body)
```

**Validation includes:**
- Type checking
- Length limits
- Pattern matching (regex)
- XSS prevention
- SQL injection prevention

### 4. Security Headers

The middleware adds comprehensive security headers to all responses:

```typescript
X-Frame-Options: DENY                    // Prevent clickjacking
X-Content-Type-Options: nosniff          // Prevent MIME sniffing
X-XSS-Protection: 1; mode=block          // XSS protection
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: ...             // Prevent XSS and injection
Strict-Transport-Security: ...           // Force HTTPS (production)
```

### 5. Authentication & Authorization

- **Supabase Auth:** JWT-based authentication
- **Row-Level Security (RLS):** Database-level access control
- **Session Management:** Secure cookie-based sessions

**Policy Examples:**
```sql
-- Users can only view their own tokens
CREATE POLICY "Users can view own tokens" ON provider_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only modify their own data
CREATE POLICY "Users can update own data" ON provider_tokens
  FOR UPDATE USING (auth.uid() = user_id);
```

### 6. Error Handling

Sensitive information is never exposed in error messages:

```typescript
import { sanitizeError } from '@/lib/security'

try {
  // Operation that might fail
} catch (error) {
  const safeError = sanitizeError(error)
  console.error('Operation failed:', safeError)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

**What gets sanitized:**
- API tokens (GitHub: `ghp_...`, GitLab: `glpat-...`)
- Long base64/hex strings
- Encryption keys
- Database connection strings

## 🔐 Environment Variables

### Required Variables

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Token encryption (CRITICAL)
TOKEN_ENCRYPTION_KEY=<32+ character secure random string>

# OAuth providers (required for auth)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret

# OpenAI (optional, for AI-generated changelogs)
OPENAI_API_KEY=your-openai-api-key
```

### Generating a Secure Encryption Key

```bash
# Generate a 32-byte (256-bit) key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚨 Security Best Practices

### For Developers

1. **Never log sensitive data**
   ```typescript
   // ❌ BAD
   console.log('Token:', userToken)
   
   // ✅ GOOD
   console.log('Token received:', looksLikeSensitiveData(userToken))
   ```

2. **Never return tokens in API responses**
   ```typescript
   // ❌ BAD
   return NextResponse.json({ token: decryptedToken })
   
   // ✅ GOOD
   return NextResponse.json({ hasToken: true })
   ```

3. **Always validate user input**
   ```typescript
   // ❌ BAD
   const { repoId } = await request.json()
   
   // ✅ GOOD
   const { repoId } = validateInput(schema, await request.json())
   ```

4. **Use rate limiting on all endpoints**
   ```typescript
   // Apply appropriate rate limiter based on endpoint sensitivity
   const rateLimitResponse = rateLimiters.strict(request)
   if (rateLimitResponse) return rateLimitResponse
   ```

5. **Check authentication on every protected route**
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser()
   if (error || !user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   ```

### For Production Deployment

1. **Enable HTTPS only**
   - Configure SSL/TLS certificates
   - HSTS headers are automatically added in production

2. **Set strong environment variables**
   - Use long, random encryption keys
   - Rotate keys periodically
   - Never commit `.env` files

3. **Database Security**
   - Run all migrations to remove deprecated columns
   - Enable Supabase Vault for additional encryption
   - Regular security audits

4. **Monitor and Alert**
   - Set up logging for authentication failures
   - Monitor rate limit violations
   - Track unusual API usage patterns

5. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Patch vulnerabilities promptly

## 🔄 Migration Guide

### Migrating from Plain Text Tokens

If you have existing tokens stored in plain text:

1. **Create encryption key:**
   ```bash
   export TOKEN_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```

2. **Run migration script:**
   ```sql
   -- First, migrate tokens from repos to provider_tokens
   INSERT INTO provider_tokens (user_id, provider, encrypted_token)
   SELECT user_id, provider, access_token
   FROM repos
   WHERE access_token IS NOT NULL
   ON CONFLICT (user_id, provider) DO NOTHING;
   
   -- Then, remove the access_token column
   -- (Run the migration file: remove-access-token-from-repos.sql)
   ```

3. **Update application code:**
   - Use `getProviderToken()` helper instead of direct database access
   - Never expose tokens through APIs

## 📋 Security Checklist

Use this checklist before deploying:

- [ ] `TOKEN_ENCRYPTION_KEY` is set (32+ characters)
- [ ] All OAuth secrets are configured
- [ ] Database migrations are applied
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] RLS policies are active on all tables
- [ ] HTTPS is enforced
- [ ] Error messages don't leak sensitive data
- [ ] Input validation is implemented on all endpoints
- [ ] Tokens are never logged or exposed
- [ ] `.env` files are in `.gitignore`
- [ ] Dependencies are up to date

## 🆘 Incident Response

If you suspect a security breach:

1. **Immediate Actions:**
   - Rotate all encryption keys
   - Revoke all OAuth tokens
   - Force user re-authentication
   - Check database access logs

2. **Investigation:**
   - Review application logs
   - Check for unauthorized access
   - Identify the attack vector

3. **Recovery:**
   - Patch the vulnerability
   - Notify affected users
   - Update security measures
   - Document the incident

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## 🔧 Security Utilities

The following security utilities are available:

- `lib/security.ts` - Encryption, sanitization, validation
- `lib/rateLimit.ts` - Rate limiting middleware
- `lib/validation.ts` - Input validation schemas
- `lib/tokenHelper.ts` - Secure token retrieval (internal use only)

## ⚠️ What NOT to Do

1. **Don't store tokens in:**
   - Local storage (client-side)
   - Session storage (client-side)
   - URL parameters
   - Git repositories
   - Plain text files

2. **Don't expose:**
   - API keys in client-side code
   - Encryption keys
   - Database credentials
   - Internal error details

3. **Don't skip:**
   - Input validation
   - Rate limiting
   - Authentication checks
   - Error sanitization

---

**Remember:** Security is not a one-time task. Regular audits, updates, and monitoring are essential to maintain a secure application.
