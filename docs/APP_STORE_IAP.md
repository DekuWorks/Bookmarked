# App Store In-App Purchases (iOS)

Bookmarked Premium on iOS uses **App Store subscriptions** (`expo-iap`). Web billing uses **Stripe**. Both write to `public.user_subscriptions`, so Premium unlocks on web and mobile with one account.

## Product

| Field | Value |
|-------|-------|
| Bundle ID | `com.dekuworks.bookmarked` |
| Monthly product ID | `com.dekuworks.bookmarked.premium.monthly` (production) |
| Yearly product ID | `com.dekuworks.bookmarked.premium.yearly` (must exist in App Store Connect) |
| Home monthly | `com.dekuworks.bookmarked.home.monthly` (**must be created** in App Store Connect) |
| Home yearly | `com.dekuworks.bookmarked.home.yearly` (**must be created** in App Store Connect) |
| Sandbox override | `EXPO_PUBLIC_APPLE_PREMIUM_SANDBOX_PRODUCT_ID` (only if separate SKU) |
| Display price | Plus $5.99 / $59.99 · Home $9.99 / $99.99 |
| Env override (mobile) | `EXPO_PUBLIC_APPLE_PREMIUM_PRODUCT_ID` · `EXPO_PUBLIC_APPLE_HOME_PRODUCT_ID` |

## App Store Connect setup

1. Open [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → Bookmarked.
2. **Subscriptions** → create a subscription group (e.g. `Bookmarked Premium`).
3. Add auto-renewable subscription:
   - Reference name: `Premium Monthly`
   - Product ID: `com.dekuworks.bookmarked.premium.monthly`
   - Duration: 1 month
   - Price: $4.99 (USD Tier 5)
4. Add localization (display name + description).
5. Submit the subscription for review with your next app build.
6. **Users and Access** → **Sandbox** → create sandbox testers for TestFlight / local testing.

## Xcode / EAS

- `expo-iap` is listed in `apps/mobile/app.json` plugins.
- Rebuild the native iOS app after changing IAP config (`eas build --platform ios`).
- Update `apps/mobile/store/ios/metadata/review_information/notes.txt` to mention Premium IAP when submitting.

## Client flow (implemented)

| Step | Location |
|------|----------|
| Upgrade screen | `apps/mobile/app/(app)/upgrade.tsx` |
| IAP service | `apps/mobile/src/services/iap.ts` |
| Upgrade actions UI | `apps/mobile/src/components/PremiumUpgradeActions.tsx` |
| Product ID constant | `packages/utils/iap.ts` · `apps/mobile/src/constants/iap.ts` |

- **iOS app:** Subscribe with App Store, or Restore purchases. This is the only place to start a new Plus subscription.
- **Web:** Reads the same `user_subscriptions` row. Locked screens send people to the iOS app — no web checkout.
- **Android app:** Out of scope.
- Apple guidelines: do not offer Stripe checkout inside the native iOS app for digital subscriptions.

## Server verification

Edge Function: `supabase/functions/apple-iap-verify`

```bash
supabase functions deploy apple-iap-verify
```

Secrets (optional):

| Secret | Purpose |
|--------|---------|
| `APPLE_PREMIUM_PRODUCT_IDS` | Comma-separated allowed SKUs. If set, include Home SKUs or Home purchases will be rejected. Default allowlist now includes Plus + Home monthly/yearly. |

The function currently:

1. Authenticates the Supabase user JWT.
2. Validates `product_id` against allowed SKUs.
3. Requires a `purchase_token` (StoreKit JWS).
4. Upserts `user_subscriptions` with `subscription_provider: apple` and tier `plus` or `home` from the product ID.

### Production hardening (manual)

For production, add:

1. **App Store Server API** — verify the JWS (`purchase_token`) with Apple’s public keys.
2. **App Store Server Notifications V2** — webhook to `subscription-webhook?provider=apple` for renewals, cancellations, billing retries.
3. Map `originalTransactionId` → `user_id` via `apple_original_transaction_id` (migration `20260723190000_apple_original_transaction_id.sql`).

Until JWS verification is deployed, TestFlight purchases may return 503 if `purchase_token` is missing.

## Cross-platform Premium

| Provider | Where purchased | Unlocks |
|----------|-----------------|---------|
| `stripe` | Historical web checkout (no new purchases) | Web + mobile gates |
| `apple` | iOS app (only new-purchase path) | Web + mobile gates |
| `manual` | Admin SQL | Web + mobile gates |

Gates: `packages/utils/subscription.ts` → `canAccessFeature('advanced_analytics' | 'ai_insights')`.

## Testing checklist

- [ ] Sandbox purchase on TestFlight → Premium unlocks in Reading Room Progress tab
- [ ] Restore purchases after reinstall
- [ ] iOS IAP → same account shows Premium on bookmarked.online (refresh / reopen)
- [ ] Web `/upgrade/` does not start Stripe Checkout and tells Free users to subscribe on iOS
- [ ] Non-premium users still see `PremiumFeatureLock` on analytics + AI insights

## Related docs

- `docs/STRIPE_SETUP.md` — web billing
- `docs/PRODUCTION_BILLING.md` — production cutover checklist
- `PROJECT_PROGRESS.md` — Phase 4 Premium tracker
