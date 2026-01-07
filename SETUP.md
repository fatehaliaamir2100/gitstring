# ⚡ Quick Setup Guide

Get GitString running locally in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase

### Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to initialize (~2 minutes)

### Run Schema
1. Go to SQL Editor in Supabase Dashboard
2. Copy all content from `supabase/schema.sql`
3. Paste and click "Run"

### Get API Keys
1. Go to Settings > API
2. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

## 3. Create GitHub OAuth App

1. Go to GitHub Settings > Developer Settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Name**: GitString Dev
   - **Homepage URL**: `http://localhost:3000`
   - **Callback URL**: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
4. Save and copy Client ID and Secret

## 4. Configure Supabase Auth

1. In Supabase Dashboard > Authentication > Providers
2. Enable GitHub provider
3. Paste your GitHub Client ID and Client Secret
4. Save

## 5. Environment Variables

Create `.env.local` in project root:

```env
# Supabase (from step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# GitHub OAuth (from step 3)
GITHUB_CLIENT_ID=Iv1.xxxxx
GITHUB_CLIENT_SECRET=xxxxx

# GitLab (optional - leave blank for now)
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=

# OpenAI (optional - get from platform.openai.com)
OPENAI_API_KEY=sk-xxxxx

# Local dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 7. Test It Out!

1. Click "Get Started"
2. Sign in with GitHub
3. You should see the dashboard
4. That's it! 🎉

## Common Issues

### "Invalid OAuth callback URL"
- Make sure callback URL in GitHub matches your Supabase URL exactly
- Format: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### "Failed to connect to Supabase"
- Double-check your Supabase URL and keys
- Make sure project is active (not paused)

### "Module not found"
- Run `npm install` again
- Delete `node_modules` and `.next` folder, then reinstall

### OAuth redirects to wrong URL
- Check `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000`
- Clear browser cookies and try again

## Optional: GitLab Setup

If you want GitLab support:

1. Go to GitLab User Settings > Applications
2. Create new application:
   - **Name**: GitString Dev
   - **Redirect URI**: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - **Scopes**: `read_api`, `read_user`, `read_repository`
3. Add Application ID and Secret to `.env.local`
4. Enable GitLab in Supabase Authentication > Providers

## Optional: OpenAI Setup

For AI-powered changelogs:

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account or sign in
3. Go to API Keys
4. Create new key
5. Add to `.env.local` as `OPENAI_API_KEY`
6. Add credits to your OpenAI account ($5-10 is plenty to start)

## What's Next?

- Read the full [README.md](README.md) for more details
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Customize the UI in `app/` folder
- Add features in `lib/` folder

## Development Tips

```bash
# Run in development mode
npm run dev

# Build for production (test before deploying)
npm run build

# Run production build locally
npm run start

# Lint code
npm run lint
```

## Project Structure Quick Reference

```
app/
├── api/              # Backend API routes
├── dashboard/        # Dashboard pages (protected)
├── changelog/        # Changelog viewer
├── login/           # Auth pages
└── page.tsx         # Landing page

lib/
├── supabase/        # Database client
├── gitApi.ts        # GitHub/GitLab integration
├── changelogLogic.ts # Changelog generation
└── openaiHelper.ts  # AI enhancement

supabase/
└── schema.sql       # Database schema
```

## Need Help?

- Check the full [README.md](README.md)
- Review code comments in `lib/` files
- Open an issue on GitHub
- Check Supabase docs: https://supabase.com/docs
- Check Next.js docs: https://nextjs.org/docs

---

Happy coding! 🚀
