# Stripe checkout setup

Bookmarked Premium gates are wired on web and mobile (`useSubscription`, `PremiumFeatureLock`, `canAccessFeature`). Web billing uses a Supabase Edge Function for Checkout Session creation and webhook sync.

## Required secrets (Supabase project)

Set with `supabase secrets set KEY=value` (never commit to the repo):

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Create Checkout Sessions (`sk_live_…` or `sk_test_…`) |
| `STRIPE_PRICE_ID` | Recurring price ID for Premium (`price_…`, e.g. $4.99/mo) |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signatures (`whsec_…`) |
| `SUBSCRIPTION_WEBHOOK_SECRET` | Manual / relay payloads (admin grants, testing) |

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

### Test mode catalog (created 2026-07-23)

| Resource | ID |
|----------|-----|
| Product | `prod_UwNqts48NMyVEp` |
| Price ($4.99/mo) | `price_1TwV52Jd5wbPvQ1I40HyYPPT` |
| Webhook endpoint | `we_1TwV55Jd5wbPvQ1IqvPcSJqW` → `https://xtdfeorhdlpnbxycpone.supabase.co/functions/v1/subscription-webhook?provider=stripe` |

Re-run catalog setup (idempotent — reuses existing product/price when names match):

```bash
STRIPE_SECRET_KEY=sk_test_… ./scripts/setup-stripe-catalog.sh
```

For **live mode**, repeat with `sk_live_…` (new product/price IDs — update secrets and webhook separately).

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
  STRIPE_SECRET_KEY=sk_test_… \
  STRIPE_PRICE_ID=price_… \
  STRIPE_WEBHOOK_SECRET=whsec_…
```

## Edge Functions

| Function | Path | Auth |
|----------|------|------|
| `create-checkout-session` | `/functions/v1/create-checkout-session` | Bearer JWT (signed-in user) |
| `subscription-webhook` | `/functions/v1/subscription-webhook?provider=stripe` | `stripe-signature` header |

Deploy after setting secrets:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy subscription-webhook
```

Apply migration `20260723140000_stripe_customer_id.sql` so invoice events can resolve users via `stripe_customer_id`.

## Checkout flow (web)

1. User opens `/upgrade/` and clicks **Subscribe with Stripe**
2. Web calls `create-checkout-session` with the user JWT
3. Edge Function returns `{ url }` → browser redirects to Stripe Checkout
4. On success, Stripe redirects to `/upgrade/?checkout=success`
5. Webhook upserts `user_subscriptions` (tier, status, `stripe_customer_id`)

If `STRIPE_SECRET_KEY` or `STRIPE_PRICE_ID` is missing, the Edge Function returns **503** and the upgrade page shows the “Coming soon” fallback.

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

Until billing is live, grant Premium manually:

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

App Store / Google Play IAP is not wired yet. Mobile upgrade screen remains informational until store SDK + receipt validation ship.

## Activation checklist

- [x] Stripe product + price created (test mode — see catalog table above)
- [x] Supabase secrets set (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`) — test mode
- [x] Migration `stripe_customer_id` applied (`20260726140000`)
- [x] `create-checkout-session` Edge Function deployed
- [x] `subscription-webhook` Edge Function deployed
- [x] Webhook endpoint configured in Stripe Dashboard (test mode)
- [x] Test checkout (test mode) → `create-checkout-session` returns Stripe Checkout URL (HTTP 200)
- [ ] End-to-end: complete test checkout → verify `user_subscriptions` row
- [ ] Test cancel / failed payment paths
- [ ] Live mode: recreate catalog + secrets + webhook with `sk_live_…`
