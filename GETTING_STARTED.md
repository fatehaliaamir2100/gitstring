# 🎯 Getting Started with GitString

Welcome! This guide will get you up and running in just a few minutes.

## 🎬 What You're Building

GitString is a changelog generator that:
- Connects to your GitHub/GitLab repositories
- Fetches commits between releases
- Groups them by type (features, fixes, etc.)
- Generates beautiful changelogs in Markdown, HTML, and JSON
- (Optional) Uses AI to make them more readable

## 📋 Prerequisites

Before you start, make sure you have:

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] A GitHub account (for OAuth and hosting code)
- [ ] 15 minutes of your time ⏰

## 🚀 5-Minute Quick Start

### Step 1: Install Dependencies (1 minute)

```bash
npm install
```

This installs Next.js, Supabase, OpenAI SDK, and other dependencies.

### Step 2: Set Up Supabase (5 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name it "gitstring" (or anything you like)
   - Choose a strong database password
   - Wait ~2 minutes for setup

2. **Run Database Schema**
   - In Supabase Dashboard, go to SQL Editor
   - Open `supabase/schema.sql` in your code editor
   - Copy all the content
   - Paste into Supabase SQL Editor
   - Click "Run" ▶️
   - You should see "Success. No rows returned"

3. **Get API Keys**
   - Go to Settings > API in Supabase
   - Copy these values:
     - Project URL (looks like: `https://xxxxx.supabase.co`)
     - `anon` `public` key (starts with `eyJh...`)
     - `service_role` `secret` key (also starts with `eyJh...`)

### Step 3: Create GitHub OAuth App (3 minutes)

1. Go to [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `GitString Dev`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: 
     ```
     https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
     ```
     ⚠️ Replace `YOUR_SUPABASE_PROJECT_ID` with your actual Supabase project ID
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy it

### Step 4: Configure Supabase Auth (2 minutes)

1. In Supabase Dashboard, go to Authentication > Providers
2. Find "GitHub" and click to expand
3. Toggle "Enable Sign in with GitHub"
4. Paste your GitHub Client ID and Client Secret
5. Click "Save"

### Step 5: Environment Variables (2 minutes)

1. In your project folder, find `.env.local` file
2. Open it and fill in these values:

```env
# From Supabase (Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJh...your-service-role-key...

# From GitHub OAuth (Step 3)
GITHUB_CLIENT_ID=Iv1.xxxxxx
GITHUB_CLIENT_SECRET=xxxxxx

# Leave these for now (optional features)
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
OPENAI_API_KEY=

# This is correct for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Save the file

### Step 6: Verify Setup (1 minute)

Run the verification script:

```bash
npm run verify
```

This checks if everything is configured correctly. Fix any ❌ errors it reports.

### Step 7: Start the App! (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the GitString landing page! 🎉

## 🧪 Test It Out

1. Click "Get Started" or "Log In"
2. Click "Continue with GitHub"
3. Authorize the app
4. You'll be redirected to your dashboard
5. Try connecting a repository!

## ❓ Troubleshooting

### "OAuth callback URL mismatch"

**Problem**: The callback URL in GitHub doesn't match Supabase.

**Solution**: 
1. Check your Supabase project URL in Settings > API
2. Update GitHub OAuth callback to: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
3. Make sure to replace YOUR_PROJECT_ID with your actual project ID

### "Failed to connect to database"

**Problem**: Supabase credentials are incorrect or project is paused.

**Solution**:
1. Verify your Supabase URL and keys in `.env.local`
2. Check if your Supabase project is active (free tier auto-pauses after 1 week of inactivity)
3. Go to your Supabase dashboard and resume the project if needed

### "Module not found" errors

**Problem**: Dependencies not installed properly.

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Port 3000 already in use

**Solution**:
```bash
# Run on a different port
PORT=3001 npm run dev
# Then open http://localhost:3001
```

## 🎓 Next Steps

### Add GitLab Support (Optional)

1. **Create GitLab OAuth App**
   - Go to [GitLab User Settings > Applications](https://gitlab.com/-/profile/applications)
   - Add new application:
     - **Name**: GitString Dev
     - **Redirect URI**: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
     - **Scopes**: Check `read_api`, `read_user`, `read_repository`
   - Copy Application ID and Secret

2. **Enable in Supabase**
   - Go to Authentication > Providers
   - Enable GitLab
   - Paste Application ID and Secret

3. **Update .env.local**
   ```env
   GITLAB_CLIENT_ID=your_app_id
   GITLAB_CLIENT_SECRET=your_secret
   ```

### Add AI Features (Optional)

1. **Get OpenAI API Key**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign up or log in
   - Go to API Keys
   - Create new secret key
   - Add $5-10 credits to your account

2. **Update .env.local**
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Test It**
   - Generate a changelog
   - Check the "Use AI Enhancement" option
   - See AI-powered summaries!

## 📚 Learn More

- **Full Documentation**: [README.md](README.md)
- **Deploy to Production**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **API Reference**: [API.md](API.md)
- **Project Overview**: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## 🛠️ Development Tips

```bash
# Run development server
npm run dev

# Check setup
npm run verify

# Build for production (test before deploying)
npm run build

# Run production build locally
npm run start

# Check for code issues
npm run lint
```

## 🎨 Customize It

### Change Colors

Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    500: '#YOUR_COLOR',
    600: '#YOUR_COLOR',
    // ...
  }
}
```

### Modify Landing Page

Edit `app/page.tsx` - it's all React components!

### Add Features

- Check `lib/` folder for core logic
- Add new API routes in `app/api/`
- Create new pages in `app/`

## 🤝 Need Help?

- Check the [Troubleshooting](#-troubleshooting) section
- Read the full [SETUP.md](SETUP.md)
- Review code comments in the files
- Check Supabase logs in your dashboard
- Check browser console for errors

## 🎉 You Did It!

You now have a fully functional changelog generator! 

**What you can do:**
- ✅ Connect GitHub repositories
- ✅ Generate changelogs from commits
- ✅ Export in multiple formats
- ✅ Share changelogs
- ✅ Deploy to production (see DEPLOYMENT.md)

**Next challenge:** Deploy it to Vercel and share with the world! 🚀

---

**Questions?** Open an issue or check the documentation files.

**Ready to deploy?** See [DEPLOYMENT.md](DEPLOYMENT.md)

Happy coding! 💙
