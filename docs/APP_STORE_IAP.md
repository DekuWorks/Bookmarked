# App Store In-App Purchases (iOS)

Bookmarked Premium on iOS uses **App Store subscriptions** (`expo-iap`). Web billing uses **Stripe**. Both write to `public.user_subscriptions`, so Premium unlocks on web and mobile with one account.

## Product

| Field | Value |
|-------|-------|
| Bundle ID | `com.dekuworks.bookmarked` |
| Subscription product ID | `com.dekuworks.bookmarked.premium.monthly` (production) |
| Sandbox override | `EXPO_PUBLIC_APPLE_PREMIUM_SANDBOX_PRODUCT_ID` (only if separate SKU) |
| Price | $4.99 / month |
| Env override (mobile) | `EXPO_PUBLIC_APPLE_PREMIUM_PRODUCT_ID` |
| Env override (Edge Functions) | `APPLE_BUNDLE_ID`, `APPLE_PREMIUM_PRODUCT_IDS` |

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

- **iOS app:** Subscribe with App Store, Restore purchases, or Subscribe on web (`bookmarked.online/upgrade`).
- **Android app:** Subscribe on web only (Stripe) — Google Play billing can be added later.
- Apple guidelines: do not offer Stripe checkout inside the native iOS app for digital subscriptions.

## Server verification

Edge Function: `supabase/functions/apple-iap-verify`

```bash
supabase functions deploy apple-iap-verify
```

Secrets (optional):

| Secret | Purpose |
|--------|---------|
| `APPLE_BUNDLE_ID` | Expected iOS bundle id; defaults to `com.dekuworks.bookmarked` |
| `APPLE_PREMIUM_PRODUCT_IDS` | Comma-separated allowed SKUs |

The function currently:

1. Authenticates the Supabase user JWT.
2. Validates `product_id` against allowed SKUs.
3. Requires a `purchase_token` (StoreKit JWS).
4. Verifies the JWS ES256 signature and `x5c` certificate chain against Apple Root CA - G3.
5. Validates the JWS bundle ID, product ID, transaction ID, `appAccountToken`, and subscription expiry.
6. Upserts `user_subscriptions` with `subscription_provider: apple`.

### Server Notifications V2

Webhook: `supabase/functions/subscription-webhook?provider=apple`

The webhook verifies the outer App Store Server Notification JWS and the nested
`signedTransactionInfo` JWS before applying renewal, cancellation, refund, and
billing-retry updates. It maps `originalTransactionId` → `user_id` via
`apple_original_transaction_id`.

### Remaining production hardening (optional)

Apple JWS signature + certificate-chain verification is implemented in-repo.
The remaining optional hardening is an App Store Server API transaction lookup
(`GET /inApps/v1/transactions/{transactionId}`) for an additional server-to-server
freshness check. That requires App Store Connect API credentials (`.p8`, key ID,
issuer ID), so it is owner-action rather than repo-only work.

Purchases still return an error if StoreKit does not provide a `purchase_token`,
because Premium is no longer granted from client-supplied transaction metadata alone.

## Cross-platform Premium

| Provider | Where purchased | Unlocks |
|----------|-----------------|---------|
| `stripe` | Web `/upgrade/` | Web + mobile gates |
| `apple` | iOS app | Web + mobile gates |
| `manual` | Admin SQL | Web + mobile gates |

Gates: `packages/utils/subscription.ts` → `canAccessFeature('advanced_analytics' | 'ai_insights')`.

## Testing checklist

- [ ] Sandbox purchase on TestFlight → Premium unlocks in Reading Room Progress tab
- [ ] Restore purchases after reinstall → restored purchase verifies on server
- [ ] Web Stripe checkout → same account shows Premium in iOS app (pull to refresh / reopen)
- [ ] iOS “Subscribe on web” opens Safari checkout and returns to success URL
- [ ] Non-premium users still see `PremiumFeatureLock` on analytics + AI insights

## Related docs

- `docs/STRIPE_SETUP.md` — web billing
- `docs/PRODUCTION_BILLING.md` — production cutover checklist
- `PROJECT_PROGRESS.md` — Phase 4 Premium tracker
