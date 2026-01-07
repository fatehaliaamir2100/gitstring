# 🎉 Dual AI Provider Feature - Quick Overview

GitString now supports **both OpenAI and Ollama** for AI-powered changelog generation!

## What's New?

### Choose Your AI Provider

**Option 1: OpenAI (Cloud)**
- High quality
- Fast
- ~$0.01 per changelog
- Requires API key

**Option 2: Ollama (Local)**
- **FREE** forever
- Private (runs on your machine)
- No API limits
- Requires 8GB+ RAM

## Quick Setup

### Using Ollama (Free!)

```bash
# 1. Install Ollama
# Download from https://ollama.ai

# 2. Pull a model
ollama pull llama3.2

# 3. Configure
echo "AI_PROVIDER=ollama" >> .env.local
echo "OLLAMA_MODEL=llama3.2" >> .env.local

# 4. Done!
npm run dev
```

### Using OpenAI

```bash
# 1. Get API key from platform.openai.com

# 2. Configure
echo "AI_PROVIDER=openai" >> .env.local
echo "OPENAI_API_KEY=sk-your-key" >> .env.local

# 3. Done!
npm run dev
```

## Switching is Easy

Just change `.env.local`:

```env
# Use Ollama
AI_PROVIDER=ollama

# Or use OpenAI
AI_PROVIDER=openai
```

No code changes needed!

## Documentation

📖 **New Docs**:
- [OLLAMA_QUICKSTART.md](OLLAMA_QUICKSTART.md) - 5-minute setup
- [AI_CONFIGURATION.md](AI_CONFIGURATION.md) - Complete guide
- [AI_PROVIDER_COMPARISON.md](AI_PROVIDER_COMPARISON.md) - Help choosing
- [TESTING_AI_SETUP.md](TESTING_AI_SETUP.md) - Verify it works

## What Changed?

✅ New AI provider abstraction layer  
✅ Support for Ollama API  
✅ Environment-based configuration  
✅ Comprehensive documentation  
✅ **Zero breaking changes** - existing setups work as-is  

## Benefits

💰 **Save Money** - Use free local AI  
🔒 **Privacy** - Data stays on your machine  
⚡ **Flexibility** - Switch providers anytime  
📚 **Well Documented** - Complete guides included  

## Try It Now!

1. See [OLLAMA_QUICKSTART.md](OLLAMA_QUICKSTART.md)
2. Install Ollama (5 minutes)
3. Generate changelogs for free!

---

**Questions?** Check [AI_CONFIGURATION.md](AI_CONFIGURATION.md) for details.
