# AI Provider Configuration Guide

GitString supports two AI providers for generating enhanced changelogs:
- **OpenAI** - Cloud-based, requires API key and credits
- **Ollama** - Local, free, and private

## Quick Start

### Option 1: OpenAI (Cloud-based)

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your `.env.local`:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...your-key...
OPENAI_MODEL=gpt-4o-mini  # Optional, default is gpt-4o-mini
```

**Pros:**
- High-quality AI responses
- No local setup required
- Faster generation

**Cons:**
- Costs money per API call
- Requires internet connection
- Data sent to OpenAI servers

### Option 2: Ollama (Local & Free)

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model (e.g., `ollama pull llama3.2`)
3. Add to your `.env.local`:
```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434  # Default, optional
OLLAMA_MODEL=llama3.2  # Or mistral, codellama, etc.
```

**Pros:**
- Completely free
- Runs locally (private)
- No API limits
- Works offline

**Cons:**
- Requires local installation
- Needs decent hardware (8GB+ RAM recommended)
- Slower than cloud-based

## Recommended Ollama Models

### For Changelog Generation

| Model | Size | RAM | Quality | Speed |
|-------|------|-----|---------|-------|
| `llama3.2` | 2GB | 8GB | Good | Fast |
| `llama3.1` | 4.7GB | 16GB | Better | Medium |
| `mistral` | 4.1GB | 8GB | Good | Fast |
| `codellama` | 3.8GB | 8GB | Good for code | Fast |
| `deepseek-coder` | 6.7GB | 16GB | Best for code | Slower |

### Installation & Setup

```bash
# Install Ollama (visit ollama.ai for your platform)

# Pull a model
ollama pull llama3.2

# Verify it's running
ollama list

# Test the model
ollama run llama3.2 "Hello!"
```

### Pull Multiple Models

```bash
# Good all-around model
ollama pull llama3.2

# Better quality, needs more RAM
ollama pull llama3.1

# Specialized for code analysis
ollama pull codellama
```

## Switching Between Providers

You can easily switch between providers by changing the `AI_PROVIDER` variable:

```env
# Use OpenAI
AI_PROVIDER=openai

# Or use Ollama
AI_PROVIDER=ollama
```

The application will automatically use the configured provider without any code changes.

## Configuration Details

### OpenAI Configuration

```env
# Required
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...

# Optional - Model Selection
OPENAI_MODEL=gpt-4o-mini      # Recommended, fast and cheap
# OPENAI_MODEL=gpt-4o          # More expensive, higher quality
# OPENAI_MODEL=gpt-3.5-turbo   # Cheaper, lower quality
```

### Ollama Configuration

```env
# Required
AI_PROVIDER=ollama

# Optional - Endpoint (if running on different host/port)
OLLAMA_BASE_URL=http://localhost:11434

# Optional - Model Selection
OLLAMA_MODEL=llama3.2

# For remote Ollama instance:
# OLLAMA_BASE_URL=http://192.168.1.100:11434
```

## Troubleshooting

### OpenAI Issues

**"Failed to generate AI summary"**
- Check your API key is valid
- Verify you have credits in your OpenAI account
- Check [OpenAI Status](https://status.openai.com/)

**"Rate limit exceeded"**
- You've hit OpenAI's rate limits
- Upgrade your OpenAI plan or wait

### Ollama Issues

**"Ollama API error"**
- Ensure Ollama is running: `ollama serve`
- Check the URL: default is `http://localhost:11434`
- Verify the model is pulled: `ollama list`

**"Connection refused"**
- Start Ollama: `ollama serve`
- Or install from [ollama.ai](https://ollama.ai)

**Slow generation**
- Use a smaller model like `llama3.2`
- Ensure you have enough RAM
- Close other applications

**Out of memory**
- Use a smaller model
- Increase system RAM
- Use `OLLAMA_MODEL=llama3.2` (smallest)

## Performance Comparison

### Speed
- OpenAI: ~5-15 seconds (network dependent)
- Ollama (llama3.2): ~10-30 seconds (hardware dependent)
- Ollama (llama3.1): ~20-60 seconds

### Cost
- OpenAI: $0.15-$0.60 per 1000 tokens (~$0.002-$0.01 per changelog)
- Ollama: $0 (free)

### Quality
- OpenAI (gpt-4o-mini): Excellent
- Ollama (llama3.2): Good
- Ollama (llama3.1): Very Good
- Ollama (deepseek-coder): Excellent for code

## Best Practices

### For Development
```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```
Use Ollama for unlimited testing without costs.

### For Production (Low Volume)
```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1
```
Run on a dedicated server with good specs.

### For Production (High Volume)
```env
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
```
Use OpenAI for reliability and speed at scale.

### For Privacy-Sensitive Projects
```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1
```
Keep all data local with Ollama.

## Fallback Behavior

If AI is requested but unavailable:
1. Check if provider is configured
2. Check if provider is reachable
3. Fall back to rule-based changelog generation
4. Log a warning

The application will never crash due to AI being unavailable - it will gracefully fall back to non-AI generation.

## Architecture

The AI provider system uses an abstraction layer ([lib/aiProvider.ts](lib/aiProvider.ts)) that provides a unified interface:

```typescript
// Automatically uses configured provider
const response = await aiProvider.chatCompletion({
  model: aiProvider.getDefaultModel(),
  messages: [...],
  temperature: 0.7,
  max_tokens: 3000,
})
```

This makes it easy to:
- Switch providers via environment variables
- Add new providers in the future
- Test with different models
- Maintain consistent behavior

## Resources

- [OpenAI Platform](https://platform.openai.com/)
- [OpenAI Pricing](https://openai.com/pricing)
- [Ollama Website](https://ollama.ai)
- [Ollama Models Library](https://ollama.ai/library)
- [Ollama GitHub](https://github.com/ollama/ollama)
