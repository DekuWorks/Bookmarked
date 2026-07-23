# AI Reading Insights

Premium feature (`ai_insights`) that generates personalized reading highlights, patterns, and reflection prompts.

## Architecture

1. **Client** (web + mobile) aggregates reading data locally into a privacy-safe `AiInsightsContext` via `packages/utils/aiInsights.ts` → `buildAiInsightsContext()`.
2. **Edge Function** `supabase/functions/ai-insights` calls OpenAI with JWT auth + Premium subscription check.
3. **Fallback** — if `OPENAI_API_KEY` is missing, the request fails, or the user has no data, clients use rule-based `generateAiInsights()` (same package).

No OpenAI API key is ever exposed to the browser or mobile app.

## Required Supabase secret

```bash
./scripts/supabase-cli.sh secrets set OPENAI_API_KEY=sk-...
```

Optional model override (defaults to `gpt-4o-mini`):

```bash
./scripts/supabase-cli.sh secrets set OPENAI_MODEL=gpt-4o-mini
```

Deploy the function after setting secrets:

```bash
./scripts/supabase-cli.sh functions deploy ai-insights
```

## Local development

Add to your local env (never commit):

```bash
# apps/web/.env.local — not used by the edge function; for documentation only
OPENAI_API_KEY=sk-...
```

Edge functions read secrets from Supabase project secrets, not `.env.local`. For local `supabase functions serve`, pass secrets via `supabase secrets` or a `.env` file in `supabase/.env` (gitignored).

## Security

- `verify_jwt = true` in `supabase/config.toml`
- Function validates `Authorization: Bearer <user JWT>`
- Premium gate: checks `user_subscriptions` for active `premium` tier
- Context sent to OpenAI excludes user ids, emails, and full journal text (notes truncated to 100 chars, max 3)

## Output shape

```json
{
  "source": "openai",
  "insights": {
    "highlights": [{ "id": "...", "title": "...", "body": "...", "emoji": "..." }],
    "patterns": [],
    "prompts": [],
    "hasData": true
  }
}
```

When OpenAI is unavailable, the function returns `{ "source": "fallback", "insights": null }` and clients use rule-based insights.

## UI

- **Web:** Reading Room → Progress tab → `AiInsightsPanel`
- **Mobile:** Reading Room → Progress tab → `ReadingInsightsSection` → `AiInsightsPanel`

Both require Premium (`canAccessFeature("ai_insights")`).

## Tests

```bash
cd apps/web && npm test -- ../../packages/utils/aiInsights.test.ts
```

Covers rule-based generation, context building, and OpenAI response parsing.
