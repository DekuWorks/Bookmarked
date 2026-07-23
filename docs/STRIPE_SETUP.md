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
- **Edge Function** (`supabase/functions/subscription-webhook/`): stub — needs signature verification + `user_subscriptions` upsert
- **Mobile**: no App Store / Google Play SDK yet

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
