# 🚀 GitString - Changelog Generator

A powerful micro-SaaS tool that transforms your Git commits into professional, AI-powered changelogs. Connect GitHub or GitLab repositories and generate beautiful changelogs in seconds.

![GitString Banner](https://img.shields.io/badge/GitString-Changelog%20Generator-blue?style=for-the-badge)

> **🎯 New here?** Start with [GETTING_STARTED.md](GETTING_STARTED.md) for a complete walkthrough!
> 
> **📚 Looking for something specific?** Check the [DOCS_INDEX.md](DOCS_INDEX.md) for a complete documentation map.

## ✨ Features

- 🔗 **Multi-Platform Support** - Connect GitHub and GitLab (including self-hosted)
- 🤖 **Dual AI Support** - Use OpenAI (cloud) or Ollama (local & free) for AI-powered changelogs
- � **User-Controlled AI** - Each user can choose their preferred AI provider from the UI
- �📝 **Multiple Export Formats** - Markdown, HTML, and JSON
- 🏷️ **Flexible Commit Ranges** - Compare tags, branches, or specific commits
- 🔒 **Public & Private** - Share changelogs publicly or keep them private
- 🎨 **Beautiful UI** - Built with Next.js and Tailwind CSS
- ⚡ **Fast & Scalable** - Powered by Supabase and Vercel
- 💰 **Cost Flexible** - Choose between cloud AI (OpenAI) or free local AI (Ollama)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (OAuth) |
| Backend | Next.js API Routes |
| APIs | GitHub API, GitLab API, OpenAI API, Ollama |
| Deployment | Vercel + Supabase |

## 📁 Project Structure

```
.
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── changelog/         # Changelog CRUD operations
│   │   └── repos/             # Repository management
│   ├── dashboard/             # Dashboard pages
│   ├── changelog/             # Changelog viewer
│   ├── login/                 # Login page
│   └── page.tsx               # Landing page
├── lib/
│   ├── supabase/              # Supabase client setup
│   ├── gitApi.ts              # GitHub/GitLab API helpers
│   ├── changelogLogic.ts      # Commit grouping & formatting
│   ├── aiProvider.ts          # AI provider abstraction (OpenAI/Ollama)
│   ├── openaiHelper.ts        # AI enhancement functions
│   └── types.ts               # TypeScript types
├── components/                # Reusable UI components
├── supabase/
│   └── schema.sql             # Database schema
└── public/                    # Static assets
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- A Supabase account (free tier works)
- GitHub/GitLab OAuth apps
- **AI Provider (choose one)**:
  - OpenAI API key (cloud-based, costs apply)
  - Ollama installed locally (free, runs on your machine)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd gitstring
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Enable GitHub and GitLab OAuth in Authentication > Providers
4. Copy your project URL and keys

### 4. Configure OAuth Apps

#### GitHub OAuth App

1. Go to GitHub Settings > Developer Settings > OAuth Apps > New OAuth App
2. Set:
   - **Application name**: GitString
   - **Homepage URL**: `http://localhost:3000` (or your domain)
   - **Authorization callback URL**: `https://<your-project>.supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret

#### GitLab OAuth App

1. Go to GitLab User Settings > Applications > Add new application
2. Set:
   - **Name**: GitString
   - **Redirect URI**: `https://<your-project>.supabase.co/auth/v1/callback`
   - **Scopes**: `read_api`, `read_user`, `read_repository`
3. Copy Application ID and Secret

### 5. Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# GitLab OAuth
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret

# AI Provider (choose 'openai' or 'ollama')
AI_PROVIDER=ollama

# OpenAI (if using AI_PROVIDER=openai)
OPENAI_API_KEY=sk-your_openai_key
OPENAI_MODEL=gpt-4o-mini

# Ollama (if using AI_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> 💡 **See [AI_CONFIGURATION.md](AI_CONFIGURATION.md) for detailed AI setup guide including Ollama installation and model recommendations.**

### 6. Configure Supabase OAuth Providers

In Supabase Dashboard > Authentication > Providers:

1. **GitHub**:
   - Enable GitHub provider
   - Enter your GitHub Client ID and Secret
   - Redirect URL is auto-filled

2. **GitLab**:
   - Enable GitLab provider
   - Enter your GitLab Application ID and Secret
   - Redirect URL is auto-filled

### 7. Run the Development Server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Usage Guide

### 1. Authentication

- Click "Get Started" or "Log In"
- Choose GitHub or GitLab OAuth
- Authorize the application

### 2. Connect Repository

- Go to Dashboard
- Click "Connect Repository"
- Select from your repositories
- The access token is stored securely

### 3. Generate Changelog

- Click "Generate Changelog"
- Select a repository
- Choose commit range (branches/tags)
- Optional: Enable AI enhancement
- Click "Generate Changelog"

### 4. View & Export

- View the generated changelog
- Download as Markdown, HTML, or JSON
- Share publicly (optional)

## 🎯 How It Works

### Conventional Commits Grouping

The app automatically groups commits using conventional commit patterns:

- `feat:` → ✨ Features
- `fix:` → 🐛 Bug Fixes
- `docs:` → 📝 Documentation
- `perf:` → ⚡ Performance
- `refactor:` → ♻️ Refactoring
- `test:` → ✅ Tests
- `build:` → 📦 Build
- `ci:` → 👷 CI/CD
- `chore:` → 🔧 Chores

### AI Enhancement

When AI is enabled, OpenAI analyzes your commits and generates:
- Human-friendly summaries
- Grouped related changes
- Professional release notes
- User-focused language

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

Vercel will automatically:
- Build your Next.js app
- Set up continuous deployment
- Provide a production URL

### Update OAuth Callback URLs

After deployment, update your OAuth apps:

1. **GitHub**: Update Authorization callback URL to `https://<your-project>.supabase.co/auth/v1/callback`
2. **GitLab**: Update Redirect URI to `https://<your-project>.supabase.co/auth/v1/callback`
3. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to your domain

## 🔐 Security Best Practices

- OAuth tokens are stored encrypted in Supabase
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- API routes validate authentication
- Public changelogs require explicit opt-in

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## 📈 Roadmap

- [ ] Webhook integration for auto-generation
- [ ] Custom templates
- [ ] Team collaboration
- [ ] Stripe billing integration
- [ ] Public changelog page widgets
- [ ] Slack/Discord notifications
- [ ] GitLab self-hosted support improvements

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- AI by [OpenAI](https://openai.com/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Email: support@gitstring.com (example)

---

**Built with ❤️ for developers who hate writing changelogs**
