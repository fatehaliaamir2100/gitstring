# Contributing to GitString

First off, thank you for considering contributing to GitString! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:
- Clear descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (browser, OS, etc.)

### Suggesting Features

Feature suggestions are welcome! Please:
- Use a clear descriptive title
- Provide detailed description
- Explain why this would be useful
- Include mockups/examples if possible

### Pull Requests

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Development Setup

See [SETUP.md](SETUP.md) for local development setup.

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes

### React/Next.js

- Use functional components with hooks
- Follow Next.js App Router patterns
- Keep components focused and reusable

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add GitLab self-hosted support
fix: resolve OAuth redirect issue
docs: update deployment guide
```

### Code Style

- Use Prettier for formatting
- Run `npm run lint` before committing
- Keep functions small and focused
- Add comments for complex logic
- Use meaningful variable names

## Testing

While we don't have automated tests yet, please:
- Test your changes locally
- Test in different browsers
- Verify OAuth flows work
- Check mobile responsiveness

## Project Structure

```
app/          # Next.js pages and API routes
lib/          # Core business logic
components/   # Reusable UI components
supabase/     # Database schema and migrations
```

## Questions?

Feel free to open an issue with the `question` label.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community

Thank you for contributing! 🚀
