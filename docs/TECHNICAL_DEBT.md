# Bookmarked — Technical Debt Register

> Documented during Phase 0 audit (July 2026). Items are prioritized by impact on maintainability and user experience.

---

## Critical / architectural

### Static export on GitHub Pages

**Impact:** High — constrains every routing, auth, and data-fetch decision.

- No Next.js server runtime, API routes, or middleware in production.
- `ClientAuthGuard` replaces server-side route protection; brief unauthenticated flash possible on cold load.
- Entity detail pages use query params (`/book/?id=`) instead of dynamic segments.
- `AppNavLink` and `staticRedirect()` use `window.location.assign()` because Next.js 16 client routing is unreliable with `output: "export"` on GitHub Pages.
- `images.unoptimized: true` — no built-in image optimization.
- Only three built-in shelf slugs are pre-rendered (`want-to-read`, `reading`, `read`); custom shelves use `/library/custom/`.

**Mitigation path:** Migrate to Vercel/Cloudflare with SSR, or accept constraints and keep query-param patterns.

### Implicit auth flow (not PKCE)

**Impact:** Medium — security vs. cross-device email links tradeoff.

Chosen so password-reset and confirmation links work when opened on a different device than the one that requested them. Revisit if OAuth providers are added.

### No monorepo workspace tooling

**Impact:** Medium — `apps/web` and `apps/mobile` install dependencies independently; no shared lockfile or hoisted packages at root.

---

## Documentation drift

### `MASTER_TASK_LIST.md` references Open Library

**Impact:** Low — doc only.

Production catalog uses **ISBNdb** via Supabase Edge Function. `openLibrary.ts` is a compatibility re-export. Legacy `books.external_source = 'open_library'` rows may still exist.

### Phase numbering collision

**Impact:** Low.

MVP phases (0–2 in `MASTER_TASK_LIST.md`) differ from post-MVP refinement phases in `PROJECT_PROGRESS.md`. Use `PROJECT_PROGRESS.md` for refinement work.

---

## Code duplication & scattered concerns

### Reading analytics surfaced in multiple places

**Impact:** Medium — UX confusion and repeated fetches.

Before redesign, reading goal, activity charts, suggested shelves, and analytics appeared across **Dashboard**, **Reading Room**, and (via unused `LibraryAnalyticsPanel`) potentially Library. Phase 1 consolidates reading-life features into Reading Room tabs and simplifies Dashboard.

| Component | Former locations |
|-----------|------------------|
| `ReadingGoalPanel` | Dashboard, Reading Room |
| `ReadingActivityPanel` | Reading Room |
| `SuggestedShelvesPanel` | Library, Reading Room |
| `AnalyticsGrid` / `LibraryAnalyticsPanel` | Unused on Library page; analytics in `readingRoom.ts` |
| `TrendingNewsletterPanel` | Dashboard (“Community picks”) |

### Per-book vs. user-wide journal

**Impact:** Medium.

`ReadingJournalSection` and `ReadingNotesSection` are scoped to a single `userBookId` on book detail pages. Reading Room needs user-wide aggregation (`listUserReadingSessions`, `listNotes({ userId })`) — added in Phase 1 but not yet unified into a single shared timeline component.

### Profile vs. public reader page overlap

**Impact:** Medium — Phase 3 target.

| Feature | `/profile/` | `/reader/?username=` |
|---------|-------------|----------------------|
| Avatar, bio, genres | ✅ | ✅ |
| Reading streak | ✅ | ✅ |
| Shelf preview | ❌ | ✅ |
| Feed / posts | ❌ | ✅ |
| Notes section | ❌ | ✅ |
| Clubs | ❌ | ✅ |

Own profile is intentionally settings-focused; public reader page still bundles discovery features.

---

## Dead or underused code

| Item | Location | Notes |
|------|----------|-------|
| `LibraryAnalyticsPanel` | `components/library/` | Implemented but never mounted on Library page |
| `lib/supabase/middleware.ts` | `lib/supabase/` | No root `middleware.ts`; unused in static export |
| `lib/supabase/server.ts` | `lib/supabase/` | Limited use with static export |
| `preferred_library_view = 'reading_room'` | `profiles` column | Legacy value; normalized to `bookshelf` in Library pages |
| `openLibrary.ts` | `lib/services/` | Thin re-export of `isbndb.ts` for backward compatibility |

---

## State management

### Web: no global client store

**Impact:** Low–medium.

Each page loads its own data via `useEffect` + Supabase. Realtime hooks (`useUserBooksRealtime`, `usePostsRealtime`, etc.) trigger refetches. Works but causes duplicate fetches when navigating between Dashboard and Reading Room.

**Mobile** uses Zustand + TanStack Query — patterns are not shared with web.

### Toast-only global context

`ToastProvider` is the only React Context on web. No shared user/profile cache across routes.

---

## Navigation

### Pre-redesign: flat hamburger + 9+ top links

**Impact:** Medium — poor mobile IA.

App nav listed Dashboard, Feed, Reading Room, Notes, Library, Search, Clubs, Messages, Profile with no hierarchy. Phase 1 introduces bottom nav (Home = Reading Room, Feed, Search, Messages, Profile) and moves Notes into Reading Room.

### Clubs and Notifications not in mobile bottom nav

**Impact:** Low.

Clubs remain desktop nav + direct URL. Notifications stay in header bell — acceptable for v1 of bottom nav.

---

## Database & RLS

### 41 migrations, no down migrations

**Impact:** Low — standard for Supabase projects.

Schema changes require careful forward-only migrations. All `public` tables have RLS enabled.

### Security definer helpers

`create_notification()`, `shelf_visible_to_viewer()`, `search_reading_notes()` bypass RLS in controlled ways. Changes to these functions need security review.

### Replica identity full on realtime tables

Required for Supabase Realtime but increases WAL overhead. Tables: `notifications`, `reading_sessions`, `user_books`, `reading_notes`, `book_club_posts`, `posts`.

---

## Testing & CI

### No automated E2E test suite

**Impact:** Medium.

Deploy workflow builds and publishes static export. Manual QA required for auth flows, static routing, and Supabase RLS.

### Build-time env validation only

`scripts/validate-env.mjs` checks `NEXT_PUBLIC_*` at build; runtime misconfiguration shows `SupabaseConfigError` component.

---

## Performance

### Client-side catalog refresh

`useStaleCatalogRefresh` re-fetches stale `books` rows in the background. Can cause extra Edge Function calls on library/dashboard load.

### Unoptimized cover images

Remote patterns whitelisted in `next.config.ts`; no CDN resizing. Large cover payloads on slow connections.

### N+1 patterns in some services

`feedSearch.ts`, `socialFeed.ts`, and club discovery may batch-fetch but warrant profiling as data grows.

---

## Accessibility

Generally good baseline (skip link, focus-visible, 44px touch targets, semantic headings). Known gaps:

- Tab panels in new Reading Room tabs need `role="tabpanel"` + `aria-labelledby` audit.
- Bottom nav needs `aria-current="page"` on active tab (added in Phase 1).
- Some modals rely on `useFocusTrap` — not all dialogs verified with screen readers.

---

## Billing & subscriptions

### Premium gates without live payments

**Impact:** Medium — architecture is ready; revenue not yet enabled.

- `user_subscriptions` table with RLS (owner read/write only).
- Feature gates via `canAccessFeature()` for `advanced_analytics` and `ai_insights`.
- Web: `useSubscription`, `/upgrade/`, `PremiumFeatureLock` in Reading Room Progress tab.
- Mobile: `useSubscription`, `/(app)/upgrade`, `ReadingInsightsSection` gates on home.
- **No Stripe, App Store, or Google Play SDK integration yet.**

### Webhook stub

**Impact:** Low until billing goes live.

`supabase/functions/subscription-webhook/` accepts POST with:

- Header: `x-subscription-webhook-secret` (must match `SUBSCRIPTION_WEBHOOK_SECRET`)
- Body: `{ user_id, subscription_tier?, subscription_status?, subscription_provider?, subscription_expires_at? }`
- Query: `?provider=stripe|apple|google`

Uses service role to upsert `user_subscriptions`. **Does not verify Stripe/App Store signatures** — must be added before production.

### Stripe (web) — not started

Required env (future):

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (or relay via Edge Function)
- Checkout Session or Customer Portal
- Map `customer.metadata.user_id` → webhook payload

Note: static GitHub Pages export cannot host Next.js API routes; Stripe webhooks should target the Supabase Edge Function (or a separate relay).

### App Store / Google Play (mobile) — not started

Required:

- App Store Connect / Play Console subscription products
- `expo-in-app-purchases` or RevenueCat
- Server-side receipt validation → `subscription-webhook` with `provider=apple|google`

---

## Priority matrix (recommended order)

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Complete Phase 1 navigation redesign | Medium |
| P1 | Wire Stripe + App Store billing to `subscription-webhook` | High |
| P1 | Unify reading-life data loading (shared hook or React Query on web) | Medium |
| P2 | Remove dead components (`LibraryAnalyticsPanel` or wire it intentionally) | Low |
| P2 | Update `MASTER_TASK_LIST.md` ISBNdb references | Low |
| P3 | Public reader profile deduplication (Phase 3) | Medium |
| P3 | E2E smoke tests for auth + core loop | High |
| P4 | Evaluate SSR hosting to drop static-export workarounds | High |

---

## Related docs

- `docs/BOOKMARKED_ARCHITECTURE.md` — system design
- `docs/BOOKMARKED_CURRENT_ARCHITECTURE.md` — pre-refinement snapshot
- `docs/PROJECT_PROGRESS.md` — refinement phase tracker

**Last updated:** July 2026
