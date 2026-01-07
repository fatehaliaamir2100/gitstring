# 🚀 Deployment Guide for GitString

This guide walks you through deploying GitString to production using Vercel and Supabase.

## Prerequisites

- GitHub account (for code hosting and OAuth)
- Vercel account (free tier works)
- Supabase account (free tier works)
- GitLab account (optional, for GitLab OAuth)
- OpenAI API key (optional, for AI features)

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Push your code to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Set Up Supabase Project

#### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: gitstring-prod
   - **Database Password**: (generate strong password)
   - **Region**: (choose closest to your users)
4. Click "Create new project"

#### Run Database Schema

1. Go to SQL Editor
2. Copy contents from `supabase/schema.sql`
3. Click "Run" to execute

#### Enable Row Level Security

The schema already enables RLS, but verify:
1. Go to Authentication > Policies
2. Check that policies exist for `users`, `repos`, `changelogs`

### 3. Configure GitHub OAuth

#### Create OAuth App

1. Go to GitHub Settings > Developer Settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: GitString Production
   - **Homepage URL**: `https://your-domain.com` (you'll update this)
   - **Authorization callback URL**: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - **Application description**: Changelog generator
4. Click "Register application"
5. Copy **Client ID**
6. Generate and copy **Client Secret**

#### Add to Supabase

1. In Supabase Dashboard > Authentication > Providers
2. Find "GitHub" and enable it
3. Enter:
   - **Client ID**: (from GitHub)
   - **Client Secret**: (from GitHub)
4. Copy the Callback URL shown (you'll need it)

### 4. Configure GitLab OAuth (Optional)

#### Create OAuth App

1. Go to GitLab User Settings > Applications
2. Click "Add new application"
3. Fill in:
   - **Name**: GitString Production
   - **Redirect URI**: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - **Scopes**: Check `read_api`, `read_user`, `read_repository`
4. Click "Save application"
5. Copy **Application ID**
6. Copy **Secret**

#### Add to Supabase

1. In Supabase Dashboard > Authentication > Providers
2. Find "GitLab" and enable it
3. Enter:
   - **GitLab URL**: `https://gitlab.com` (or your self-hosted URL)
   - **Client ID**: (Application ID from GitLab)
   - **Client Secret**: (Secret from GitLab)

### 5. Get OpenAI API Key (Optional)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create account
3. Go to API Keys
4. Click "Create new secret key"
5. Copy the key (you won't see it again!)

### 6. Deploy to Vercel

#### Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Vercel will detect Next.js automatically

#### Configure Build Settings

Vercel should auto-detect these, but verify:
- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### Add Environment Variables

In Vercel project settings > Environment Variables, add:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxx

# GitLab OAuth (optional)
GITLAB_CLIENT_ID=xxxxxxxxxxxxx
GITLAB_CLIENT_SECRET=xxxxxxxxxxxxx

# OpenAI (optional)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# App URL (update after first deploy)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important**: Add these to all environments (Production, Preview, Development)

#### Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Copy your production URL (e.g., `https://gitstring.vercel.app`)

### 7. Update OAuth Callback URLs

After first deployment, you need to update your production URL.

#### Update GitHub OAuth App

1. Go to GitHub OAuth App settings
2. Update **Homepage URL** to your Vercel URL
3. Verify **Authorization callback URL** is still: 
   `https://<your-supabase-ref>.supabase.co/auth/v1/callback`

#### Update GitLab OAuth App

1. Go to GitLab Application settings
2. Verify **Redirect URI** is still:
   `https://<your-supabase-ref>.supabase.co/auth/v1/callback`

#### Update Environment Variable

1. In Vercel project > Settings > Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. Redeploy to apply changes

### 8. Custom Domain (Optional)

#### Add Domain to Vercel

1. In Vercel project > Settings > Domains
2. Add your custom domain (e.g., `gitstring.com`)
3. Follow DNS instructions to point domain to Vercel

#### Update URLs

After domain is active:
1. Update `NEXT_PUBLIC_APP_URL` in Vercel
2. Update GitHub OAuth App homepage URL
3. Redeploy

## Verification Checklist

- [ ] App loads at production URL
- [ ] Login with GitHub works
- [ ] Login with GitLab works (if configured)
- [ ] Dashboard displays correctly
- [ ] Can connect repositories
- [ ] Can generate changelogs
- [ ] Can download in all formats
- [ ] AI enhancement works (if configured)

## Monitoring & Maintenance

### Vercel Dashboard

Monitor:
- Deployment status
- Build logs
- Function logs
- Analytics (if enabled)

### Supabase Dashboard

Monitor:
- Database usage
- API requests
- Storage usage
- Auth users

### Logs

Check logs for errors:

```bash
# Vercel logs
vercel logs <deployment-url>

# Real-time logs
vercel logs <deployment-url> --follow
```

## Troubleshooting

### OAuth Not Working

**Symptoms**: Login redirects fail or show errors

**Solutions**:
1. Verify callback URLs match exactly
2. Check OAuth credentials are correct
3. Ensure Supabase providers are enabled
4. Check browser console for errors

### API Errors

**Symptoms**: "Failed to fetch" or 500 errors

**Solutions**:
1. Verify all environment variables are set
2. Check Supabase is online
3. Review function logs in Vercel
4. Check RLS policies in Supabase

### Build Failures

**Symptoms**: Deployment fails

**Solutions**:
1. Check build logs in Vercel
2. Verify all dependencies are in package.json
3. Run `npm run build` locally to test
4. Check TypeScript errors

### Database Connection Issues

**Symptoms**: "Failed to connect to database"

**Solutions**:
1. Verify Supabase URL and keys
2. Check database is not paused (free tier auto-pauses)
3. Verify RLS policies allow access
4. Check Supabase status page

## Security Best Practices

1. **Environment Variables**: Never commit `.env.local` to git
2. **API Keys**: Rotate OpenAI keys regularly
3. **Supabase Keys**: Use anon key for client, service role only in API routes
4. **OAuth Secrets**: Keep GitHub/GitLab secrets secure
5. **RLS**: Always keep Row Level Security enabled

## Scaling Considerations

### Free Tier Limits

**Vercel Free**:
- 100 GB bandwidth/month
- Unlimited deployments
- Serverless function execution: 100 GB-Hrs

**Supabase Free**:
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- 2 GB bandwidth

### Upgrade When:
- Users > 1,000
- Database > 400 MB
- Regular function timeouts
- Need custom domains/teams

## Backup Strategy

### Database Backups

Supabase automatically backs up daily (on paid plans).

For free tier:
```bash
# Manual backup
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

### Code Backups

- Keep git history clean
- Tag releases: `git tag v1.0.0`
- Use GitHub releases

## CI/CD Pipeline

Vercel automatically:
- Builds on every push to main
- Creates preview deployments for PRs
- Runs builds on merge

Optional enhancements:
- Add GitHub Actions for tests
- Set up staging environment
- Add code quality checks

## Cost Estimation

### Minimal Production (0-100 users)
- Vercel: Free
- Supabase: Free
- OpenAI: ~$5-20/month
- **Total: $5-20/month**

### Growing (100-1000 users)
- Vercel: $20/month (Pro)
- Supabase: $25/month (Pro)
- OpenAI: ~$50-100/month
- **Total: $95-145/month**

### Scale (1000+ users)
- Vercel: $20-40/month
- Supabase: $25-99/month
- OpenAI: ~$200-500/month
- **Total: $245-639/month**

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **OpenAI Docs**: https://platform.openai.com/docs

## Next Steps

After deployment:
1. Test all features thoroughly
2. Set up error monitoring (Sentry, LogRocket)
3. Add analytics (Google Analytics, Plausible)
4. Create user documentation
5. Plan marketing strategy
6. Consider monetization (Stripe)

---

**Congratulations! Your GitString app is now live! 🎉**
