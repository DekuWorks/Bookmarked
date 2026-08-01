# Bookmarked — Project Progress

> **Phase 0 audit** — July 23, 2026. Live: [bookmarked.online](https://bookmarked.online)

This tracker maps the **post-MVP refinement phases** (Phases 1–10) against the actual codebase. For MVP-era history see `docs/project/MASTER_TASK_LIST.md`.

**Legend:** ✅ Done · 🔄 In progress · ⬜ Pending

---

## Phase overview

| Phase | Name | Status | Summary |
|-------|------|--------|---------|
| 1 | Navigation | ✅ | Web + native iOS primary nav shipped; `/dashboard/` redirects to Reading Room; Home tabs evenly distributed |
| 2 | Reading depth | ✅ | Web + native iOS parity: 6 Reading Room tabs, completion auto-tags, Trail, notes, reviews, History |
| 3 | Community | 🔄 | Feed, messaging, clubs, events calendar shipped; polish ongoing |
| 4 | Premium | 🔄 | Stripe web + iOS IAP wired; Apple JWS verification pending |
| 5 | UI refresh | ✅ | Gradients, surface cards, branding on web + mobile |
| 6 | Performance | ✅ | Audit + N+1 fixes + lazy loading; virtualization deferred |
| 7 | Database | ✅ | 55 migrations, indexes, `docs/DATABASE_SCHEMA.md` |
| 8 | Security | ✅ | RLS hardening, private message attachments, `docs/SECURITY_AUDIT.md` |
| 9 | Responsive QA | ✅ | Web responsive + mobile layout; premium/upgrade mobile pass |
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
| Reading Room reviews tab (web) | ✅ | `ReviewsPanel.tsx` — two-column cards, 5 filters, share-to-feed |
| Dedicated reviews UI (mobile) | ✅ | `ReviewsPanel.tsx` parity + book detail `RateReviewSheet` |

### 2.3 Trail / Notes

| Item | Status | Notes / references |
|------|--------|-------------------|
| Per-book Trail sessions | ✅ | `ReadingJournalSection.tsx` (legacy internal name) · `reading_sessions` |
| Reading notes | ✅ | `reading_notes` · `/notes/` (web) · `apps/mobile/app/(app)/notes.tsx` |
| Trail tab (web + iOS) | ✅ | `TrailPanel.tsx` — tab label **Trail**; legacy `?tab=journal` alias retained only for old links |
| Reading Room tabs (web + iOS) | ✅ | Overview, Progress, Trail, Notes, Reviews, History — `readingRoomTabs.ts` |
| History tab | ✅ | `HistoryPanel.tsx` — sorted 10-book preview, full read shelf link |

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
| Trending sidebar / section | ✅ | Weighted activity scores + community ratings on trending rows (web + mobile) |
| Community rating on book pages | ✅ | `CommunityRatingDisplay` (web) · labeled stars on mobile book detail + trending cards |
| Direct-to-Read page count (web) | ✅ | `BookShelfActions`, `SearchResultCard`, `setBookShelfStatus`, `addCatalogBookToShelf` → `completeReadingSession` + `MissingPageCountDialog` |
| Goodreads import → read shelf | ✅ | Web + mobile `goodreadsImport.ts` routes through `completeReadingSession` with CSV page counts |
| `needsMissingPageCountPrompt` shared | ✅ | `packages/utils/readingCompletion.ts` (web + mobile re-export) |
| Feed search | ✅ | `feedSearch.ts` — readers, books, posts (web + mobile) |
| Goodreads import | ✅ | `goodreadsImport.ts` — web profile settings + mobile account settings |
| Events calendar | ✅ | `book_club_events` migration · `/events/` · club event panels (web + mobile) |
| Notifications | ✅ | `notifications` table · bell + `/notifications/` |

---

## Fourth Sprint — Home Tab ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Even Home tab distribution | ✅ | Web `ReadingRoomTabs` uses a responsive equal-width tab grid; native iOS `SegmentedTabs` uses compact equal-width pills |
| Trail terminology | ✅ | User-facing labels now use **Trail**; legacy `journal` URL/query aliases remain compatibility-only |
| Trail layout alignment | ✅ | Web Trail owns the same rounded card shell, spacing, loading, and empty-state language as History |
| History 10-book display cap | ✅ | Shared `selectHistoryBooks()` applies filter → sort → limit 10 on web + native iOS |
| History data preservation | ✅ | Display-only cap; no finished books, sessions, notes, reviews, stats, or shelves are deleted |
| Database pagination review | ⚠️ | Current Reading Room loads full library for stats/goals; true DB-paginated History across title/author/date sorts needs a dedicated Supabase RPC/view |

---

## Sprint 5 — Feed ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Full-width feed | ✅ | Web sidebar removed; discovery cards interleaved in-stream |
| Inline discovery cards | ✅ | Trending / Most Shelved / Most Reviewed via `FeedDiscoveryCard` + `interleaveFeedWithDiscovery` |
| Like sparkles | ✅ | Web `LikeSparkles` + mobile Reanimated particles; like-only |
| Delete own activity | ✅ | `deleteOwnActivity` + confirmation on web FeedCard; activity row only |
| Share → Feed / Message | ✅ | `ShareContentModal` / `ShareContentSheet` with search, followers, recent, optional note, delivery toast |
| Left-aligned text | ✅ | Feed posts/activity + Reading Room activity rows |

---

## Sprint 6 — Library ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Search → custom shelves | ✅ | Web `SearchResultCard` and native iOS Search add catalog results directly to collections |
| Permanent DNF shelf | ✅ | Built-in `dnf` status, migration of legacy DNF collections, and database guardrails prevent custom DNF shelves |
| Built-in shelf labels | ✅ | User-facing labels are TBR, Currently Reading, Finished, and DNF; stable status keys remain unchanged |
| Library layout polish | ✅ | Centered Sort by label, denser responsive grid view, and more readable bookshelf spines on web + iOS |
| Clear Shelf | ✅ | Web confirmation modal and native iOS confirmation remove only that shelf's associations and confirm success |

---

## Sprint 7 — Book Clubs expansion ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Club community tabs | ✅ | Overview, Discussions, Schedule, Bookshelf, Members, and Stats on web + native iOS |
| Current Read + bookshelf | ✅ | Current book remains owner-managed; bookshelf surfaces current and discussion-linked books without duplicating book records |
| Reading schedule + calendar events | ✅ | Existing `book_club_events` powers Schedule; event forms support Zoom, Google Meet, and other HTTPS meeting links |
| Membership and public sharing | ✅ | Existing member management, public/private RLS, and web share-link flow retained |
| Club statistics | ✅ | Member, discussion, and surfaced-book totals in each client |

---

## Sprint 8 — Audiobooks ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Audiobook data model | ✅ | `20260801164028_sprint_8_audiobooks.sql` adds format, duration, listening progress, and session fields |
| Listening progress | ✅ | Web `ReadingProgressPanel` and native iOS book detail use listening time for audiobook metadata |
| Listening history and activity | ✅ | Audiobook saves create `reading_sessions` rows and activity events with listening metadata |
| Provider research | ✅ | `docs/AUDIOBOOK_RESEARCH.md` documents safe Audible, Spotify, and timer follow-up paths |

---

## Sprint 9 — Goodreads CSV import improvements ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Import preview and validation | ✅ | Web + native iOS show parsed row counts and a sample before import |
| Missing completion dates | ✅ | Finished rows with no `Date Read` require confirmation and are skipped; import time is never used as a completion date |
| Validation summary | ✅ | Existing post-import summaries retain imported, updated, skipped, error, and row-level details |
| Undo import | ✅ | Web + native iOS retain a local import-batch snapshot and remove only newly created shelf entries on undo |

---

## Phase 4 — Premium 🔄

| Item | Status | Notes / references |
|------|--------|-------------------|
| `user_subscriptions` table + RLS | ✅ | `20260722120000_user_subscriptions.sql` · `apple_original_transaction_id` (`20260723190000`) |
| `canAccessFeature()` | ✅ | `packages/utils/subscription.ts` |
| Web subscription hook + gates | ✅ | `useSubscription.ts` · `PremiumFeatureLock` · `/upgrade/` |
| Mobile subscription hook + gates | ✅ | `apps/mobile/src/hooks/useSubscription.ts` · `/(app)/upgrade` |
| Premium features gated | ✅ | `advanced_analytics`, `ai_insights` |
| AI reading insights (OpenAI) | ✅ | `packages/utils/aiInsights.ts` · `supabase/functions/ai-insights` · web + mobile `AiInsightsPanel` · see `docs/AI_INSIGHTS.md` |
| Stripe checkout (web) | ✅ | `create-checkout-session` + `/upgrade/` Subscribe CTA; test keys active — live cutover in `docs/PRODUCTION_BILLING.md` |
| App Store IAP (iOS) | ✅ | `expo-iap` + `useAppleIap` + `apple-iap-verify` — see `docs/APP_STORE_IAP.md` |
| Google Play IAP | ⬜ | Android uses web Stripe link from upgrade screen |
| Mobile web upgrade UX | ✅ | `/upgrade/` responsive layout; Stripe checkout works in mobile Safari |
| Webhook signature verification | 🔄 | Stripe HMAC; Apple ASN decodes JWS (full cert verification deferred) |
| Admin grant UI | ⬜ | Manual SQL / service role |

---

## Membership tiers ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Free / Plus / Home access matrix | ✅ | `packages/utils/subscription.ts` formalizes feature access; legacy Premium subscribers migrate to Plus |
| Tier persistence | ✅ | `20260801164113_membership_tiers.sql` upgrades `user_subscriptions` constraints and rows |
| Stripe + IAP compatibility | ✅ | Existing paid product/webhook activates Plus; Home is supported by the tier model for catalog/manual provider rollout |
| Tier-aware upgrade copy | ✅ | Web + native iOS membership screens show Free, Bookmarked Plus, and Bookmarked Home benefits |

---

## Reading DNA ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Shared DNA computation | ✅ | `packages/utils/readingDna.ts` derives genre, vibe, emotion, trope, and habit traits from reader data |
| Free top three traits | ✅ | Profile Reading DNA section on web + iOS |
| Plus DNA dashboard hooks | ✅ | Full dashboard state, AI insight, and book-match gates surfaced in profile UI |
| Home DNA foundations | ✅ | Monthly DNA update, DNA Match %, and Reader Map filter copy/stubs gated for Home |

---

## Final QA ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Release checklist | ✅ | `docs/FINAL_QA_CHECKLIST.md` covers browser, iPhone, a11y, performance, subscriptions, data, regression, and deploy verification |
| Release candidate execution | ⬜ | Run and record checklist results before production release |

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
| Native iOS layout spot-check | ✅ | Feed, library, messages, composer safe-area |
| Message composer / tab bar overlap | ✅ | Sticky offsets |
| Premium upgrade + pill tabs (mobile web) | ✅ | `/upgrade/` padding, pill-tab scroll, premium lock tap targets |

---

## Phase 10 — Production hardening ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Static export deploy | ✅ | `.github/workflows/deploy.yml` → GitHub Pages |
| Env validation at build | ✅ | `apps/web/scripts/validate-env.mjs` |
| SEO metadata | ✅ | Per-route `layout.tsx` metadata |
| Route audit | ✅ | 30+ web pages under `apps/web/src/app/` |
| iOS TestFlight pipeline | 🔄 | EAS build 8 in progress; build 9 queued from `fbffabe+` (trending/premium polish) |

---

## Cross-cutting: Mobile parity ✅

| Area | Web | Mobile | Gap |
|------|-----|--------|-----|
| Core reading loop | ✅ | ✅ | — |
| Reading Room tabs (6) | ✅ | ✅ | — |
| AI insights | ✅ | ✅ | — |
| Advanced analytics | ✅ `ReadingActivityPanel` | ✅ `ReadingActivityPanel` + heatmap | — |
| Completion auto-tags | ✅ | ✅ | — |
| Direct-to-Read page count | ✅ | ✅ | — |
| Feed search | ✅ | ✅ | — |
| Goodreads import | ✅ | ✅ | — |
| Events calendar | ✅ | ✅ | — |
| Pinned messages (single pin UI) | ✅ | ✅ | — |
| Session notes on book detail | ✅ | ✅ | — |
| Community ratings on trending | ✅ | ✅ | — |
| Premium upgrade | ✅ Stripe | ✅ IAP + web link | Apple JWS verify pending |
| Upgrade page (mobile web) | ✅ responsive | N/A (native screen) | — |
| Public library browse | ✅ | ✅ | — |
| Shared service code | 49 modules | 33 modules | `communityRating` + trending in `packages/utils` |

---

## Sprint 10 — Platform polish ✅

| Item | Status | Notes / references |
|------|--------|--------------------|
| Completion celebration | ✅ | Full-screen sparkle acknowledgement after completing a book on web + native iOS |
| Reading streak integrity | ✅ | Streaks now derive only from meaningful `reading_sessions` (pages or a note), not shelf/import/metadata activity |
| Notification preferences | ✅ | Messages, follows, likes, comments, and post-notification controls on web + native iOS |
| Remember Me persistence | ✅ | Web storage selection and native AsyncStorage Supabase session persistence |
| Community content tags | ✅ | Finished readers can vote for content signals; aggregate view and RLS migration added |
| Public profile reviews | ✅ | Public-only review sections on web + native iOS reader and own-profile screens include All / Rated / Written filters and spoiler reveal controls |
| Tag search / dark-mode audit / messaging polish | ⚠️ | Foundations shipped; continued visual QA can iterate in follow-up PRs |

## Sprint 11 — Book Series ✅

| Item | Status | Notes / references |
|------|--------|--------------------|
| Public series reading order | ✅ | Existing web + native iOS series pages use catalog `series_name` / `series_position` and viewer shelf status |
| Entry types, verification, spreadsheet import, duplicate review, admin tooling | ✅ | Curated series schema validates entry types; web + native iOS profile settings preview CSV imports, match title + author, skip duplicate entries, and create contributor-owned series shells |

## Sprint 12 — Native iOS shelf fixes ✅

| Item | Status | Notes / references |
|------|--------|--------------------|
| DNF movement preserves custom shelves | ✅ | Moving to DNF changes the built-in shelf without deleting custom-shelf memberships |
| Direct Total Pages editing | ✅ | Native book detail can correct the shared catalog page count |

---

## Related documentation

| Doc | Path |
|-----|------|
| Architecture (this audit) | `BOOKMARKED_ARCHITECTURE.md` |
| Technical debt | `TECHNICAL_DEBT.md` |
| Extended progress (prior) | `docs/PROJECT_PROGRESS.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| Master task list (MVP) | `docs/project/MASTER_TASK_LIST.md` |

**Last updated:** August 1, 2026 (Sprints 10–12 platform polish, series foundation, and native shelf fixes)

---

## Next up (recommended)

| Priority | Item | Notes |
|----------|------|-------|
| P1 | Submit EAS build 8 to TestFlight | Auto-submit monitor running; `eas submit` after build 8 finishes |
| P1 | EAS build 9 (trending/premium) | Started from `fbffabe+`; submit when finished |
| P1 | Stripe live mode cutover | Run `setup-stripe-catalog.sh --live`; set live secrets — see `docs/PRODUCTION_BILLING.md` |
| P1 | App Store Connect IAP review | Production subscription `com.dekuworks.bookmarked.premium.monthly`; sandbox TestFlight test — see `docs/APP_STORE_IAP.md` |
| P1 | OpenAI API key | Set `OPENAI_API_KEY` for server-side AI insights — see `docs/AI_INSIGHTS.md` |
| P2 | Extract duplicated services to `packages/` | `communityRating` + trending weights moved; 25 modules remain |
| P2 | Library virtualization | Deferred until large libraries reported |
