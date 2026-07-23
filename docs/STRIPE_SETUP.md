# Stripe checkout setup

Bookmarked Premium gates are wired on web and mobile (`useSubscription`, `PremiumFeatureLock`, `canAccessFeature`). Web billing uses Supabase Edge Functions for Checkout Session creation and webhook sync.

See also: `docs/PRODUCTION_BILLING.md` for the full production cutover checklist.

## Current Supabase secrets (names only)

| Secret | Status |
|--------|--------|
| `STRIPE_SECRET_KEY` | ✅ Set |
| `STRIPE_PRICE_ID` | ✅ Set |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set |
| `OPENAI_API_KEY` | ❌ Not set (AI insights use rule-based fallback) |
| `SUBSCRIPTION_WEBHOOK_SECRET` | ❌ Not set (optional — manual relay / admin grants) |

> Stripe keys in Supabase are currently **test mode** (`sk_test_…`). Switch to live keys for real charges — see [Production cutover](#production-cutover).

## Required secrets

Set with `./scripts/supabase-cli.sh secrets set KEY=value` (never commit to the repo):

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Create Checkout Sessions (`sk_live_…` for production) |
| `STRIPE_PRICE_ID` | Recurring price ID for Premium (`price_…`, $4.99/mo) |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signatures (`whsec_…`) |
| `SUBSCRIPTION_WEBHOOK_SECRET` | Optional — manual / relay payloads (admin grants) |

Optional web build env (not required for checkout — redirect is server-side):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js if you add embedded elements later |

## Catalog (Bookmarked Premium)

The upgrade page (`/upgrade/`) shows **monthly billing only** — `$4.99 / month`. The Edge Function reads a single `STRIPE_PRICE_ID` (no annual tier in code yet).

| Field | Value |
|-------|-------|
| Product name | `Bookmarked Premium` |
| Description | Advanced analytics, AI reading insights, and early access across web and mobile. |
| Billing | Recurring monthly, USD $4.99 (`499` cents) |
| Product metadata | `app=bookmarked`, `tier=premium`, `plan_code=premium` |
| Price lookup key | `bookmarked_premium_monthly` |
| Price metadata | `app=bookmarked`, `tier=premium`, `interval=monthly` |

### Create catalog (test or live)

```bash
# Test / staging catalog
STRIPE_SECRET_KEY=sk_test_… ./scripts/setup-stripe-catalog.sh

# Production catalog (requires sk_live_…)
STRIPE_SECRET_KEY=sk_live_… ./scripts/setup-stripe-catalog.sh --live
```

The script is idempotent — it reuses existing product/price when names match.

### Staging catalog reference (test mode)

| Resource | ID |
|----------|-----|
| Product | `prod_UwNqts48NMyVEp` |
| Price ($4.99/mo) | `price_1TwV52Jd5wbPvQ1I40HyYPPT` |
| Webhook endpoint | `we_1TwV55Jd5wbPvQ1IqvPcSJqW` → `https://xtdfeorhdlpnbxycpone.supabase.co/functions/v1/subscription-webhook?provider=stripe` |

## Stripe Dashboard setup

1. Create a **Product** — “Bookmarked Premium” (or run `./scripts/setup-stripe-catalog.sh`)
2. Add a **recurring Price** — $4.99/month → copy `price_…` into `STRIPE_PRICE_ID`
3. **Webhook endpoint** — `POST https://xtdfeorhdlpnbxycpone.supabase.co/functions/v1/subscription-webhook?provider=stripe`
4. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`

Set Supabase secrets (never commit values):

```bash
./scripts/supabase-cli.sh secrets set \
  STRIPE_SECRET_KEY=sk_live_… \
  STRIPE_PRICE_ID=price_… \
  STRIPE_WEBHOOK_SECRET=whsec_…
```

## Edge Functions

| Function | Path | Auth |
|----------|------|------|
| `create-checkout-session` | `/functions/v1/create-checkout-session` | `GET` — availability probe (anon key); `POST` — Bearer user JWT |
| `subscription-webhook` | `/functions/v1/subscription-webhook?provider=stripe` | `stripe-signature` header |

Deploy after setting secrets:

```bash
./scripts/supabase-cli.sh functions deploy create-checkout-session
./scripts/supabase-cli.sh functions deploy subscription-webhook
```

Apply migration `20260726140000_stripe_customer_id.sql` so invoice events can resolve users via `stripe_customer_id`.

## Checkout flow (web)

1. User opens `/upgrade/` — page probes `GET /create-checkout-session` for availability
2. User clicks **Subscribe with Stripe**
3. Web calls `POST /create-checkout-session` with the user JWT
4. Edge Function returns `{ url }` → browser redirects to Stripe Checkout
5. On success, Stripe redirects to `/upgrade/?checkout=success`
6. Webhook upserts `user_subscriptions` (tier, status, `stripe_customer_id`)

If `STRIPE_SECRET_KEY` or `STRIPE_PRICE_ID` is missing, the upgrade page shows a fallback message and hides the subscribe button.

When Stripe test keys are active, the upgrade page notes “Stripe test mode — no real charges.”

## Webhook events handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate Premium; store `stripe_customer_id` from session |
| `customer.subscription.created` / `updated` / `deleted` | Sync tier/status from subscription metadata |
| `invoice.paid` / `invoice.payment_succeeded` | Renew Premium (`active`) |
| `invoice.payment_failed` | Mark `past_due` |

Checkout Sessions must set `client_reference_id` to the Supabase user UUID (done by `create-checkout-session`). Subscriptions include `metadata.user_id`.

## Manual relay (admin / testing)

```bash
curl -X POST "$SUPABASE_URL/functions/v1/subscription-webhook" \
  -H "Content-Type: application/json" \
  -H "x-subscription-webhook-secret: $SUBSCRIPTION_WEBHOOK_SECRET" \
  -d '{"user_id":"<uuid>","subscription_tier":"premium","subscription_status":"active"}'
```

## Admin grants (interim)

Grant Premium manually without billing:

```sql
insert into user_subscriptions (user_id, subscription_tier, subscription_status, subscription_provider)
values ('<user-uuid>', 'premium', 'active', 'manual')
on conflict (user_id) do update
  set subscription_tier = 'premium',
      subscription_status = 'active',
      subscription_provider = 'manual',
      updated_at = now();
```

## Why Edge Functions (not Next.js API)

Web deploys as a **static export** on GitHub Pages — no server runtime for API routes or webhooks. Stripe secrets and webhooks use Supabase Edge Functions (same pattern as ISBNdb search and account deletion).

## Mobile

iOS uses App Store subscriptions (`expo-iap`). Android uses the web Stripe link from the upgrade screen. See `docs/APP_STORE_IAP.md`.

## Production cutover

1. Run `./scripts/setup-stripe-catalog.sh --live` with `sk_live_…`
2. Create a **live mode** webhook endpoint in Stripe Dashboard (same URL and events as test)
3. Update Supabase secrets with live `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
4. Redeploy `create-checkout-session` and `subscription-webhook`
5. Complete one real checkout on `/upgrade/` and verify `user_subscriptions`
6. Remove or archive test-mode webhook endpoint when no longer needed

## Activation checklist

- [x] Stripe product + price created (test mode — staging reference above)
- [x] Supabase secrets set (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`) — test mode
- [x] Migration `stripe_customer_id` applied (`20260726140000`)
- [x] `create-checkout-session` Edge Function deployed
- [x] `subscription-webhook` Edge Function deployed
- [x] Webhook endpoint configured in Stripe Dashboard (test mode)
- [x] Web upgrade page probes availability and shows Subscribe CTA when configured
- [ ] End-to-end: complete checkout → verify `user_subscriptions` row
- [ ] **Live mode:** recreate catalog + secrets + webhook with `sk_live_…` (`--live` flag)
