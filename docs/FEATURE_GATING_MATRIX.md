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
| `quote_graphics` | 3 / month | unlimited | unlimited | `usage_counters` consume-on-success; favorite-quote picker; fair-use copy on studio + upgrade; Higgsfield AI still flagged off | Partially complete · Requires AI |
| `joined_book_clubs` | limit 3 create or join | unlimited | unlimited | `checkBookClubJoinLimit` + SQL `enforce_book_club_join_limit` (owner + member) + FeatureLimitModal | Complete (Free cap) |
| `reading_challenges` | 3 / year user/community/club/friend; official/featured free extra; Create is Plus | unlimited | unlimited | Join yearly cap + `enforce_reading_challenge_join_limit` + `create_user_reading_challenge` / `user_has_paid_entitlement`. Official/featured skip the slot. Web locked copy → iOS App Store only (no web checkout) | Complete (web + iOS) |
| `advanced_reading_insights` | no | yes | yes | PlusInsightsPanel + activity/heatmap | Complete (Plus sprint) |
| `reading_speed` | no | yes | yes | `computeReadingSpeed` — pages + duration only | Complete |
| `reading_time` | no | yes | yes | Reading vs listening kept separate — no combined “Total Reading Time” | Complete |
| `pages_by_week` | no | yes | yes | `computePagesByWeek` from `session_date` | Complete |
| `pages_by_month` | no | yes | yes | `computePagesByMonth` from `session_date` | Complete |
| `reading_habits` | no | yes | yes | Sparse-data copy; no fake precision | Complete |
| `favorite_authors` | no | yes | yes | `user_favorite_authors` + Plus trigger | Complete |
| `mood_analytics` | no | yes | yes | Stable builtin IDs + own custom IDs | Complete |
| `year_over_year_comparison` | no | yes | yes | No Infinity%; omit incomplete year | Complete |
| `advanced_reading_goals` | no | yes | yes | Flexible kinds; `ADVANCED_GOAL_SIMULTANEOUS_LIMIT = null` | Complete |
| `reading_heatmaps` | no | yes | yes | Pages metric, royal orange, a11y values | Complete |
| `monthly_wrapped` | no | yes | yes | `/wrapped/month/` + iOS `wrapped-month`; opt-in share | Complete |
| `ai_reading_companion` | no | yes | yes | Edge `ai-reading-companion` + safety helpers | Complete |
| `quote_scanner` | no | yes | yes | Edge OCR; never auto-save; photos not retained | Complete |
| `advanced_reviews` | no | yes | yes | Chapter notes, optional 5-star character ratings, Would Recommend, reread 5-star half-star | Complete |
| `club_polls` | no | yes | yes | RPC create/vote; default one vote; creator can opt in to multi-select | Complete |
| `club_analytics` | no | yes | yes | Owner/host + Plus aggregates RPC (`canViewDetailedStats`) | Complete |
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
