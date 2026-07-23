# Stripe checkout setup (blocked on secrets)

Bookmarked Premium gates are wired on web and mobile (`useSubscription`, `PremiumFeatureLock`, `canAccessFeature`). Billing is **not live** until the secrets below are configured.

## Required secrets

| Secret | Where | Purpose |
|--------|-------|---------|
| `STRIPE_SECRET_KEY` | Supabase Edge Function / server | Create Checkout Sessions |
| `STRIPE_WEBHOOK_SECRET` | `subscription-webhook` Edge Function | Verify webhook signatures |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Web build env (optional if checkout redirects via Edge Function) | Stripe.js on `/upgrade/` |

Store in Supabase project secrets for Edge Functions. Do **not** commit to the repo.

## Current state

- **Web** (`apps/web/src/app/(app)/upgrade/page.tsx`): informational “Coming soon” — no Checkout redirect
- **Edge Function** (`supabase/functions/subscription-webhook/`): Stripe signature verification + `user_subscriptions` upsert for `checkout.session.completed` and `customer.subscription.*`; manual relay via `x-subscription-webhook-secret` still supported
- **Mobile**: no App Store / Google Play SDK yet

## Webhook events handled (Stripe)

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate Premium when `client_reference_id` is the Supabase user UUID |
| `customer.subscription.created` / `updated` / `deleted` | Sync tier/status from `metadata.user_id` (or `metadata.supabase_user_id`) |

Checkout Sessions must set `client_reference_id` to the user's UUID. Subscriptions should include `metadata.user_id`.

## Manual relay (admin / testing)

```bash
curl -X POST "$SUPABASE_URL/functions/v1/subscription-webhook" \
  -H "Content-Type: application/json" \
  -H "x-subscription-webhook-secret: $SUBSCRIPTION_WEBHOOK_SECRET" \
  -d '{"user_id":"<uuid>","subscription_tier":"premium","subscription_status":"active"}'
```

## Activation checklist

1. Create Stripe product + price (`$4.99/mo` recurring)
2. Add secrets to Supabase (`supabase secrets set …`)
3. Implement Checkout Session creation (Edge Function or static-export-safe client flow)
4. Finish `subscription-webhook`: verify `stripe-signature`, handle `checkout.session.completed` / `customer.subscription.*`
5. Map Stripe `customer_id` → `user_subscriptions` row (service role)
6. Replace upgrade page CTA with live Checkout
7. Test cancel / renew / failed payment paths

## Why Edge Function (not Next.js API)

Web deploys as a **static export** on GitHub Pages — no server runtime for API routes or webhooks. Stripe webhooks must target Supabase Edge Functions (same pattern as ISBNdb search).

## Admin grants (interim)

Until billing is live, grant Premium manually:

```sql
insert into user_subscriptions (user_id, plan, status, source)
values ('<user-uuid>', 'premium', 'active', 'admin_grant')
on conflict (user_id) do update set status = 'active', plan = 'premium', updated_at = now();
```
