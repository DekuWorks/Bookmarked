# Production billing checklist

What is wired in code vs what still needs owner action (secrets, App Store approval, deploy).

## Already wired

| Surface | Implementation |
|---------|----------------|
| Web Stripe checkout | `/upgrade/` → `create-checkout-session` → Stripe Checkout → `subscription-webhook` |
| iOS App Store IAP | `PremiumUpgradeActions` → `apple-iap-verify` → `user_subscriptions` |
| Premium gates | `canAccessFeature('advanced_analytics' \| 'ai_insights')` on web + mobile |
| Shared product IDs | `packages/utils/iap.ts` — production + sandbox constants |
| Stripe catalog script | `scripts/setup-stripe-catalog.sh` — pass `--live` for production |

## Supabase secrets status

| Secret | Required for | Status |
|--------|--------------|--------|
| `STRIPE_SECRET_KEY` | Web checkout | ✅ Set (test mode) |
| `STRIPE_PRICE_ID` | Web checkout | ✅ Set |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks | ✅ Set |
| `OPENAI_API_KEY` | AI insights (OpenAI path) | ❌ **You must set** — clients fall back to rule-based insights |
| `OPENAI_MODEL` | AI model override | Optional |
| `APPLE_PREMIUM_PRODUCT_IDS` | IAP server allowlist | Optional (defaults to production SKU) |
| `SUBSCRIPTION_WEBHOOK_SECRET` | Manual subscription relay | Optional |

List secrets (names only):

```bash
./scripts/supabase-cli.sh secrets list
```

## Owner action: Stripe live mode

1. Enable Stripe live mode in [Stripe Dashboard](https://dashboard.stripe.com).
2. Create production catalog:
   ```bash
   STRIPE_SECRET_KEY=sk_live_… ./scripts/setup-stripe-catalog.sh --live
   ```
3. Add **live** webhook → `https://xtdfeorhdlpnbxycpone.supabase.co/functions/v1/subscription-webhook?provider=stripe`
4. Set live secrets:
   ```bash
   ./scripts/supabase-cli.sh secrets set \
     STRIPE_SECRET_KEY=sk_live_… \
     STRIPE_PRICE_ID=price_… \
     STRIPE_WEBHOOK_SECRET=whsec_…
   ```
5. Deploy functions:
   ```bash
   ./scripts/supabase-cli.sh functions deploy create-checkout-session
   ./scripts/supabase-cli.sh functions deploy subscription-webhook
   ```
6. Complete a real $4.99 checkout on https://bookmarked.online/upgrade/

Details: `docs/STRIPE_SETUP.md`

## Owner action: App Store production IAP

1. App Store Connect → **Subscriptions** → `com.dekuworks.bookmarked.premium.monthly` at $4.99/mo
2. Submit subscription for review with your next app build
3. Production EAS build (`eas build --profile production`)
4. TestFlight sandbox purchase → verify Premium unlocks
5. After App Review approval, production purchases use the same product ID

Optional env overrides (`apps/mobile/.env` / EAS secrets):

- `EXPO_PUBLIC_APPLE_PREMIUM_PRODUCT_ID` — production SKU
- `EXPO_PUBLIC_APPLE_PREMIUM_SANDBOX_PRODUCT_ID` — only if you created a separate sandbox SKU
- `EXPO_PUBLIC_APPLE_IAP_USE_SANDBOX=1` — dev client builds using sandbox SKU

Details: `docs/APP_STORE_IAP.md`

## Owner action: OpenAI (AI insights)

```bash
./scripts/supabase-cli.sh secrets set OPENAI_API_KEY=sk-...
./scripts/supabase-cli.sh functions deploy ai-insights
```

Without this secret, Premium users still see insights via the rule-based fallback in `packages/utils/aiInsights.ts`.

Details: `docs/AI_INSIGHTS.md`

## Removed test / placeholder UI

- Web `/upgrade/` no longer shows “Coming soon” or “Billing is almost ready” when Stripe secrets are configured
- Subscribe CTA appears after availability probe; test-mode Stripe shows a small footnote only
- Mobile upgrade screen uses production IAP product ID by default (`PremiumUpgradeActions`)

## Demo accounts (unchanged)

App Review demo credentials in `apps/mobile/store/ios/REVIEW_DEMO_SCRIPT.md` are for moderation flows only — not billing test programs.
