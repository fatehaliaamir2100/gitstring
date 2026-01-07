# Quick Guide: User AI Provider Selection

## What's New?

Users can now choose their AI provider directly in the UI when generating changelogs!

## How to Use

### Step 1: Go to Generate Changelog

Navigate to **Dashboard → Generate Changelog**

### Step 2: Enable AI Enhancement

Check the **"Use AI Enhancement"** checkbox

### Step 3: Choose Your Provider

A new dropdown appears with three options:

```
AI Provider: [Select...]
  ├─ System Default - Use the server configuration
  ├─ OpenAI - Cloud-based, high quality (costs apply)  
  └─ Ollama - Local, free, requires setup
```

### Step 4: Select Your Preference

- **System Default**: Uses whatever the server admin configured (recommended for most users)
- **OpenAI**: Always use OpenAI, even if server default is different
- **Ollama**: Always use Ollama, even if server default is different

### Step 5: Generate

Click **"Generate Changelog"** - your choice is automatically saved!

## When to Use Each Option

### System Default (Recommended)
- ✅ You trust the server configuration
- ✅ You want the admin's recommended setting
- ✅ You don't have a strong preference

### OpenAI
- ✅ You need the highest quality output
- ✅ You don't mind the cost (~$0.01 per changelog)
- ✅ Server has OpenAI configured

### Ollama
- ✅ You want free unlimited AI
- ✅ Server has Ollama installed and running
- ✅ You prefer local/private processing

## Visual Walkthrough

### Before Enabling AI
```
┌──────────────────────────────────────────┐
│ □ Use AI Enhancement                     │
│   Generate human-friendly summaries      │
└──────────────────────────────────────────┘
```

### After Enabling AI
```
┌──────────────────────────────────────────┐
│ ☑ Use AI Enhancement                     │
│   Generate human-friendly summaries      │
│                                          │
│   AI Provider:                           │
│   ┌────────────────────────────────┐    │
│   │ System Default ▼               │    │
│   └────────────────────────────────┘    │
│   📋 Uses server configuration           │
└──────────────────────────────────────────┘
```

### Changing to OpenAI
```
┌──────────────────────────────────────────┐
│ ☑ Use AI Enhancement                     │
│   Generate human-friendly summaries      │
│                                          │
│   AI Provider:                           │
│   ┌────────────────────────────────┐    │
│   │ OpenAI ▼                       │    │
│   └────────────────────────────────┘    │
│   ☁️ Requires OpenAI API key             │
│      configured on server                │
└──────────────────────────────────────────┘
```

### Changing to Ollama
```
┌──────────────────────────────────────────┐
│ ☑ Use AI Enhancement                     │
│   Generate human-friendly summaries      │
│                                          │
│   AI Provider:                           │
│   ┌────────────────────────────────┐    │
│   │ Ollama ▼                       │    │
│   └────────────────────────────────┘    │
│   🏠 Requires Ollama running locally     │
│      on server                           │
└──────────────────────────────────────────┘
```

## Your Choice is Saved

Once you select a provider, it's automatically saved to your user profile. Next time you generate a changelog, your choice is remembered!

## What If My Choice Isn't Available?

If the provider you selected isn't available:
- The system falls back to rule-based generation
- You still get a changelog (just not AI-enhanced)
- A warning is logged
- No errors - it just works!

## Tips

💡 **Start with System Default** - Let the admin choose for you  
💡 **Switch Anytime** - Your preference can be changed at any time  
💡 **Try Both** - Generate a changelog with OpenAI, then try Ollama  
💡 **No Risk** - If AI fails, you always get a rule-based changelog  

## Example Workflow

**Personal Project (Cost-Conscious)**
1. Select **Ollama**
2. Generate unlimited changelogs for free
3. Save money while getting AI benefits

**Client Work (Quality First)**
1. Select **OpenAI**
2. Get highest quality output
3. Professional results every time

**Mixed Usage**
1. Use **Ollama** for internal/testing
2. Switch to **OpenAI** for important releases
3. Balance cost and quality as needed

## Troubleshooting

### Can't See the Dropdown

**Problem**: AI Provider dropdown doesn't appear

**Solution**: 
1. Make sure "Use AI Enhancement" is checked ✓
2. Refresh the page
3. Check browser console for errors

### Selection Not Saving

**Problem**: Dropdown resets after page reload

**Solution**:
1. Check your login session
2. Try logging out and back in
3. Check browser console for API errors

### Provider Unavailable

**Problem**: Selected provider shows warning

**Solution**:
1. Contact server admin
2. Choose a different provider
3. Use System Default
4. Check server configuration

## For Administrators

To enable both providers for your users:

1. Configure both in `.env`:
```env
AI_PROVIDER=openai  # Default
OPENAI_API_KEY=sk-...
OLLAMA_BASE_URL=http://localhost:11434
```

2. Run the migration:
```sql
-- In Supabase SQL Editor
-- Run: supabase/migrations/add-user-ai-preferences.sql
```

3. Restart the app

Users can now choose between providers!

## Learn More

- **[USER_AI_SELECTION.md](USER_AI_SELECTION.md)** - Complete technical documentation
- **[AI_CONFIGURATION.md](AI_CONFIGURATION.md)** - Setting up AI providers
- **[AI_PROVIDER_COMPARISON.md](AI_PROVIDER_COMPARISON.md)** - Comparing OpenAI vs Ollama

---

**Questions?** Check [USER_AI_SELECTION.md](USER_AI_SELECTION.md) for detailed information.
