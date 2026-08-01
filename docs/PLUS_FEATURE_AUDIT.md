# Plus Feature Audit

Audit of Bookmarked Plus unlocks (Home inherits Plus + advanced DNA / maps). Web + native iOS.

## Legend

Complete · Partially complete · Missing · Bugged · Requires DB · Requires UI · Requires iOS parity · Requires AI · Requires Higgsfield design · Requires subscription gating

## Limits removed on Plus

| Capability | Free | Plus | Status |
|---|---|---|---|
| Custom shelves | 1 | ∞ | Create gated; Plus path unblocked via entitlements |
| Saved quotes | 25 | ∞ | Helpers only |
| Quote graphics / month | 3 | ∞ | Missing product |
| Joined book clubs | 3 | ∞ | Cap not enforced yet |
| Reading challenges / year | 3 | ∞ | Product thin |

## Insights & analytics

| FeatureKey | Status | Notes |
|---|---|---|
| `advanced_reading_insights` | Partially complete | Panels exist; packaging uneven |
| `reading_speed` / `reading_time` | Partially complete | Partial stats |
| `pages_by_week` / `pages_by_month` | Partially complete | Charts incomplete on web |
| `reading_habits` | Partially complete | Derived in Reading DNA |
| `favorite_authors` | Missing · Requires UI · Requires DB | |
| `mood_analytics` | Partially complete | |
| `year_over_year_comparison` | Missing · Requires UI | |
| `advanced_reading_goals` | Partially complete · Requires DB | Beyond single yearly goal |
| `reading_heatmaps` | Partially complete | Stronger on iOS |

## Premium creative / AI

| FeatureKey | Status | Notes |
|---|---|---|
| `monthly_wrapped` | Missing · Requires Higgsfield design · Requires UI | Mockup reference exists |
| `ai_reading_companion` | Partially complete · Requires AI | Feature-flag unfinished surfaces |
| `quote_scanner` | Missing · Requires AI · Requires UI | |
| `advanced_reviews` | Partially complete · Requires DB · Requires UI | |
| `club_polls` / `club_analytics` | Missing / Partial | |

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
| Stripe Plus checkout | Partially complete | Price copy often still $4.99; brief is $5.99 / $59.99 |
| iOS IAP restore/refresh | Partially complete | Abstraction incomplete |
| Entitlement refresh after purchase | Partially complete | Client hooks exist; webhook idempotency Phase 3 |

## Priority Plus gaps

1. Align pricing copy + Stripe products to $5.99 / $59.99.
2. Full Reading DNA dashboard parity (web + iOS) matching mockup.
3. Wire quotes / clubs / challenges limit helpers.
4. Soft paywall component kit (Phase 4).
