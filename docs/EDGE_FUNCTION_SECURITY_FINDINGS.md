# Edge Function Security Findings

> Review date: 2026-11-18  
> Scope: `supabase/functions/**`, client callers (web + mobile), hardcoded secrets grep  
> Branch: `cursor/vulnerability-findings-persistence-e60d`  
> Rule: this document never records secret **values** — only file/line references and variable names.

## Reachability model

Supabase Edge Functions are callable at `{NEXT_PUBLIC_SUPABASE_URL}/functions/v1/<name>` with the public `anon` key (`apikey` + optional Bearer). Clients embed that key (`apps/web`, `apps/mobile`). Gateway `verify_jwt = true` accepts **any** valid Supabase JWT, including the public anon key, unless the function also calls `auth.getUser()` on a user access token.

| Function | Gateway JWT (`config.toml`) | App-level auth | Client entrypoints |
|----------|----------------------------|----------------|--------------------|
| `apple-iap-verify` | default (true) | User JWT via `getUser` | `apps/mobile/src/services/iap.ts` |
| `subscription-webhook` | not overridden | Stripe HMAC / Apple none / manual secret | Provider webhooks (docs) |
| `create-checkout-session` | default | User JWT on POST; GET unauthenticated config | `apps/web/src/lib/services/stripeCheckout.ts` |
| `create-billing-portal-session` | default | User JWT | web + mobile `stripePortal.ts` |
| `share-preview` | **`verify_jwt = false`** | None | `apps/web/src/lib/seo/sharePreview.ts` |
| `isbndb` | `verify_jwt = true` | **None** (anon Bearer OK) | web + mobile `isbndb.ts` |
| `ai-insights` / `ai-reading-companion` / `quote-scanner` / `moderate-ugc` | default / true | User JWT (+ Plus checks where noted) | matching `*Insights` / `*Companion` / `quoteScanner` / `moderateUgc` services |
| `rate-limit-stub` | default | Shared secret header | Not wired to production routes |

---

## Validated findings

### 1. Critical — Apple IAP verify trusts forged JWS / client `expires_at`

- **Location:** `supabase/functions/apple-iap-verify/index.ts`
- **Description:** After JWT auth and product-id allowlist, the function requires a `purchase_token` but only **base64-decodes** the JWS payload (`decodeJwsPayload`). It never verifies Apple’s certificate chain or App Store Server API. Client-supplied `expires_at` is preferred over the decoded token. Service role then upserts `user_subscriptions` to Plus/Home `active`.
- **Impact:** Any signed-in attacker can grant themselves paid entitlement without an App Store purchase.
- **Attack path:**
  1. Create/sign in with a normal account (public anon key + signup).
  2. `POST /functions/v1/apple-iap-verify` with Bearer user JWT, allowlisted `product_id`, arbitrary `transaction_id`, any non-empty `purchase_token`, and far-future `expires_at`.
  3. Response includes `ok: true`, `verified: false`; DB row is still written as active Plus/Home.
- **Evidence:**
  - `decodeJwsPayload` decode-only: lines 65–77
  - Client `expires_at` trusted: line 168–169
  - Service-role upsert: lines 171–210
  - Explicit `verified: false` hint: lines 230–231
  - Docs acknowledge missing verification: `docs/APP_STORE_IAP.md` (~lines 72–80)
  - Client calls the endpoint: `apps/mobile/src/services/iap.ts` (~40–54)
- **Remediation:** Verify StoreKit JWS with Apple root CAs / App Store Server API before any write. Ignore client `expires_at`; take expiry only from verified transaction info. Keep `verified: false` responses from mutating entitlements.
- **Exploitability:** High — needs only a normal user session; no Apple credentials.

### 2. Critical — Apple ASN webhook does not verify JWS signatures

- **Location:** `supabase/functions/subscription-webhook/index.ts` — `handleAppleServerNotification`
- **Description:** `?provider=apple` parses `signedPayload` and nested `signedTransactionInfo` via the same decode-only helper. No certificate/`x5c` verification, shared secret, or Apple JWT check. Matching `apple_original_transaction_id` updates that user’s subscription via service role.
- **Impact:** Forged ASN can activate, grace, expire, or revoke Plus for any user whose `apple_original_transaction_id` is known or previously planted (including via finding #1).
- **Attack path:**
  1. Ensure target has `apple_original_transaction_id` set (legitimate purchase or forged verify).
  2. `POST /functions/v1/subscription-webhook?provider=apple` with fabricated `signedPayload` / transaction JWS bodies (unsigned or self-signed segments that still base64-decode).
  3. Handler upserts tier/status from forged `notificationType`.
- **Evidence:**
  - Route: lines 427–428
  - `decodeJwsPayload` only: lines 478–490, 611–614
  - Nested transaction decode: lines 505–509
  - Upsert after OTI lookup: lines 625–650
  - **Contrast:** Stripe path verifies HMAC (`verifyStripeSignature`, lines 102–124, 393–396)
- **Remediation:** Verify ASN V2 JWS with Apple’s certs before trust. Reject on verify failure. Prefer App Store Server API transaction lookup as a second check.
- **Exploitability:** High when the function is reachable without gateway user JWT (required for real Apple delivery). Combined with #1, OTI planting is trivial.

### 3. High — Stripe Checkout `success_url` / `cancel_url` attacker-controlled

- **Location:** `supabase/functions/create-checkout-session/index.ts`
- **Description:** Authenticated POST accepts `success_url` and `cancel_url` from JSON and forwards them unchanged to Stripe Checkout. No allowlist to `bookmarked.online` (or other owned origins).
- **Impact:** Open redirect after payment / cancel — phishing, token/session theft on attacker-controlled landing pages, brand abuse.
- **Attack path:**
  1. Sign in; `POST` with `success_url` / `cancel_url` pointing at attacker origin.
  2. Complete or abandon Checkout; Stripe redirects the browser to the attacker URL.
- **Evidence:**
  - Body fields: lines 174–185
  - Assignment without validation: lines 199–200
  - Passed to Stripe: lines 46–47, 209–217
  - Client normally omits custom URLs (`apps/web/src/lib/services/stripeCheckout.ts`) but the API still accepts them.
- **Remediation:** Allowlist origins/paths (e.g. only `https://bookmarked.online/...`). Ignore or reject absolute URLs outside the allowlist.
- **Exploitability:** Medium–High — requires attacker account + victim completing Checkout on attacker-generated session (social engineering) or self-use for phishing kits.

### 4. High — Billing portal `return_url` attacker-controlled

- **Location:** `supabase/functions/create-billing-portal-session/index.ts`
- **Description:** Same pattern: `return_url` from body is passed to Stripe Billing Portal with no host allowlist.
- **Impact:** Open redirect after portal session (subscription management).
- **Attack path:** Authenticated user with `stripe_customer_id` POSTs attacker `return_url`; after portal, Stripe returns browser to attacker site.
- **Evidence:**
  - Payload parse: lines 108–117
  - `returnUrl` unbound: line 117
  - Stripe call: lines 146–149
  - Clients send `return_url`: `apps/web/src/lib/services/stripePortal.ts` (~31–38), `apps/mobile/src/services/stripePortal.ts` (~19–26)
- **Remediation:** Same allowlist as Checkout URLs.
- **Exploitability:** Medium — needs an account that already has Stripe customer mapping.

### 5. High — `share-preview` SSRF via `cover` query parameter

- **Location:** `supabase/functions/share-preview/index.ts`
- **Description:** Public GET (`verify_jwt = false`) takes `cover` and `fetch`es it server-side with no allowlist, scheme check, or size cap beyond image decode failure.
- **Impact:** Server-side request forgery against internal/metadata URLs; bandwidth/CPU DoS via large images; redirect-following fetch may widen reach. Non-image responses are not fully reflected, but status/timing and successful image composites still leak signal.
- **Attack path:**
  1. `GET /functions/v1/share-preview?cover=http://127.0.0.1:...` or cloud metadata / attacker URL (anon key optional given `verify_jwt = false`).
  2. Function fetches attacker-chosen URL from the edge runtime network.
- **Evidence:**
  - `verify_jwt = false`: `supabase/config.toml` lines 366–368
  - Unvalidated `cover`: lines 49–58
  - `loadImage` → `fetch(url)`: lines 21–29
  - Client builds URL: `apps/web/src/lib/seo/sharePreview.ts` line 13
- **Remediation:** Allowlist cover hosts (e.g. `images.isbndb.com`, project storage). Block private/link-local IPs and non-HTTPS. Cap download size; disable or carefully limit redirects.
- **Exploitability:** High — unauthenticated, single GET.

### 6. High — `isbndb` unauthenticated paid-API proxy

- **Location:** `supabase/functions/isbndb/index.ts`
- **Description:** Proxies ISBNdb with server `ISBNDB_API_KEY`. Gateway `verify_jwt = true` is satisfied by the **public anon JWT**. Function never calls `auth.getUser()`. Clients intentionally fall back to anon Bearer when logged out.
- **Impact:** Anyone with the public anon key (shipped in web/mobile) can exhaust ISBNdb quota / incur API cost. Path prefixes limit host to `api2.isbndb.com` (not classic open SSRF).
- **Attack path:**
  1. Read anon key from client bundle / `.env.example` pattern in deployed JS.
  2. `GET /functions/v1/isbndb?path=books/foo&...` with `apikey` + `Authorization: Bearer <anon>`.
  3. Repeat at volume.
- **Evidence:**
  - No user auth in function: entire handler lines 31–89
  - Key used server-side: lines 40–44, 65–68
  - Path allowlist only: lines 17–28, 48–56
  - Client anon fallback: `apps/web/src/lib/services/isbndb.ts` ~238–239; `apps/mobile/src/services/isbndb.ts` ~117–118
  - `verify_jwt = true`: `supabase/config.toml` lines 372–374
- **Remediation:** Require a real user session (`getUser`), add per-user/IP rate limits, and/or edge caching. Do not treat anon JWT as authorization for spendy upstreams.
- **Exploitability:** High — no account needed beyond public anon key.

### 7. Medium — Stripe webhook signature lacks timestamp tolerance check

- **Location:** `supabase/functions/subscription-webhook/index.ts` — `verifyStripeSignature`
- **Description:** HMAC over `t.rawBody` is verified, but parsed `t` is never checked against clock skew / max age. Replayed captured Stripe events remain valid indefinitely while the signing secret is unchanged.
- **Impact:** Replay of historical entitlement-granting events (e.g. re-activate after cancel) if an attacker obtains a past body + `stripe-signature` header.
- **Evidence:** lines 86–124 (parse + HMAC); usage at 393–396; no `Math.abs(now - t) < tolerance` check.
- **Remediation:** Reject timestamps older than ~5 minutes (Stripe’s recommended tolerance). Keep idempotency via `subscription_events` (already present).
- **Exploitability:** Medium — needs a previously captured signed payload (MITM, logs, compromised relay).

### 8. Medium — Authenticated OpenAI credit burn without function-level rate limits

- **Location:** `moderate-ugc`, `ai-insights`, `ai-reading-companion`, `quote-scanner`
- **Description:** These functions authenticate users and spend `OPENAI_API_KEY`. `ai-reading-companion` has usage RPC limits; `ai-insights` / `quote-scanner` gate on Plus; `moderate-ugc` is available to any signed-in user for arbitrary text with no obvious per-user throttle in the function.
- **Impact:** Cost abuse (especially `moderate-ugc` and large `quote-scanner` images up to ~2.5MB base64).
- **Evidence:** `moderate-ugc` auth then provider call (~199–261); `quote-scanner` size cap 2_500_000 (~64) still large; `rate-limit-stub` not integrated (`docs/SECURITY_AUDIT.md` rate-limit section).
- **Remediation:** Wire per-user rate limits; tighter image caps; fail closed on abuse thresholds.
- **Exploitability:** Medium — needs an account; Plus gates reduce some surfaces.

---

## Discarded / low-confidence

| Item | Reason |
|------|--------|
| Prompt injection leaking other users’ data | `ai-insights` / `ai-reading-companion` only send caller-supplied context or rows scoped to `userData.user.id`; no cross-user DB load into the prompt. |
| IDOR via `user_id` in body on user functions | Mutating user functions use `auth.getUser()` / JWT `sub`. Manual webhook accepts `user_id` but requires `SUBSCRIPTION_WEBHOOK_SECRET`. |
| Path traversal | `isbndb` prefixes keep host fixed to ISBNdb; no filesystem path joins on user input. |
| Hardcoded live credentials (`sk_live`, `eyJ…`, service role values) | Grep found env **reads** and placeholders (e.g. `.env.stripe.local.example`); no committed live secret values. |
| `rate-limit-stub` missing auth | Intentional unused scaffold; requires `RATE_LIMIT_STUB_SECRET`. |
| TECHNICAL_DEBT claim that Stripe webhooks are unverified | **Outdated** — Stripe HMAC verification is implemented; Apple remains unverified (#2). |
| CORS `Access-Control-Allow-Origin: *` | Expected for browser→edge with bearer tokens; not scored as a standalone vuln here. |

---

## Priority remediation order

1. Block entitlement writes in `apple-iap-verify` until Apple JWS/Server API verification succeeds; stop trusting client `expires_at`.
2. Verify Apple ASN JWS in `subscription-webhook` (or disable `provider=apple` until ready).
3. Allowlist Stripe `success_url` / `cancel_url` / `return_url`.
4. Lock down `share-preview` cover fetch (host allowlist + private IP block).
5. Require user JWT (not anon) + rate limits on `isbndb`.
6. Add Stripe webhook timestamp tolerance; rate-limit OpenAI-backed functions.

**Last updated:** 2026-11-18
