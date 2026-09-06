# Basic (Free) Feature Audit

Superseded for the official Free-tier contract by [`feature-entitlements.md`](./feature-entitlements.md) and the **Sixteenth Sprint — BASIC / FREE tier** section in `PROJECT_PROGRESS.md`. Keep this file as the Phase 1 snapshot.

Audit of Free-tier product surfaces for Bookmarked (web + native iOS). Status as of Free/Plus/Reading DNA Phase 1.

## Legend

Complete · Partially complete · Missing · Bugged · Requires DB · Requires UI · Requires iOS parity · Requires subscription gating

## Library & shelves

| Feature | Status | Notes |
|---|---|---|
| Permanent shelves (Want / Currently / Read / DNF) | Complete | Shared shelf keys; DNF shipped Sprint 6 |
| Custom shelves (limit 1) | Partially complete · Requires subscription gating | `canCreateCustomShelf` wired on create (web + iOS); UI soft paywall polish pending |
| Clear shelf / bulk moves | Complete | Library actions exist |
| Audiobook tracking | Partially complete | Format/progress fields exist; UX polish ongoing |
| Session-date calendar (basic) | Partially complete | Dates available; dedicated Free calendar UI thin |
| One annual reading goal | Complete | `yearly_reading_goal` on profiles |

## Reading & journal

| Feature | Status | Notes |
|---|---|---|
| Reading sessions / tracker | Complete | Core tracker on both platforms |
| Trail / journal history | Complete | Sprint 4 Home tabs |
| Basic reviews | Complete | Public/followers/private |
| Feelings / moods on finish | Partially complete | Capture exists; Free analytics capped |

## Social & discovery

| Feature | Status | Notes |
|---|---|---|
| Feed (follow + activity) | Complete | Sprint 5 discovery/share |
| Join book clubs (limit 3) | Partially complete · Requires subscription gating | Join works; Free cap not enforced |
| Reading challenges (limit 3/year) | Missing · Requires UI · Requires DB | Product incomplete |
| Saved quotes (limit 25) | Partially complete · Requires UI · Requires subscription gating | Helpers ready; vault incomplete |

## Reading DNA (Free)

| Feature | Status | Notes |
|---|---|---|
| Top 3 traits | Partially complete | `computeReadingDna` + profile sections; Free shows top 3 |
| Full dashboard | Gated (Plus) | Soft lock in DNA UI |
| AI insights / book matches | Gated (Plus) | Stub CTAs |

## Free limit rules (enforced)

| Cap | Rule | Enforcement |
|---|---|---|
| Custom shelves | 1 | `createCustomShelf` + FeatureLimitModal |
| Saved quotes | 25 | Notes with `quote` or `favorite_quote`; FeatureLimitModal |
| Quote graphics | 3 / calendar month (UTC) | `usage_counters` key `quote_graphics` via `consumeQuoteGraphicSlot` |
| Joined clubs | 3 | `joinClub` (existing memberships preserved) |
| Challenges | 3 joins / calendar year (UTC) | `reading_challenge_members` + yearly usage counter |

## Gaps to close next (Free basics)

1. Quote graphics generator UI (slot consumer ready).
2. Challenges discovery UI (join service ready).
3. Basic calendar surface (session dates only) on web + iOS.
4. Confirm permanent shelves remain unlimited and never count toward custom shelf limit.
