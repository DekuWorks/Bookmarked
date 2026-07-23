# Bookmarked — Project Progress

> **Phase 0 audit** — July 23, 2026. Live: [bookmarked.online](https://bookmarked.online)

This tracker maps the **post-MVP refinement phases** (Phases 1–10) against the actual codebase. For MVP-era history see `docs/project/MASTER_TASK_LIST.md`.

**Legend:** ✅ Done · 🔄 In progress · ⬜ Pending

---

## Phase overview

| Phase | Name | Status | Summary |
|-------|------|--------|---------|
| 1 | Navigation | ✅ | Web + mobile primary nav shipped; `/dashboard/` redirects to Reading Room |
| 2 | Reading depth | ✅ | Web + mobile parity: 6 Reading Room tabs, completion auto-tags, session notes |
| 3 | Community | 🔄 | Feed, messaging, clubs, trending live; events calendar not built |
| 4 | Premium | 🔄 | Schema + gates + webhook stub; Stripe / IAP not wired |
| 5 | UI refresh | ✅ | Gradients, surface cards, branding on web + mobile |
| 6 | Performance | ✅ | Audit + N+1 fixes + lazy loading; virtualization deferred |
| 7 | Database | ✅ | 55 migrations, indexes, `docs/DATABASE_SCHEMA.md` |
| 8 | Security | ✅ | RLS hardening, private message attachments, `docs/SECURITY_AUDIT.md` |
| 9 | Responsive QA | ✅ | Web responsive + mobile layout pass; `docs/RESPONSIVE_QA.md` |
| 10 | Production hardening | ✅ | SEO metadata, env validation, route audit |

---

## Phase 1 — Navigation ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Dashboard (legacy) | ✅ | `apps/web/src/app/(app)/dashboard/page.tsx` → redirects to `/reading-room/` |
| Library tab / route | ✅ | Web: `/library/` in desktop nav · Mobile: `apps/mobile/app/(app)/library/` (hidden tab, linked from Home) |
| Reading Room as Home | ✅ | Web bottom nav + desktop logo → `/reading-room/` · Mobile tab `index` = Reading Room |
| Feed tab | ✅ | `apps/web/src/app/(app)/feed/page.tsx` · `apps/mobile/app/(app)/feed.tsx` |
| Profile tab | ✅ | `apps/web/src/app/(app)/profile/page.tsx` · `apps/mobile/app/(app)/profile.tsx` |
| Mobile bottom nav (5 tabs) | ✅ | Web: `MobileBottomNav.tsx` (Home, Feed, Search, Messages, Profile) · Mobile: `FloatingTabBar.tsx` |
| Desktop app nav | ✅ | `Navbar.tsx` — Home, Feed, Library, Search, Clubs, Messages, Profile |
| Profile setup gate | ✅ | Web: `ClientAuthGuard.tsx` · Mobile: `apps/mobile/app/(app)/_layout.tsx` |

---

## Phase 2 — Reading ✅

### 2.1 Finish workflow

| Item | Status | Notes / references |
|------|--------|-------------------|
| Mark finished → Read shelf | ✅ | Web: `markBookFinished` / `MarkFinishedDialog` · Mobile: `MarkFinishedSheet` |
| Centralized completion service | ✅ | `apps/web/src/lib/services/completeReadingSession.ts` · `apps/mobile/src/services/completeReadingSession.ts` |
| Missing page count prompt | ✅ | Web: `MissingPageCountDialog` · Mobile: `needsMissingPageCountPrompt` |
| Post-finish rate prompt | ✅ | Web: `RateBookPrompt` · Mobile: `RateBookPromptSheet` |
| Reading sessions + mood | ✅ | Migration `20260721120000_reading_sessions_mood.sql` · `SessionMoodPicker` (web) |

### 2.2 Ratings & reviews

| Item | Status | Notes / references |
|------|--------|-------------------|
| Half-star ratings | ✅ | DB constraint in `20260709120000_phase2_community_reading.sql` · `StarDisplay` / `StarRatingInput` |
| Multiple reviews per re-read | ✅ | `read_number` on `reviews` · `AddAnotherReadButton` · `reviews_user_book_read_unique` |
| Book edition on reviews | ✅ | `reviews.edition` · preset chips in `ReviewForm.tsx` |
| Advanced category ratings | ✅ | `reviews.plot`, `characters`, etc. · `ReviewForm` advanced mode |
| Feelings / mood tags | ✅ | `reviews.feelings` · `REVIEW_FEELINGS` constant |
| Rating emoji (Fable-style) | ✅ | Migration `20260713130000_review_rating_emoji.sql` |
| Reading Room reviews tab (web) | ✅ | `ReadingRoomTabs.tsx` — filters, monthly grouping |
| Dedicated reviews UI (mobile) | ✅ | Reading Room reviews tab + book detail `RateReviewSheet` |

### 2.3 Journal / Trail / Notes

| Item | Status | Notes / references |
|------|--------|-------------------|
| Per-book journal (sessions) | ✅ | `ReadingJournalSection.tsx` · `reading_sessions` |
| Reading notes | ✅ | `reading_notes` · `/notes/` (web) · `apps/mobile/app/(app)/notes.tsx` |
| Trail tab (web) | ✅ | `TrailPanel.tsx` — tab label **Journal** (legacy `?tab=journal` alias) |
| Reading Room tabs (web) | ✅ | Overview, Progress, Journal, Notes, Reviews, History — `readingRoomTabs.ts` |
| Reading Room tabs (mobile) | ✅ | Same 6 tabs — `apps/mobile/app/(app)/index.tsx` |
| History tab | ✅ | Web + mobile history panels |

### 2.4 Streaks & auto tags

| Item | Status | Notes / references |
|------|--------|-------------------|
| Reading streak | ✅ | `ReadingStreakCard` · `computeReadingStreak` in `analytics.ts` |
| Auto completion tags | ✅ | `packages/utils/completionTags.ts` · applied in web + mobile `completeReadingSession` |

### 2.5 Catalog (Open Library / ISBNdb)

| Item | Status | Notes / references |
|------|--------|-------------------|
| ISBNdb search (primary) | ✅ | Edge Function `supabase/functions/isbndb/` · `isbndb.ts` (web + mobile) |
| Open Library compatibility layer | ✅ | `openLibrary.ts` re-exports ISBNdb adapters |
| Google Books cover fallback | ✅ | `covers.ts` |
| Edition picker | ✅ | Search + book detail edition flows |

---

## Phase 3 — Community 🔄

| Item | Status | Notes / references |
|------|--------|-------------------|
| Social feed (posts + activity) | ✅ | `socialFeed.ts` · `/feed/` · mobile `FeedScreen` |
| Follow graph | ✅ | `follows.ts` · `FollowButton` |
| Public reader profiles | ✅ | `/reader/?username=` (web) · `reader/[username]/` (mobile) |
| Public reader library | ✅ | `/reader-library/` (web) · `reader/.../library/` (mobile) |
| Direct + group messaging | ✅ | Migration `009_messaging.sql` · `/messages/` · mobile `messages/` |
| Message reactions & replies | ✅ | `20260723022711_message_reactions_and_replies.sql` |
| Book clubs | ✅ | `20260713140000_book_clubs.sql` · `/clubs/` · mobile `clubs/` |
| Trending sidebar / section | ✅ | `trending.ts` · `TrendingNewsletterPanel` (web) · `TrendingBooksSection` (mobile) |
| Community rating on book pages | ✅ | `CommunityRatingDisplay` (web + mobile) |
| Feed search | ✅ | `feedSearch.ts` — readers, books, posts (web + mobile) |
| Goodreads import | ✅ | `goodreadsImport.ts` — web profile settings + mobile account settings |
| Events calendar | ⬜ | Clubs exist; no calendar UI |
| Notifications | ✅ | `notifications` table · bell + `/notifications/` |

---

## Phase 4 — Premium 🔄

| Item | Status | Notes / references |
|------|--------|-------------------|
| `user_subscriptions` table + RLS | ✅ | `20260722120000_user_subscriptions.sql` |
| `canAccessFeature()` | ✅ | `packages/utils/subscription.ts` |
| Web subscription hook + gates | ✅ | `useSubscription.ts` · `PremiumFeatureLock` · `/upgrade/` |
| Mobile subscription hook + gates | ✅ | `apps/mobile/src/hooks/useSubscription.ts` · `/(app)/upgrade` |
| Premium features gated | ✅ | `advanced_analytics`, `ai_insights` |
| Stripe checkout (web) | ⬜ | Upgrade page informational only |
| App Store / Google Play IAP | ⬜ | No SDK integration |
| Webhook signature verification | ⬜ | `subscription-webhook` Edge Function is a stub |
| Admin grant UI | ⬜ | Manual SQL / service role |

---

## Phase 5 — UI refresh ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Design tokens & palette | ✅ | `apps/web/src/app/globals.css` · `docs/ui/DESIGN_SYSTEM.md` |
| Gradient headers / shell | ✅ | `.feed-header-gradient`, `.app-shell-gradient`, `ScreenGradientWash` (mobile) |
| Surface cards | ✅ | `.surface-card` utility · `SectionCard` (mobile) |
| Branding components | ✅ | `BookmarkedLogo`, `SavedBookBadge` · `docs/BRANDING_ASSET_AUDIT.md` |
| Custom shelf icons | ✅ | `docs/SHELF_ICON_AUDIT.md` · `ShelfIcon` (web + mobile) |
| Auth / form polish | ✅ | `.form-panel`, pill search inputs |
| Nav active states | ✅ | Bottom nav pill animation (web) · `FloatingTabBar` (mobile) |

---

## Phase 6 — Performance ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Performance audit | ✅ | `docs/PERFORMANCE_AUDIT.md` |
| Feed N+1 hydration fix | ✅ | `socialFeed.ts` map-based lookup |
| Lazy GIF picker | ✅ | `GifSearchPickerLazy.tsx` |
| Cover lazy loading | ✅ | `loading="lazy"` on `BookCover` |
| Feed skeleton loaders | ✅ | `PostCardSkeleton`, `FeedCardSkeleton` |
| Library virtualization | ⬜ | Deferred |
| Message cursor pagination | ⬜ | 200-message cap for now |
| Bundle analyzer | ⬜ | Deferred |

---

## Phase 7 — Database ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| 55 forward migrations | ✅ | `supabase/migrations/` |
| RLS on all public tables | ✅ | See `docs/SECURITY_AUDIT.md` |
| Hot-path indexes | ✅ | `20260723120000_phase7_schema_indexes.sql` |
| Schema documentation | ✅ | `docs/DATABASE_SCHEMA.md` |

---

## Phase 8 — Security ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| RLS audit + fixes | ✅ | `20260723130000_phase8_security_rls.sql` |
| Private message attachments | ✅ | Bucket private + signed URLs |
| Input length validation | ✅ | Messages, posts, reviews |
| Rate limit stub | ✅ | `supabase/functions/rate-limit-stub/` |
| Security documentation | ✅ | `docs/SECURITY_AUDIT.md` |

---

## Phase 9 — Responsive QA ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Web responsive layouts | ✅ | Mobile-first Tailwind · bottom nav · `docs/RESPONSIVE_QA.md` |
| Mobile layout spot-check | ✅ | Feed, library, messages, composer safe-area |
| Message composer / tab bar overlap | ✅ | Sticky offsets |

---

## Phase 10 — Production hardening ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Static export deploy | ✅ | `.github/workflows/deploy.yml` → GitHub Pages |
| Env validation at build | ✅ | `apps/web/scripts/validate-env.mjs` |
| SEO metadata | ✅ | Per-route `layout.tsx` metadata |
| Route audit | ✅ | 30+ web pages under `apps/web/src/app/` |
| iOS TestFlight pipeline | 🔄 | `apps/mobile` EAS scripts; App Store submission in progress |

---

## Cross-cutting: Mobile parity ✅

| Area | Web | Mobile | Gap |
|------|-----|--------|-----|
| Core reading loop | ✅ | ✅ | — |
| Reading Room tabs | 6 tabs | 6 tabs | — |
| Completion auto-tags | ✅ | ✅ | — |
| Goodreads import | ✅ | ✅ | — |
| Feed search | ✅ | ✅ | — |
| Public library browse | ✅ | ✅ | — |
| Shared service code | 49 modules | 33 modules | 28同名 duplicated, not in `packages/` |

---

## Related documentation

| Doc | Path |
|-----|------|
| Architecture (this audit) | `BOOKMARKED_ARCHITECTURE.md` |
| Technical debt | `TECHNICAL_DEBT.md` |
| Extended progress (prior) | `docs/PROJECT_PROGRESS.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| Master task list (MVP) | `docs/project/MASTER_TASK_LIST.md` |

**Last updated:** July 23, 2026 (Phase 3 mobile parity: feed search + Goodreads import)

---

## Next up (recommended)

| Priority | Item | Notes |
|----------|------|-------|
| P1 | Events calendar | Clubs exist; no shared calendar UI — defer if multi-session |
| P1 | Stripe checkout (web) | Needs `STRIPE_*` secrets + webhook verification in Edge Function |
| P1 | App Store / Google Play IAP | Needs store SDK + receipt validation |
| P2 | Extract duplicated services to `packages/` | 28 modules; high effort |
| P2 | Library virtualization | Deferred until large libraries reported |
