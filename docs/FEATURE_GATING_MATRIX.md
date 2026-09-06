# Feature Gating Matrix

Canonical entitlements for Bookmarked membership (web + native iOS).

- **Tiers:** `SubscriptionTier = "free" | "plus" | "home"`
- **Keys:** `FeatureKey` in [`packages/types/index.ts`](../packages/types/index.ts)
- **Limits:** `ENTITLEMENTS` in [`packages/utils/subscription.ts`](../packages/utils/subscription.ts)
- **API:** `canAccessFeature`, `getEntitlements`, structured `check*Limit` helpers (`{ allowed, reason, currentUsage, limit }`), boolean `canCreate*` wrappers, `getReadingDnaAccess`
- **Contract:** [`feature-entitlements.md`](./feature-entitlements.md)

## Status legend

Complete · Partially complete · Missing · Bugged · Requires DB · Requires UI · Requires iOS parity · Requires subscription gating · Requires Higgsfield design · Requires AI · Requires admin

## FeatureKey → tier access

| FeatureKey | Free | Plus | Home | Enforcement today | Product status |
|---|---|---|---|---|---|
| `custom_shelves` | limit 1 | unlimited | unlimited | Client `checkCustomShelfLimit` + SQL `enforce_custom_shelf_limit` + FeatureLimitModal | Complete (Free cap) |
| `saved_quotes` | limit 25 | unlimited | unlimited | Client `checkSavedQuoteLimit` + SQL `enforce_saved_quote_limit` + FeatureLimitModal | Complete (Free cap) |
| `quote_graphics` | 3 / month | unlimited | unlimited | `usage_counters` consume-on-success; favorite-quote picker; Higgsfield AI still flagged off | Partially complete · Requires AI |
| `joined_book_clubs` | limit 3 create or join | unlimited | unlimited | `checkBookClubJoinLimit` + SQL `enforce_book_club_join_limit` (owner + member) + FeatureLimitModal | Complete (Free cap) |
| `reading_challenges` | 3 / year user/community/club/friend; official/featured free extra; Create is Plus | unlimited | unlimited | Join yearly cap + `enforce_reading_challenge_join_limit` + `create_user_reading_challenge` / `user_has_paid_entitlement`. Official/featured skip the slot. Web locked copy → iOS App Store only (no web checkout) | Complete (web + iOS) |
| `advanced_reading_insights` | no | yes | yes | Insights panels gated via aliases | Partially complete · Requires UI polish |
| `reading_speed` | no | yes | yes | Partial analytics | Partially complete |
| `reading_time` | no | yes | yes | Partial analytics | Partially complete |
| `pages_by_week` | no | yes | yes | Partial analytics | Partially complete |
| `pages_by_month` | no | yes | yes | Partial analytics | Partially complete |
| `reading_habits` | no | yes | yes | DNA habits derived client-side | Partially complete |
| `favorite_authors` | no | yes | yes | Missing dedicated vault | Missing · Requires UI · Requires DB |
| `mood_analytics` | no | yes | yes | Feelings exist; analytics incomplete | Partially complete |
| `year_over_year_comparison` | no | yes | yes | Missing | Missing · Requires UI |
| `advanced_reading_goals` | no | yes | yes | Free yearly goal is `yearly_reading_goals` `(user_id, year)`. Plus extras (multi-goal, pages, etc.) not built | Partially complete · Free yearly shipped |
| `reading_heatmaps` | no | yes | yes | Mobile heatmap present; web parity uneven | Partially complete |
| `monthly_wrapped` | no | yes | yes | Yearly recap is Free (`/wrapped/`). Monthly Wrapped stays Plus and is not built | Partially complete · Yearly Free shipped |
| `ai_reading_companion` | no | yes | yes | Edge fn exists; companion UX incomplete | Partially complete · Requires AI |
| `quote_scanner` | no | yes | yes | Missing | Missing · Requires AI · Requires UI |
| `advanced_reviews` | no | yes | yes | Base reviews exist; chapter/character ratings missing | Partially complete · Requires DB · Requires UI |
| `club_polls` | no | yes | yes | Missing | Missing · Requires DB · Requires UI |
| `club_analytics` | no | yes | yes | Basic club stats only | Partially complete |
| `full_reading_dna` | top 3 only | full | advanced | Confidence-aware compute + profile dashboard; Higgsfield assets blocked | Partially complete · Requires Higgsfield design |
| `reading_dna_ai_insights` | no | yes | yes | Stubbed in DNA section | Partially complete · Requires AI |
| `reading_dna_book_matches` | no | yes | yes | Stubbed CTA | Partially complete |
| `reading_dna_year_comparison` | no | yes | yes | Missing | Missing · Requires UI |

## Home-only (beyond FeatureKey)

| Surface | Free | Plus | Home | Status |
|---|---|---|---|---|
| Book Map | no | no | yes | Missing |
| Reader Map | no | no | yes | Missing |
| DNA Match % / badges | no | no | yes | Missing · Requires UI |
| Premium events / concierge | no | no | yes | Missing |
| Priority support | no | no | yes | Missing |

## Pricing (meeting brief vs code)

| Plan | Brief | Current upgrade UI |
|---|---|---|
| Plus | App Store localized price only | Purchase is App Store IAP only. Web `/upgrade/` explains iOS subscribe; no hardcoded prices in Free/Plus UX. Existing Stripe rows still unlock both platforms. |
| Home | App Store localized price only | Not sold as separate checkout SKU yet |

## Downgrade policy

- Preserve all user data (shelves, quotes, club memberships, challenges).
- Block new creation beyond Free limits via helpers (`canCreate*`).
- Existing over-limit items remain readable/editable; do not auto-delete.

## Legacy aliases

`PremiumFeature` remains a deprecated superset. `canAccessFeature` maps aliases such as:

- `custom_shelf` → `custom_shelves`
- `reading_dna_dashboard` → `full_reading_dna`
- `book_matches` → `reading_dna_book_matches`
- `advanced_analytics` / `reading_insights` → `advanced_reading_insights`
- `heatmaps` → `reading_heatmaps`
- `ai_companion` / `ai_insights` → companion / DNA AI keys

## Rules

1. Never scatter ad-hoc `tier === "plus"` checks in UI — use `canAccessFeature` / limit helpers.
2. Never trust client-reported tier alone for purchase fulfillment — refresh from Stripe/IAP + `user_subscriptions`.
3. Soft paywalls preferred; hard blocks only at create/join boundaries.
