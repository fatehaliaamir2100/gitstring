# Testing Your AI Setup

Quick guide to verify your AI provider is working correctly.

## Quick Test Commands

### Testing Ollama

```bash
# 1. Check Ollama is installed
ollama --version

# 2. Check Ollama is running
ollama list

# 3. Test the model
ollama run llama3.2 "Say hello in one word"

# Expected output: Hello! (or similar)
```

If all three work, Ollama is ready! ✅

### Testing OpenAI

```bash
# Test with curl (replace YOUR_API_KEY)
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"

# Should return a list of models
```

If you see models listed, OpenAI is ready! ✅

## Testing in GitString

### 1. Start the App

```bash
npm run dev
```

### 2. Check Logs

Look for this line in the terminal:

```
AI Provider initialized { provider: 'ollama', ollamaBaseUrl: 'http://localhost:11434' }
```

or

```
AI Provider initialized { provider: 'openai', ollamaBaseUrl: 'http://localhost:11434' }
```

This confirms which provider is active.

### 3. Generate a Test Changelog

1. Log in to GitString
2. Connect a repository
3. Go to "Generate Changelog"
4. **Enable "Use AI Enhancement"**
5. Click "Generate"

### 4. Check for Success

**Successful Generation:**
- You see a professionally formatted changelog
- It has sections with emojis
- Contains insights beyond raw commit messages
- Logs show: `AI changelog generated successfully`

**Failed Generation:**
- Falls back to rule-based (still works, but simpler)
- Error message in terminal
- Logs show error with helpful message

## Troubleshooting

### Ollama Issues

#### Issue: "Connection refused"

**Check if Ollama is running:**
```bash
ollama list
```

**If error, start Ollama:**
```bash
# On Windows/Mac, restart Ollama app
# On Linux:
ollama serve
```

#### Issue: "Model not found"

**Pull the model:**
```bash
ollama pull llama3.2
```

**Verify it's there:**
```bash
ollama list
# Should show llama3.2
```

#### Issue: Very slow or hangs

**Possible causes:**
1. Not enough RAM (need 8GB+)
2. Model is large (try llama3.2 instead of llama3.1)
3. Other apps using resources

**Solutions:**
```env
# Use smaller model
OLLAMA_MODEL=llama3.2

# Close memory-intensive apps
# Ensure 8GB+ RAM available
```

### OpenAI Issues

#### Issue: "Invalid API key"

**Verify your key:**
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new key
3. Copy EXACTLY (starts with `sk-`)
4. Update `.env.local`:
```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

#### Issue: "Rate limit exceeded"

**Check your plan:**
1. Go to [platform.openai.com/usage](https://platform.openai.com/usage)
2. Verify you have credits
3. Check rate limits for your tier

**Solutions:**
- Wait a few minutes
- Upgrade your OpenAI plan
- Switch to Ollama temporarily

#### Issue: "Insufficient credits"

**Add credits:**
1. Go to [platform.openai.com/settings/billing](https://platform.openai.com/settings/billing)
2. Add credits ($5-10 is plenty)
3. Wait a few minutes for activation

### General Issues

#### Issue: Falls back to non-AI changelog

**This is normal if:**
- AI_PROVIDER not set (defaults to OpenAI)
- OpenAI key missing or invalid
- Ollama not running
- Network issues

**The app still works!** It just uses rule-based generation.

**To fix, check:**
1. `.env.local` has correct provider set
2. Provider is properly configured
3. Restart the app after env changes

#### Issue: Environment variables not loading

**Solutions:**
```bash
# 1. Verify .env.local exists
ls -la .env.local

# 2. Check format (no spaces around =)
cat .env.local

# 3. Restart the dev server
# Press Ctrl+C
npm run dev
```

## Verification Checklist

Use this checklist to verify your setup:

### Ollama Setup
- [ ] Ollama installed (`ollama --version`)
- [ ] Model pulled (`ollama list` shows model)
- [ ] Model works (`ollama run llama3.2 "test"`)
- [ ] .env.local has `AI_PROVIDER=ollama`
- [ ] .env.local has correct `OLLAMA_MODEL`
- [ ] App logs show "AI Provider initialized { provider: 'ollama' }"
- [ ] Test changelog generation works

### OpenAI Setup
- [ ] Have OpenAI API key
- [ ] Key is valid (test with curl)
- [ ] Account has credits
- [ ] .env.local has `AI_PROVIDER=openai`
- [ ] .env.local has `OPENAI_API_KEY`
- [ ] App logs show "AI Provider initialized { provider: 'openai' }"
- [ ] Test changelog generation works

## Performance Benchmarks

To see how long AI generation takes:

### Test with Ollama
```bash
# Time a test run
time ollama run llama3.2 "Explain what a changelog is in 50 words"

# Typical times:
# llama3.2: 10-20 seconds
# llama3.1: 20-40 seconds
```

### Expected In GitString

| Provider | Model | Time | Quality |
|----------|-------|------|---------|
| OpenAI | gpt-4o-mini | 5-15s | Excellent |
| Ollama | llama3.2 | 10-30s | Good |
| Ollama | llama3.1 | 20-60s | Very Good |

Times vary based on:
- Number of commits
- Hardware (for Ollama)
- Network speed (for OpenAI)
- Server load

## Success Indicators

You'll know it's working when you see:

### In Terminal Logs
```
AI Provider initialized { provider: 'ollama', ... }
Starting AI changelog generation with diffs { repoName: '...', groupCount: X }
Ollama chat { status: 200, duration: XXXms }
AI changelog generated successfully
```

### In Generated Changelog
- Professional formatting with sections
- Emojis used appropriately (🚀 ✨ 🐛 etc.)
- Summaries beyond just commit messages
- Context about what changed and why
- Executive summary at top

### In Browser
- Changelog looks polished
- Multiple clear sections
- Easy to read and understand
- Professional quality

## Getting Help

If you're still having issues:

1. **Check the logs** - Most issues show helpful errors
2. **Read the docs**:
   - [AI_CONFIGURATION.md](AI_CONFIGURATION.md) - Detailed setup
   - [OLLAMA_QUICKSTART.md](OLLAMA_QUICKSTART.md) - Ollama specific
   - [AI_PROVIDER_COMPARISON.md](AI_PROVIDER_COMPARISON.md) - Feature comparison
3. **Try the other provider** - Easy to switch!
4. **Use rule-based** - AI is optional, rule-based works great too

## Quick Debugging Script

Save this as `test-ai.js`:

```javascript
// test-ai.js
console.log('Environment Check:')
console.log('AI_PROVIDER:', process.env.AI_PROVIDER || 'not set (defaults to openai)')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set ✓' : 'Not set ✗')
console.log('OLLAMA_BASE_URL:', process.env.OLLAMA_BASE_URL || 'http://localhost:11434 (default)')
console.log('OLLAMA_MODEL:', process.env.OLLAMA_MODEL || 'llama3.2 (default)')

if (process.env.AI_PROVIDER === 'ollama' || !process.env.AI_PROVIDER && !process.env.OPENAI_API_KEY) {
  console.log('\n Testing Ollama connection...')
  fetch('http://localhost:11434/api/tags')
    .then(r => r.json())
    .then(d => {
      console.log('✓ Ollama is running')
      console.log('Available models:', d.models.map(m => m.name).join(', '))
    })
    .catch(e => console.log('✗ Ollama not reachable:', e.message))
}
```

Run it:
```bash
node test-ai.js
```

This shows exactly what your environment looks like.
