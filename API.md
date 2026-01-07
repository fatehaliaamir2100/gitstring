# API Documentation

## Overview

GitString provides REST APIs for changelog generation, repository management, and user authentication.

Base URL: `https://your-app.vercel.app/api`

## Authentication

All API routes (except public changelogs) require authentication via Supabase session cookies.

### Headers

```
Cookie: sb-access-token=xxx; sb-refresh-token=xxx
```

Authentication is handled automatically by Supabase client in the browser.

## Endpoints

### Authentication

#### GET /api/auth/me

Get current user profile.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "created_at": "2026-01-07T00:00:00Z"
  }
}
```

### Repositories

#### GET /api/repos

List user's connected repositories.

**Response:**
```json
{
  "repos": [
    {
      "id": "uuid",
      "provider": "github",
      "repo_name": "my-repo",
      "repo_owner": "username",
      "repo_full_name": "username/my-repo",
      "default_branch": "main",
      "is_private": false,
      "created_at": "2026-01-07T00:00:00Z"
    }
  ]
}
```

#### POST /api/repos

Connect a new repository.

**Request:**
```json
{
  "provider": "github",
  "repoName": "my-repo",
  "repoOwner": "username",
  "accessToken": "token",
  "isPrivate": false,
  "defaultBranch": "main",
  "repoUrl": "https://github.com/username/my-repo"
}
```

**Response:**
```json
{
  "success": true,
  "repo": { /* repo object */ }
}
```

#### DELETE /api/repos?id={repoId}

Disconnect a repository.

**Response:**
```json
{
  "success": true
}
```

#### GET /api/repos/refs?repoId={id}&type={branches|tags}

Get branches or tags for a repository.

**Response:**
```json
{
  "refs": [
    {
      "name": "main",
      "commit": { "sha": "abc123" }
    }
  ]
}
```

### Changelogs

#### GET /api/changelog

List user's changelogs.

**Response:**
```json
{
  "changelogs": [
    {
      "id": "uuid",
      "title": "Changelog for v2.0.0",
      "repo_id": "uuid",
      "tag_start": "v1.0.0",
      "tag_end": "v2.0.0",
      "commit_count": 42,
      "is_public": false,
      "created_at": "2026-01-07T00:00:00Z",
      "repos": {
        "repo_name": "my-repo",
        "repo_full_name": "username/my-repo",
        "provider": "github"
      }
    }
  ]
}
```

#### POST /api/changelog/generate

Generate a new changelog.

**Request:**
```json
{
  "repoId": "uuid",
  "startRef": "v1.0.0",
  "endRef": "v2.0.0",
  "title": "Version 2.0.0 Release",
  "useAi": true
}
```

**Response:**
```json
{
  "success": true,
  "changelog": {
    "id": "uuid",
    "markdown": "# Changelog\n\n...",
    "html": "<h1>Changelog</h1>...",
    "json_data": { /* structured data */ }
  }
}
```

#### GET /api/changelog/{id}?format={json|markdown|html|json-data}

Get a specific changelog.

**Query Parameters:**
- `format`: Response format (default: `json`)

**Response (format=json):**
```json
{
  "changelog": {
    "id": "uuid",
    "title": "...",
    "markdown": "...",
    "html": "...",
    "json_data": { }
  }
}
```

**Response (format=markdown):**
```
Content-Type: text/markdown

# Changelog
...
```

#### DELETE /api/changelog?id={id}

Delete a changelog.

**Response:**
```json
{
  "success": true
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

### Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (not logged in)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. This will be added in future versions.

## Changelog JSON Structure

The `json_data` field contains structured changelog data:

```json
{
  "commits": [
    {
      "category": "✨ Features",
      "commits": [
        {
          "sha": "abc123",
          "message": "feat: add new feature",
          "author": {
            "name": "John Doe",
            "email": "john@example.com",
            "date": "2026-01-07T00:00:00Z"
          },
          "url": "https://github.com/user/repo/commit/abc123",
          "stats": {
            "additions": 100,
            "deletions": 20
          }
        }
      ]
    }
  ],
  "stats": {
    "total_commits": 42,
    "total_additions": 1000,
    "total_deletions": 200,
    "contributors": 5
  },
  "metadata": {
    "repo": "username/repo",
    "start_date": "2026-01-01T00:00:00Z",
    "end_date": "2026-01-07T00:00:00Z",
    "generated_at": "2026-01-07T12:00:00Z"
  }
}
```

## Examples

### Generate Changelog with cURL

```bash
curl -X POST https://your-app.vercel.app/api/changelog/generate \
  -H "Content-Type: application/json" \
  -b "sb-access-token=xxx" \
  -d '{
    "repoId": "uuid",
    "startRef": "v1.0.0",
    "endRef": "v2.0.0",
    "useAi": true
  }'
```

### Download Markdown

```bash
curl https://your-app.vercel.app/api/changelog/{id}?format=markdown \
  -b "sb-access-token=xxx" \
  -o changelog.md
```

## Webhooks (Future)

Webhook support is planned for future releases to enable:
- Automatic changelog generation on new releases
- Integration with CI/CD pipelines
- Notifications on changelog creation

---

For more information, see the [GitHub repository](https://github.com/yourusername/gitstring).
