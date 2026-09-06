# Subscription Architecture

Source of truth for Free / Plus / Home entitlements and billing boundaries.

**Product rule (2026-09-06):** Subscribe **only on iOS** (App Store IAP). Do not add a web checkout, Stripe/web IAP, or “Subscribe on web” for Challenges or other Plus gates being wired. After IAP, `apple-iap-verify` writes `user_subscriptions`; web reads that same row so bookmarked.online unlocks without a second purchase. Web upsell copy sends people to the iOS app. Server `user_has_paid_entitlement` / row checks are mandatory. Upgrade-page **display** prices are $5.99/month and $59.99/year; iOS subscribe buttons still prefer StoreKit `displayPrice`.

## Platforms

- **Web:** Reads `user_subscriptions`. `/upgrade/` and locked Plus actions show iOS-app upsell — no web checkout. Historical Stripe customers can still manage billing via the portal. New purchases are App Store only.
- **iOS:** Apple IAP (StoreKit). Restore purchases + refresh entitlements after purchase/verify. This is the only place to start/pay.
- **Android:** Out of scope.

## Tier model

```ts
type SubscriptionTier = "free" | "plus" | "home";
type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "expired"
  | "grace_period";
```

Canonical limits live in `ENTITLEMENTS` (`packages/utils/subscription.ts`).
Canonical capability keys live in `FeatureKey` (`packages/types/index.ts`).

| Tier | Role |
|---|---|
| `free` | Limited counts; DNA top 3; no advanced insights/AI/Wrapped |
| `plus` | Unlimited counts; full DNA; insights, Wrapped, companion, etc. |
| `home` | Same as Plus + `readingDNAAccess: "advanced"` + Home-only maps/concierge |

## Client vs server trust

1. **UI** may use `useSubscription` + `canAccessFeature` for soft gates.
2. **Create/join mutations** re-read `user_subscriptions` and apply limit helpers — never trust a client-passed tier.
3. **Purchase fulfillment** only via Stripe webhooks / Apple verify + ASN, writing `user_subscriptions` with the **service role**.
4. **RLS:** clients can **SELECT** their subscription / events / counters / entitlement snapshot; they **cannot INSERT/UPDATE** tier or usage.

## Schema

### `user_subscriptions`

Migrations: `20260722120000_user_subscriptions.sql`, `20260801164113_membership_tiers.sql`, **`20260801190000_subscription_billing_foundation.sql`**

| Column | Notes |
|---|---|
| `subscription_tier` | `free` \| `plus` \| `home` |
| `subscription_status` | `inactive` \| `active` \| `trialing` \| `past_due` \| `canceled` \| `expired` \| `grace_period` |
| `subscription_expires_at` | Used by `subscriptionIsActive` (canceled/grace keep access until expiry) |
| Provider ids | `stripe_customer_id`, `apple_original_transaction_id` |

### `subscription_events`

Idempotent log keyed by `(provider, event_id)`. Written by webhooks / IAP verify. Clients select-own only.

### `usage_counters`

`(user_id, counter_key, period_key)` → count. Server-managed; clients select-own only. Used for quote graphics / challenges caps.

### `subscription_entitlements`

Server snapshot after purchase/restore via `refresh_subscription_entitlements(user_id)`. Clients select-own only.

## Access helpers

| Helper | Purpose |
|---|---|
| `subscriptionIsActive` | Paid access incl. grace / past_due / canceled-until-expiry |
| `resolveSubscriptionTier` | Effective tier (inactive/expired → free) |
| `getEntitlements` / `canAccessFeature` | Limits + FeatureKey gates |
| `canCreateCustomShelf` / `canSaveQuote` / … | Count limits |

## Checkout pricing (product brief)

| Plan | Monthly | Yearly | Env secrets |
|---|---|---|---|
| Plus | $5.99 | $59.99 | `STRIPE_PRICE_ID`, `STRIPE_PRICE_ID_YEARLY` |
| Home | $9.99 | $99.99 | Not wired yet |

Run `./scripts/setup-stripe-catalog.sh` to create/reuse prices — **do not invent live Stripe IDs**.

Edge Function `create-checkout-session` accepts `{ interval: "month" | "year" }`.

## Webhook / verify flow

1. Stripe → `subscription-webhook?provider=stripe` (signed) → claim event → upsert → refresh entitlements.
2. Apple ASN → `subscription-webhook?provider=apple` → grace/expired/canceled mapping → upsert.
3. iOS client → `apple-iap-verify` (JWT) → product allowlist → upsert → refresh entitlements.
4. Duplicate `event_id` → `{ ok: true, duplicate: true }` (idempotent).

## Plus product decisions (2026-09-06)

See `feature-entitlements.md`. Short version: Plus custom shelves unlimited; reread + character ratings share 5-star half-star; poll multi-select is opt-in; analytics owner/host only; no advanced-goal simultaneous cap; show fair-use copy for unlimited graphics; keep reading vs listening time separate.

## Downgrade

- Preserve shelves, quotes, club memberships, challenges, DNA history.
- Block **new** creation beyond Free limits.
- Do not delete over-limit data.

## Related docs

- [`FEATURE_GATING_MATRIX.md`](./FEATURE_GATING_MATRIX.md)
- [`STRIPE_SETUP.md`](./STRIPE_SETUP.md)
- [`APP_STORE_IAP.md`](./APP_STORE_IAP.md)
