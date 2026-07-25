# Bookmarked — Technical Debt Register

> **Phase 0 audit** — July 23, 2026. Prioritized items found during codebase review.

---

## P0 — Architectural constraints

### Static export on GitHub Pages

**Impact:** High — constrains routing, auth, and data-fetching for the entire web app.

- No Next.js server runtime, API routes, or middleware in production.
- `ClientAuthGuard` (`apps/web/src/components/auth/ClientAuthGuard.tsx`) replaces server-side protection; brief unauthenticated flash possible on cold load.
- Entity pages use query params (`/book/?id=`, `/reader/?username=`) instead of dynamic segments.
- `AppNavLink` uses `window.location.assign()` via `staticRedirect()` because client-side routing is unreliable with `output: "export"` on GitHub Pages.
- `images.unoptimized: true` — no built-in Next.js image optimization.
- Stripe webhooks cannot target Next.js API routes; must use Supabase Edge Functions.

**Mitigation:** Migrate to Vercel/Cloudflare with SSR, or accept constraints and maintain query-param patterns.

### No monorepo workspace tooling

**Impact:** Medium

- `apps/web` and `apps/mobile` install dependencies independently (no root `package.json` workspace).
- No shared lockfile; version drift possible (`@supabase/supabase-js` 2.107 vs 2.105).
- Shared logic in `packages/` is imported via relative paths, not published packages.

**Mitigation:** Add npm/pnpm workspaces at root; hoist common deps.

---

## P1 — Web / mobile parity gaps

### Duplicated service layer (53 web / 42 mobile service files)

**Impact:** High — maintenance burden, subtle behavioral drift

Same-named service files exist in both `apps/web/src/lib/services/` and `apps/mobile/src/services/` with separate implementations. `packages/utils` now carries more shared logic, but much of the query/mutation layer is still duplicated.

Examples of drift risk:

| Module | Drift observed |
|--------|----------------|
| `completeReadingSession.ts` | Web and mobile are aligned now, but still maintain parallel implementations |
| `socialFeed.ts` | Separate hydration logic (web had N+1 fix; mobile must stay in sync manually) |
| `library.ts` | Mobile has DNF / `expected_read_date`; must verify web parity |

**Mitigation:** Extract query/mutation functions into `packages/services/` consumed by both apps.

### Mobile status docs drift

**Impact:** Low–medium

Mobile Reading Room parity is implemented (`packages/utils/readingRoomTabs.ts`, `apps/mobile/app/(app)/index.tsx`), and the mobile README has been refreshed. Older docs under `docs/project/` and `docs/progress/` still describe mobile as scaffold-only and should be treated as MVP-era history unless updated.

---

## P1 — Billing & premium

### App Store production approval still external

**Impact:** Medium — iOS revenue depends on App Store review and sandbox validation

- Stripe checkout and HMAC webhook verification are implemented.
- iOS IAP uses `expo-iap`, `apple-iap-verify`, and `subscription-webhook?provider=apple`.
- Apple StoreKit / App Store Server Notification JWS signatures and Apple Root CA - G3 certificate chains are verified in code.
- Remaining production work is external: App Store Connect subscription review, TestFlight sandbox purchase/restore validation, and optional App Store Server API transaction lookup with owner-provided `.p8` credentials.

### Billing RLS must stay service-role only

**Impact:** High

`user_subscriptions` owners can select their own row, but clients must not insert/update billing state. Keep subscription writes in service-role Edge Functions or security-definer triggers only (`20260726200000_lock_down_user_subscriptions_rls.sql`).

---

## P2 — Code duplication & scattered concerns

### Reading analytics in multiple surfaces

**Impact:** Medium

Reading goal, activity charts, and suggested shelves appear across Reading Room tabs and (historically) Dashboard. `LibraryAnalyticsPanel` (`apps/web/src/components/library/LibraryAnalyticsPanel.tsx`) is implemented but **never mounted** on the Library page.

**Mitigation:** Wire intentionally or delete dead component.

### Per-book vs user-wide journal/notes

**Impact:** Low–medium

`ReadingJournalSection` and `ReadingNotesSection` are per-book on book detail. Reading Room aggregates user-wide data via separate service calls. No unified timeline component.

### Profile vs public reader overlap

**Impact:** Low (partially addressed)

`/profile/` is settings-focused; `/reader/?username=` handles discovery. Phase 3 deduplication shipped for public profiles; own-profile vs reader-page feature split remains intentional.

---

## P2 — Dead or underused code

| Item | Location | Notes |
|------|----------|-------|
| `LibraryAnalyticsPanel` | `apps/web/src/components/library/` | Never mounted |
| `lib/supabase/middleware.ts` | `apps/web/src/lib/supabase/` | No root `middleware.ts`; unused with static export |
| `lib/supabase/server.ts` | `apps/web/src/lib/supabase/` | Limited value without SSR |
| `openLibrary.ts` | `apps/web/src/lib/services/` | Thin ISBNdb re-export; naming confuses new contributors |
| `preferred_library_view = 'reading_room'` | `profiles` column | Legacy; normalized to `bookshelf` in UI |
| `rate-limit-stub` Edge Function | `supabase/functions/rate-limit-stub/` | Placeholder, not wired to clients |

---

## P2 — State management inconsistency

### Web: no global client cache

**Impact:** Medium

Each page loads data via `useEffect` + Supabase. Navigating Dashboard ↔ Reading Room (now merged) can duplicate fetches. Realtime hooks trigger refetches but do not dedupe across routes.

**Mobile** uses TanStack Query + Zustand — patterns are not shared with web.

**Mitigation:** Adopt React Query on web, or shared SWR/cache layer.

### Toast-only global context (web)

`ToastProvider` is the only React Context on web. No shared user/profile/subscription cache across routes (subscription re-fetched per gated page).

---

## P2 — Documentation drift

| Doc | Issue |
|-----|-------|
| `docs/project/MASTER_TASK_LIST.md` | Says mobile is "scaffold only" and catalog is Open Library — both outdated |
| `apps/mobile/README.md` | Refreshed; older docs still contain pre-parity mobile claims |
| Phase numbering | MVP phases (MASTER_TASK_LIST 0–2) vs refinement phases (PROJECT_PROGRESS 1–10) collide |
| `README.md` (root) | Migration table lists only early migrations; 59 exist |

**Mitigation:** Cross-link root audit docs; update README migration table.

---

## P3 — Database & RLS

### 59 migrations, no down migrations

**Impact:** Low — standard for Supabase

Forward-only schema changes require careful review. All `public` tables have RLS.

### Security definer helpers

`create_notification()`, `shelf_visible_to_viewer()`, `search_reading_notes()`, etc. bypass RLS in controlled ways. Changes require security review (`docs/SECURITY_AUDIT.md`).

### Replica identity FULL on realtime tables

Increases WAL overhead. Tables: `notifications`, `reading_sessions`, `user_books`, `reading_notes`, `book_club_posts`, `posts`.

---

## P3 — Testing & CI

### No automated E2E suite

**Impact:** Medium

Deploy workflow builds static export only. Web has unit tests (`readingCompletion.test.ts`, vitest). Mobile has `shelves.test.ts`. No Playwright/Detox coverage for auth, static routing, or RLS.

### Build-time env validation only (web)

`scripts/validate-env.mjs` checks `NEXT_PUBLIC_*` at build. Runtime misconfiguration shows `SupabaseConfigError` component.

---

## P3 — Performance

| Item | Impact | Notes |
|------|--------|-------|
| Client-side catalog refresh | Medium | `staleCatalogRefresh.ts` — extra Edge Function calls on load |
| Unoptimized cover images | Medium | Remote URLs, no CDN resizing |
| Feed/club N+1 patterns | Low | Partially fixed in web `socialFeed.ts`; monitor as data grows |
| Library virtualization | Low | Deferred until large libraries reported |
| Message pagination | Low | 200-message cap per thread |

---

## P3 — Accessibility

Generally good baseline (skip link, focus-visible, 44px touch targets). Gaps:

- Reading Room tab panels need `role="tabpanel"` + `aria-labelledby` audit
- Not all modals verified with screen readers (`useFocusTrap` partial coverage)
- Bottom nav `aria-current="page"` added on web; verify mobile `FloatingTabBar`

---

## P4 — Deferred features

| Feature | Status | Notes |
|---------|--------|-------|
| Events calendar | ✅ | Web + mobile calendar UI shipped |
| Feed search (mobile) | ✅ | `feedSearch.ts` + `FeedScreen` search UI |
| Goodreads import (mobile) | ✅ | `goodreadsImport.ts` + `LibraryImportPanel` in settings |
| Library virtualization | Deferred | |
| Bundle analyzer pass | Deferred | |
| SSR hosting evaluation | Deferred | Would remove static-export workarounds |

---

## Priority matrix (recommended order)

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Document static-export constraints (done — this audit) | — |
| P1 | Extract shared services to `packages/` | High |
| P1 | TestFlight/App Review purchase + restore validation | Medium |
| P1 | Optional App Store Server API transaction lookup | Medium |
| P2 | Adopt React Query on web OR accept duplicate-fetch pattern | Medium |
| P2 | Remove or wire `LibraryAnalyticsPanel` | Low |
| P2 | Update root `README.md` + `MASTER_TASK_LIST.md` catalog/mobile claims | Low |
| P3 | E2E smoke tests (auth + core loop) | High |
| P4 | Evaluate SSR hosting | High |

---

## Related docs

| Doc | Path |
|-----|------|
| Architecture | `BOOKMARKED_ARCHITECTURE.md` |
| Progress | `PROJECT_PROGRESS.md` |
| Prior debt register | `docs/TECHNICAL_DEBT.md` |
| Security | `docs/SECURITY_AUDIT.md` |
| Performance | `docs/PERFORMANCE_AUDIT.md` |

**Last updated:** July 23, 2026 (Phase 0 audit)
