# Quick Start: Using Ollama with GitString

This guide will get you up and running with free, local AI using Ollama in under 5 minutes.

## What is Ollama?

Ollama lets you run powerful AI models locally on your machine - completely free, private, and without API limits.

## Installation

### Windows

1. Download from [ollama.ai/download](https://ollama.ai/download)
2. Run the installer
3. Ollama starts automatically as a service

### macOS

```bash
# Using Homebrew
brew install ollama

# Or download from ollama.ai
```

### Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## Quick Setup (2 minutes)

### 1. Pull a Model

```bash
# Recommended: Fast and good quality (2GB)
ollama pull llama3.2

# Or try other models:
ollama pull mistral        # Alternative, also good (4GB)
ollama pull codellama      # Specialized for code (4GB)
ollama pull llama3.1       # Larger, better quality (5GB)
```

### 2. Verify It Works

```bash
# Check Ollama is running
ollama list

# Quick test
ollama run llama3.2 "Hello!"
```

You should see the model respond. Press Ctrl+D to exit.

### 3. Configure GitString

Add to your `.env.local`:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### 4. Start Your App

```bash
npm run dev
```

That's it! GitString will now use Ollama for AI-generated changelogs - **completely free**! 🎉

## Testing

Generate a changelog and enable AI enhancement. You should see:
- Ollama model processes your commits
- Professional changelog generated
- All happening on your local machine
- Zero API costs

## Common Issues

### "Connection refused"

**Solution**: Start Ollama manually:
```bash
ollama serve
```

On Windows/Mac, Ollama usually runs as a service automatically.

### "Model not found"

**Solution**: Pull the model first:
```bash
ollama pull llama3.2
```

### Slow Generation

**Solutions**:
1. Use a smaller model: `OLLAMA_MODEL=llama3.2`
2. Close memory-intensive apps
3. Ensure you have 8GB+ RAM available

### Out of Memory

**Solution**: Use the smallest model:
```env
OLLAMA_MODEL=llama3.2
```

llama3.2 only needs ~4GB RAM to run.

## Model Recommendations

| Use Case | Model | Size | RAM Needed |
|----------|-------|------|------------|
| **Best for most users** | `llama3.2` | 2GB | 8GB |
| Better quality | `llama3.1` | 5GB | 16GB |
| Code-focused | `codellama` | 4GB | 8GB |
| Alternative | `mistral` | 4GB | 8GB |
| Best quality | `deepseek-coder` | 7GB | 16GB |

## Switching to OpenAI Later

Want to switch back to OpenAI? Just change your `.env.local`:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
```

No code changes needed!

## Advantages of Ollama

✅ **Free** - No API costs, ever  
✅ **Private** - Your code never leaves your machine  
✅ **Unlimited** - No rate limits or quotas  
✅ **Offline** - Works without internet  
✅ **Fast** - No network latency  

## When to Use OpenAI Instead

Consider OpenAI if you:
- Don't want to manage local setup
- Need the absolute best quality
- Are running in a serverless environment (Vercel, etc.)
- Don't have 8GB+ RAM available

## Performance

Typical changelog generation times:

| Model | Time | Quality |
|-------|------|---------|
| OpenAI (gpt-4o-mini) | 5-10s | Excellent |
| Ollama (llama3.2) | 10-20s | Good |
| Ollama (llama3.1) | 20-40s | Very Good |

Times vary based on hardware. Modern CPUs work fine, GPU helps but isn't required.

## Resources

- [Ollama Website](https://ollama.ai)
- [Ollama Models Library](https://ollama.ai/library)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [Full AI Configuration Guide](AI_CONFIGURATION.md)

## Support

Having issues? Check:
1. Is Ollama running? `ollama list`
2. Is the model pulled? `ollama list` should show your model
3. Try manually: `ollama run llama3.2 "test"`
4. Check logs in terminal where you ran `npm run dev`

For more help, see [AI_CONFIGURATION.md](AI_CONFIGURATION.md) for detailed troubleshooting.
