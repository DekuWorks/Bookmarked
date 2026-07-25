# Bookmarked — Project Progress

> **Archived snapshot.** The current progress tracker is `../PROJECT_PROGRESS.md`.
> This copy is kept for historical context and may contain stale phase details.

> Post-MVP refinement tracker. Updated July 2026.

**Live:** https://bookmarked.online

---

## Phase overview

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Audit & documentation | ✅ Complete | All four Phase 0 docs delivered |
| 1 | Navigation redesign | ✅ Complete | Dashboard, Library, Reading Room tabs, mobile bottom nav |
| 2 | Reading Room depth | ✅ Complete | Finish workflow, mood tags, mobile parity, reviews tab polish |
| 3 | Community | ✅ Complete | Feed polish, trending (web + mobile), public profile dedup |
| 4 | Premium architecture | 🟡 In progress | Gates + mobile parity + webhook stub; live billing TBD |
| 5 | UI refresh | ✅ Complete | Search/forms/nav polish; surface cards on feed/messages |
| 6 | Performance | ✅ Complete | Audit doc, lazy gif picker, feed N+1 fix, skeleton loaders |
| 7 | Database | ✅ Complete | Schema audit, indexes, unique constraints, `DATABASE_SCHEMA.md` |
| 8 | Security | ✅ Complete | RLS fixes, private message attachments, `SECURITY_AUDIT.md` |
| 9 | Responsive QA | ✅ Complete | Mobile layout fixes, `RESPONSIVE_QA.md` checklist |
| 10 | Production hardening | ✅ Complete | SEO metadata, validation, route audit, env docs |
| — | Mobile app parity | 🟡 In progress | Finish → rate prompt parity shipped; premium gates added |
| — | Custom shelf icons | ✅ Complete | PNG icons web + mobile; `docs/SHELF_ICON_AUDIT.md`, `DESIGN_SYSTEM.md`, `ASSET_GUIDE.md` |
| — | Brand refresh | ✅ Complete | Normalized branding paths, `BookmarkedLogo` + `SavedBookBadge`, `docs/BRANDING_ASSET_AUDIT.md` |

Legend: ✅ Complete · 🟡 In progress · ⚪ Not started · 🔴 Blocked

---

## Phase 0 — Audit & documentation

| Task | Status | Deliverable |
|------|--------|-------------|
| 0.1 Current architecture snapshot | ✅ | `docs/BOOKMARKED_CURRENT_ARCHITECTURE.md` |
| 0.2 Comprehensive architecture doc | ✅ | `docs/BOOKMARKED_ARCHITECTURE.md` |
| 0.3 Technical debt register | ✅ | `docs/TECHNICAL_DEBT.md` |
| 0.4 Progress tracker (this file) | ✅ | `docs/PROJECT_PROGRESS.md` |

---

## Phase 1 — Navigation redesign ✅

Dashboard, Library, Reading Room tabs, Profile cleanup, and mobile bottom nav — all complete. See prior sections in git history.

---

## Phase 2 — Reading Room depth ✅

### 2.1 Mark as finished workflow

| Item | Status | Notes |
|------|--------|-------|
| Auto-set pages to 100% on finish | ✅ | `markBookFinished` |
| Move to Read shelf | ✅ | `shelf_status: read` |
| Save finish date (with picker) | ✅ | `MarkFinishedDialog` + `finished_at` on action |
| Create journal entry | ✅ | `createReadingSessionWithClient` at finish |
| Post-finish “Rate this book?” prompt | ✅ | `RateBookPrompt` — Skip / Review now |
| Mobile finish → rate prompt parity | ✅ | `MarkFinishedSheet` + `RateBookPromptSheet` |

### 2.2 Ratings & reviews

| Item | Status | Notes |
|------|--------|-------|
| Half-star ratings | ✅ | |
| Multiple reviews per read | ✅ | |
| Book edition on reviews | ✅ | Preset chips + custom |
| Advanced category ratings | ✅ | |
| Feelings / mood tags on reviews | ✅ | `REVIEW_FEELINGS` |
| Reading Room reviews tab polish | ✅ | Filters, monthly grouping, feelings/edition |

### 2.3 Journal mood tags

| Item | Status | Notes |
|------|--------|-------|
| `mood` column on `reading_sessions` | ✅ | Migration `20260721120000_reading_sessions_mood.sql` |
| Mood picker on book journal | ✅ | `SessionMoodPicker` in `ReadingJournalSection` |
| Mood display in Reading Room trail tab | ✅ | `TrailPanel` |

### 2.4 Reading Room web overhaul (July 2026)

| Item | Status | Notes |
|------|--------|-------|
| Audit routes & Dashboard references | ✅ | Home = `/reading-room/`; `/dashboard/` redirects to Overview |
| Remove “Today’s Dashboard” button | ✅ | Removed from Overview in `917ef1c` |
| Delete Dashboard nav tab | ✅ | Navbar + bottom nav use Home → Reading Room |
| Overview layout (no reading goal) | ✅ | Currently Reading → Finished + Favorites → Quick Actions → Activity |
| Progress tab (reading goal only there) | ✅ | Goal, stats, heatmap, AI insights unchanged |
| Rename Journal → Trail (user-facing) | ✅ | Tab, book page section, copy; `?tab=journal` + `/journal/` redirect |
| Trail book-title picker (searchable) | ✅ | `TrailPanel` — searchable list, no inline session dump |
| Trail session detail + back nav | ✅ | Books → sessions (by read #) → full session detail |
| Direct-to-Read `pages_read` fix | ✅ | `setBookShelfStatus` sets `progress_pages` to `page_count` when known |
| Reading completion expansion (Tasks 9–22) | ✅ | `completeReadingSession`, missing page count UI, migration `20260723140000` |
| Centralized completion service | ✅ | `apps/web/src/lib/services/completeReadingSession.ts` + mobile mirror |
| Missing page count dialog | ✅ | `MissingPageCountDialog` — web shelf/search direct-to-Read |
| Backfill broken completions | ✅ | Migration + `scripts/repair-invalid-reading-completions.sql` |
| Web unit tests | ✅ | `vitest` — `readingCompletion.test.ts`, trail/reading room tabs |

---

## Phase 3 — Community ✅

### 3.1 Feed

| Item | Status | Notes |
|------|--------|-------|
| Chronological activity sort | ✅ | For You activity feed sorted by `created_at` |
| Card spacing & typography | ✅ | `FeedCard` + `space-y-6` on feed lists |
| Review ratings on activity cards | ✅ | Star display for review events |
| Trending sidebar on Feed | ✅ | `TrendingNewsletterPanel` (desktop sidebar) |
| Post reactions | ✅ | Already on `PostCard` (likes) |

### 3.2 Messaging

| Item | Status | Notes |
|------|--------|-------|
| DMs | ✅ | `/messages/` — existing |
| Group chats | ✅ | Conversation `type: group` — existing |

### 3.3 Events calendar

| Item | Status | Notes |
|------|--------|-------|
| Book clubs / signings / challenges calendar | 🔴 Future | Book clubs exist (`/clubs/`); no calendar UI yet |

### 3.4 Trending & community ratings

| Item | Status | Notes |
|------|--------|-------|
| Trending books / most shelved / most reviewed | ✅ | `fetchTrendingSections` on Feed sidebar |
| Mobile trending section | ✅ | `TrendingBooksSection` on mobile For You feed |
| Bookmarked community rating on book pages | ✅ | `CommunityRatingDisplay` (web + mobile) |
| Public profile deduplication | ✅ | `/reader/` — identity + top-3 shelf preview only |

### 3.5 Remaining Phase 3 work

| Item | Status | Notes |
|------|--------|-------|
| Events calendar UI | ⚪ | Deferred |
| Personalized activity ranking toggle | ⚪ | Replaced with chronological for clarity |

---

## Phase 4 — Premium architecture 🟡

### 4.1 Data model

| Item | Status | Notes |
|------|--------|-------|
| `user_subscriptions` table | ✅ | Migration `20260722120000_user_subscriptions.sql` |
| RLS (owner-only read/write) | ✅ | Separate table — not on public `profiles` select |
| Profile backfill trigger | ✅ | Auto-create row on profile insert |

### 4.2 Feature gating

| Item | Status | Notes |
|------|--------|-------|
| `canAccessFeature()` helper | ✅ | `packages/utils/subscription.ts` |
| `useSubscription` hook (web) | ✅ | `apps/web/src/lib/hooks/useSubscription.ts` |
| Premium lock component | ✅ | `PremiumFeatureLock` |
| Upgrade modal | ✅ | `UpgradeModal` |
| Upgrade page | ✅ | `/upgrade/` |
| Advanced analytics gate | ✅ | Reading Room → Progress → Activity heatmap |
| AI insights placeholder gate | ✅ | Reading Room → Progress → AI insights section |

### 4.3 Remaining Phase 4 work

| Item | Status | Notes |
|------|--------|-------|
| Stripe checkout (web) | ✅ | `/upgrade/` probes availability; Subscribe CTA when `STRIPE_*` secrets set — see `docs/STRIPE_SETUP.md` |
| App Store / Google Play (mobile) | ⚪ | Upgrade screen scaffolded; IAP not integrated |
| Webhook signature verification | ⚪ | `subscription-webhook` Edge Function stub deployed path only |
| Admin manual grant UI | ⚪ | Service-role / SQL updates for now |

### 4.4 Billing scaffold (July 2026)

| Item | Status | Notes |
|------|--------|-------|
| `subscription-webhook` Edge Function | ✅ | Stub upserts `user_subscriptions` via service role |
| Webhook secret header | ✅ | `x-subscription-webhook-secret` + `SUBSCRIPTION_WEBHOOK_SECRET` |
| Mobile `useSubscription` hook | ✅ | Mirrors web; TanStack Query |
| Mobile premium gates | ✅ | `ReadingInsightsSection` on Reading Room home |
| Mobile upgrade screen | ✅ | `/(app)/upgrade` from settings + profile |
| Premium badge (web + mobile) | ✅ | Profile + settings when subscribed |
| Upgrade page copy | ✅ | Feature list, cross-platform note, billing providers named |

---

## Phase 5 — UI refresh 🟡

Incremental polish on high-traffic pages. Purple palette and gradients on headers/heroes only; cards stay white.

| Item | Status | Notes |
|------|--------|-------|
| `.surface-card` utility | ✅ | Shared rounded corners, shadow, hover depth |
| Dashboard cards | ✅ | `DashboardCard` uses surface-card |
| Library header | ✅ | `feed-header-gradient` hero |
| Profile header + cards | ✅ | Gradient header, surface-card sections |
| Feed | ✅ | Already uses gradient header (prior work) |
| Reading Room | ✅ | Existing `reading-room-bg` gradient |
| Button hover polish | ✅ | `ButtonLink` lift + shadow |
| Mobile SectionCard shadow | ✅ | Matches web card depth |
| Mobile button press feedback | ✅ | Scale on press |
| Search bars (web + mobile) | ✅ | Pill `.search-input`, focus glow, SVG icon on feed search |
| Forms (auth, review) | ✅ | `.form-panel` on login/signup; rounded-xl inputs with shadow |
| Nav / bottom bar polish | ✅ | Active pill states, navbar shadow, mobile tab highlight |
| Feed / messages surface cards | ✅ | `FeedCard`, `PostComposer`, thread page use `.surface-card` |
| Feed skeleton loaders | ✅ | `PostCardSkeleton` / `FeedCardSkeleton` replace blank spinners |
| Mobile feed/library polish | ✅ | `ScreenGradientWash` on library; card shadows on feed posts |

---

## Phase 6 — Performance 🟡

| Item | Status | Notes |
|------|--------|-------|
| Performance audit doc | ✅ | `docs/PERFORMANCE_AUDIT.md` |
| Gif picker code split | ✅ | `GifSearchPickerLazy` — dynamic import |
| Feed hydration N+1 fix | ✅ | Map-based lookup in `hydrateFeedItems` |
| Book cover lazy loading | ✅ | `loading="lazy"` on non-priority covers |
| Messages fetch cap | ✅ | Last 200 messages per thread |
| FeedCard memoization | ✅ | `React.memo` |
| Feed skeleton loaders | ✅ | See Phase 5 |
| Library virtualization | ⚪ | Deferred until large libraries reported |
| Message cursor pagination | ⚪ | Deferred — 200-msg cap for now |
| Bundle analyzer pass | ⚪ | Deferred |

---

## Phase 7 — Database ✅

| Item | Status | Notes |
|------|--------|-------|
| Schema audit (tables, FKs, indexes, constraints) | ✅ | 44 migrations; see `DATABASE_SCHEMA.md` |
| Duplicate prevention | ✅ | Books, shelves (name+slug), reviews (per read), user_books |
| Hot-path indexes | ✅ | Migration `20260723120000_phase7_schema_indexes.sql` |
| Schema documentation | ✅ | `docs/DATABASE_SCHEMA.md` |

---

## Phase 8 — Security ✅

| Item | Status | Notes |
|------|--------|-------|
| RLS audit (all user-data tables) | ✅ | See `SECURITY_AUDIT.md` |
| Activity visibility RLS fix | ✅ | `activity_visible_to_viewer()` |
| Private message attachments | ✅ | Bucket private + signed URLs (web + mobile) |
| `post_likes` / note categories RLS | ✅ | Visibility-gated SELECT |
| Auth flow verification | ✅ | Login, signup, forgot/reset password |
| Input validation | ✅ | Length limits on messages, posts, reviews, passwords |
| Rate limiting stub | ✅ | `rate-limit-stub` Edge Function |
| Security documentation | ✅ | `docs/SECURITY_AUDIT.md` |

---

## Phase 9 — Responsive QA ✅

| Item | Status | Notes |
|------|--------|-------|
| Key pages audit | ✅ | Dashboard, Reading Room, Library, Feed, Profile, Messages, Search, Book, Auth |
| Message composer / bottom nav overlap | ✅ | Sticky offset on mobile |
| Feed pill tab overflow | ✅ | Horizontal scroll |
| Mobile app spot-check | ✅ | Library + feed layouts OK |
| QA documentation | ✅ | `docs/RESPONSIVE_QA.md` |

---

## Phase 10 — Production hardening ✅

| Item | Status | Notes |
|------|--------|-------|
| Route audit (30 pages) | ✅ | All `apps/web/src/app/**/page.tsx` resolve |
| SEO metadata on key pages | ✅ | Per-route `layout.tsx` metadata |
| Accessibility | ✅ | Nav `aria-label`, bottom nav `aria-current`, modal focus trap |
| Env validation | ✅ | `scripts/validate-env.mjs` — `NEXT_PUBLIC_SUPABASE_*` required |
| Performance regression check | ✅ | Phase 6 optimizations preserved |
| Progress tracker update | ✅ | This file |

---

## Pre-refinement baseline (MVP — complete)

Auth, search, library, reviews, feed, follows, clubs, messaging, notifications, import, deploy — all ✅.

---

## Related docs

| Doc | Path |
|-----|------|
| Architecture (comprehensive) | `docs/BOOKMARKED_ARCHITECTURE.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| Security audit | `docs/SECURITY_AUDIT.md` |
| Responsive QA | `docs/RESPONSIVE_QA.md` |
| Technical debt | `docs/TECHNICAL_DEBT.md` |
| Performance audit | `docs/PERFORMANCE_AUDIT.md` |
| Shelf icon audit | `docs/SHELF_ICON_AUDIT.md` |
| Master task list (MVP era) | `docs/project/MASTER_TASK_LIST.md` |

**Last updated:** July 2026
