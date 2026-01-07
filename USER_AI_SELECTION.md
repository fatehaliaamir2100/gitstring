# User-Controlled AI Provider Selection

## Overview

Users can now choose their preferred AI provider directly from the UI when generating changelogs. This gives users control over which AI service is used without requiring server configuration changes.

## Features

- **User Preferences**: Each user can set their own AI provider preference
- **Three Options**: 
  - **System Default**: Uses the server's configured provider
  - **OpenAI**: Force use of OpenAI (cloud-based)
  - **Ollama**: Force use of Ollama (local)
- **Persistent Settings**: Preferences are saved and remembered for future changelog generations
- **Graceful Fallback**: If a selected provider is unavailable, falls back to rule-based generation

## How It Works

### User Flow

1. User goes to **Generate Changelog** page
2. Enables "Use AI Enhancement" checkbox
3. **AI Provider dropdown appears** with three options
4. User selects their preferred provider
5. Choice is automatically saved to their profile
6. Future changelog generations use this preference

### Technical Flow

```
User selects AI provider in UI
         ↓
Frontend saves to /api/user/preferences
         ↓
Preference stored in database (users.ai_provider)
         ↓
When generating changelog:
         ↓
Backend fetches user preference
         ↓
Uses user's choice (or system default if "default")
         ↓
Generates changelog with chosen provider
```

## Database Schema

Added columns to `users` table:

```sql
ai_provider TEXT CHECK (ai_provider IN ('openai', 'ollama', 'default')) DEFAULT 'default'
ai_model TEXT  -- Optional specific model
preferences JSONB DEFAULT '{}'::jsonb  -- For future settings
```

## API Endpoints

### GET /api/user/preferences

Get current user's AI preferences.

**Response:**
```json
{
  "ai_provider": "ollama",
  "ai_model": "llama3.2",
  "preferences": {}
}
```

### PUT /api/user/preferences

Update user's AI preferences.

**Request:**
```json
{
  "ai_provider": "openai",
  "ai_model": "gpt-4o-mini"
}
```

**Response:**
```json
{
  "success": true,
  "ai_provider": "openai",
  "ai_model": "gpt-4o-mini"
}
```

## Code Changes

### New Files

1. **`supabase/migrations/add-user-ai-preferences.sql`**
   - Database migration to add AI preference columns

2. **`app/api/user/preferences/route.ts`**
   - API endpoints for getting/updating preferences

3. **`lib/userAiPreferences.ts`**
   - Helper functions to fetch and apply user preferences

### Modified Files

1. **`lib/aiProvider.ts`**
   - Added `overrideProvider` parameter to `chatCompletion()`
   - Added `getDefaultModel(provider)` to support provider-specific models
   - Added `isProviderAvailable(provider)` to check specific providers
   - Added `getAvailableProviders()` to list all options

2. **`lib/openaiHelper.ts`**
   - Added `provider` and `model` parameters to `generateAiSummaryWithDiffs()`
   - Uses provided provider/model instead of global default

3. **`app/api/changelog/generate/route.ts`**
   - Imports `getUserAiProvider()` helper
   - Fetches user preferences before generating
   - Passes user's provider/model to AI functions

4. **`app/dashboard/generate/GenerateChangelogClient.tsx`**
   - Added state for `aiProvider` selection
   - Fetches user preferences on mount
   - Displays AI provider dropdown when AI is enabled
   - Auto-saves provider selection changes
   - Shows helpful hints for each option

## User Interface

### Before (Simple)
```
☐ Use AI Enhancement
  Generate human-friendly summaries using OpenAI (requires API key)
```

### After (With Choice)
```
☑ Use AI Enhancement
  Generate human-friendly summaries and insights
  
  AI Provider: [System Default ▼]
               System Default - Use the server configuration
               OpenAI - Cloud-based, high quality (costs apply)
               Ollama - Local, free, requires setup
  
  📋 Uses server configuration (check .env settings)
```

When user selects different provider, the hint text changes:
- **System Default**: 📋 Uses server configuration (check .env settings)
- **OpenAI**: ☁️ Requires OpenAI API key configured on server
- **Ollama**: 🏠 Requires Ollama running locally on server

## Priority Order

The system determines AI provider in this order:

1. **User Preference** (if not 'default')
   - Direct choice from UI
   
2. **System Default** (if user chose 'default')
   - From `AI_PROVIDER` env variable
   
3. **Fallback** (if provider unavailable)
   - Rule-based changelog (no AI)

## Benefits

### For Users
- ✅ **Control**: Choose which AI to use per their needs
- ✅ **Flexibility**: Switch between providers easily
- ✅ **Cost Control**: Use free Ollama when possible, OpenAI when needed
- ✅ **Privacy**: Choose local Ollama for sensitive projects

### For Admins
- ✅ **User Empowerment**: Users can choose based on their setup
- ✅ **Cost Distribution**: Users can opt for free options
- ✅ **Flexibility**: Support multiple deployment scenarios
- ✅ **No Server Changes**: Users switch without redeployment

## Example Use Cases

### Use Case 1: Cost-Conscious Developer
- Admin configures both OpenAI and Ollama
- Developer sets preference to **Ollama**
- Gets free AI changelogs forever
- Can switch to OpenAI for important releases

### Use Case 2: Team with Mixed Needs
- Some users want **OpenAI** quality
- Others prefer **Ollama** privacy
- Each user sets their own preference
- Everyone gets what they want

### Use Case 3: Development vs Production
- Set **Ollama** during development (free testing)
- Switch to **OpenAI** for production releases (best quality)
- Easy toggle, no code changes

## Migration Steps

For existing installations:

1. **Run Database Migration**
   ```sql
   -- In Supabase SQL Editor
   -- Run: supabase/migrations/add-user-ai-preferences.sql
   ```

2. **No Code Changes Needed**
   - Existing users default to 'default' (system setting)
   - Backward compatible with current setup

3. **Users Can Now Choose**
   - Visit Generate Changelog page
   - Enable AI enhancement
   - See provider dropdown
   - Select preference

## Configuration Examples

### Server Configuration (Admin)

**.env** file sets what's available:
```env
# Make both providers available
AI_PROVIDER=openai  # Default for new users
OPENAI_API_KEY=sk-...
OLLAMA_BASE_URL=http://localhost:11434
```

### User Choice (UI)

User selects in dashboard:
- **System Default** → Uses OpenAI (from server config)
- **OpenAI** → Always uses OpenAI
- **Ollama** → Always uses Ollama

## Testing

### Test User Preference Flow

1. Generate changelog with default settings
2. Change AI provider in UI
3. Generate another changelog
4. Verify correct provider was used in logs
5. Refresh page, verify preference persists

### Test Fallback

1. Set user preference to Ollama
2. Stop Ollama service
3. Generate changelog
4. Should fall back to rule-based (no error)
5. Logs should show fallback message

### Test API

```bash
# Get current preferences
curl http://localhost:3000/api/user/preferences

# Update preference
curl -X PUT http://localhost:3000/api/user/preferences \
  -H "Content-Type: application/json" \
  -d '{"ai_provider":"ollama"}'
```

## Future Enhancements

Possible additions:
- [ ] Model selection dropdown (choose specific model)
- [ ] Provider health status indicator in UI
- [ ] Usage statistics per provider
- [ ] A/B testing between providers
- [ ] Team-wide default preferences
- [ ] Provider-specific settings (temperature, etc.)
- [ ] Fallback chain (try OpenAI, then Ollama)

## Troubleshooting

### Preference Not Saving

**Symptom**: Dropdown resets on page refresh

**Solution**: 
- Check browser console for API errors
- Verify database migration ran successfully
- Check user has permission to update own row

### Provider Not Available

**Symptom**: Selected provider falls back to rule-based

**Solution**:
- Verify server has provider configured (.env)
- Check provider service is running (Ollama)
- Check API keys are valid (OpenAI)
- Review server logs for specific error

### UI Not Showing Dropdown

**Symptom**: Can't see AI provider options

**Solution**:
- Ensure "Use AI Enhancement" is checked
- Check browser console for JavaScript errors
- Verify API endpoint is accessible
- Clear browser cache and reload

## Summary

This feature gives users direct control over AI provider selection through an intuitive UI, while maintaining backward compatibility and graceful fallbacks. Users can optimize for cost (Ollama), quality (OpenAI), or follow system defaults, all without requiring server configuration changes or redeployment.
