# Plus Feature Audit

Audit of Bookmarked Plus unlocks (Home inherits Plus + advanced DNA / maps). Web + native iOS.

## Legend

Complete · Partially complete · Missing · Bugged · Requires DB · Requires UI · Requires iOS parity · Requires AI · Requires Higgsfield design · Requires subscription gating

## Limits removed on Plus

| Capability | Free | Plus | Status |
|---|---|---|---|
| Custom shelves | 1 | ∞ | Create gated; Plus path unblocked via entitlements |
| Saved quotes | 25 | ∞ | Helpers + server cap; Plus unlimited |
| Quote graphics / month | 3 | ∞ | Plus skips the Free monthly cap; fair-use copy shown (no invented Plus monthly cap) |
| Joined book clubs | 3 | ∞ | Create + join consume Free cap; Plus unlimited |
| Reading challenges / year | 3 | ∞ | Official/featured skip slot; Plus unlimited joins |

## Insights & analytics

| FeatureKey | Status | Notes |
|---|---|---|
| `advanced_reading_insights` | Complete | PlusInsightsPanel on web + iOS |
| `reading_speed` / `reading_time` | Complete | Duration required for pages/hour; reading vs listening stay separate |
| `pages_by_week` / `pages_by_month` | Complete | `session_date`; no audiobook-as-pages |
| `reading_habits` | Complete | Sparse-data copy |
| `favorite_authors` | Complete | Dedicated vault; no auto-follow |
| `mood_analytics` | Complete | Own tags + stable IDs |
| `year_over_year_comparison` | Complete | No Infinity%; omit incomplete |
| `advanced_reading_goals` | Complete | Flexible kinds; no simultaneous cap |
| `reading_heatmaps` | Complete | Pages metric + a11y |

## Premium creative / AI

| FeatureKey | Status | Notes |
|---|---|---|
| `monthly_wrapped` | Complete | Opt-in share; not a Spotify clone |
| `ai_reading_companion` | Complete | Edge Function + spoiler/ending safety |
| `quote_scanner` | Complete | OCR preview; never auto-save |
| `advanced_reviews` | Complete | Reread + character ratings use 5-star half-star; scores persist; character ratings optional |
| `club_polls` / `club_analytics` | Complete | Multi-select opt-in; analytics owner/host only |

## Reading DNA (Plus)

| FeatureKey | Status | Notes |
|---|---|---|
| `full_reading_dna` | Partially complete · Requires Higgsfield design | Dashboard hierarchy toward mockup |
| `reading_dna_ai_insights` | Partially complete · Requires AI | Stubbed |
| `reading_dna_book_matches` | Partially complete | Stub CTA |
| `reading_dna_year_comparison` | Missing · Requires UI | |

## Billing / access

| Item | Status | Notes |
|---|---|---|
| Stripe Plus checkout | Not used for new purchases | Web iOS-subscribe copy only |
| iOS IAP restore/refresh | Complete | Monthly + yearly SKUs; Restore + `user_subscriptions` sync |
| Entitlement refresh after purchase | Partially complete | Client hooks exist; webhook idempotency Phase 3 |

## Priority Plus gaps

1. Align pricing copy + Stripe products to $5.99 / $59.99.
2. Full Reading DNA dashboard parity (web + iOS) matching mockup.
3. Wire quotes / clubs / challenges limit helpers.
4. Soft paywall component kit (Phase 4).
