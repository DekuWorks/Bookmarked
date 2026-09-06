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
| Like sparkles | ✅ | `BookmarkedLikeSparkles` (web CSS + iOS Reanimated); brand lilac/lavender; like-only; reduced-motion glow; compat `LikeSparkles` re-export |
| Discovery equal-height cards | ✅ | `DiscoveryBookCard` + reserved rating/preview/tag rows on web + iOS carousels |
| Saved badge flush top-left | ✅ | Shared `SavedBookBadge` / `BookCover` — top/left 0, z-20 above cover |
| Note location formatter | ✅ | `formatNoteLocation` → `Page X • Chapter Y`; wired all note UIs |
| NoteTag colored pills | ✅ | Shared `NoteTag` + `resolveNoteTagTone` (custom color column not in schema yet) |
| Home Notes: 5 + Open Full top | ✅ | DB `limit: 5`; Open Full Notes Page CTA above list |
| Full Notes → Home Notes | ✅ | Bottom “Return to Home Notes” → `/reading-room/?tab=notes` / `/?tab=notes` |
| Delete own activity | ✅ | `deleteOwnActivity` + confirmation on web FeedCard; activity row only |
| Share → Feed / Message | ✅ | `ShareContentModal` / `ShareContentSheet` with search, followers, recent, optional note, delivery toast |
| Left-aligned text | ✅ | Feed posts/activity + Reading Room activity rows |
| Feed image consistent sizing | ✅ | Shared `layoutFeedImageMedia` — contain, original ratio, max-height narrow + center. Web + iOS `FeedImageMedia` + new Full Image View |

---

## Sprint 6 — Library ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Search → custom shelves | ✅ | Web `SearchResultCard` and native iOS Search add catalog results directly to collections |
| Permanent DNF shelf | ✅ | Built-in `dnf` status, migration of legacy DNF collections, and database guardrails prevent custom DNF shelves |
| Built-in shelf labels | ✅ | User-facing labels are TBR, Currently Reading, Finished, and DNF; stable status keys remain unchanged |
| Library layout polish | ✅ | Centered Sort by label, denser responsive grid view, and more readable bookshelf spines on web + iOS |
| Clear Shelf | ✅ | Web confirmation modal and native iOS confirmation remove only that shelf's associations and confirm success |

### Sprint 6 — Final polish & bug fixes ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| DNF “Book not found” | ✅ | Library-first shelf moves (`user_books` before catalog); web `setBookShelfStatus` + iOS `setShelfStatus` |
| Shared DNF patch | ✅ | `packages/utils/shelfStatus.ts` — `dnf` flag, clear `finished_at`, preserve progress/history |
| DNF excluded from stats | ✅ | Books Finished / Pages Read / yearly goals via `countsTowardFinishedStats` |
| Shelf + book card typography | ✅ | Bookmarked serif display on shelf titles; stronger book card title/subtitle hierarchy (web + iOS) |
| Optimistic DNF UI | ✅ | Web `BookShelfActions`; iOS book detail query cache |
| Transparent shelf icons | ✅ | Web + iOS `ShelfIcon`; order TBR → Currently Reading → Finished → DNF |
| Borderless shelf icon system | ✅ | No rounded tile chrome; ~20% larger glyphs (34/68/152); `ShelfTitleRow` gap/alignment polish web + iOS |
| QA checklist | ✅ | `docs/SPRINT_6_POLISH.md` |

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

## Sprint — Book Club Community Hub ✅

Full hub sprint (Phases 1–30). Docs: `docs/BOOK_CLUB_CURRENT_STATE.md`, `BOOK_CLUB_DATABASE.md`, `BOOK_CLUB_PERMISSIONS.md`, `BOOK_CLUB_ROUTES.md`, `BOOK_CLUB_QA.md`, `WEB_UI_GUIDE.md`, `IOS_UI_GUIDE.md`, `RLS_AUDIT.md`, `RELEASE_CHECKLIST.md`.

| Wave | Scope | Status | Notes |
|------|-------|--------|-------|
| 0 | Phase 1 audit docs | ✅ | Requirement matrix + schema/permissions/routes/QA |
| 1 | Phases 2–3 schema + RLS | ✅ | `20260802150000_book_club_community_hub.sql` + notifications/discovery migration |
| 2 | Phases 4–7 landing/create/invite/share | ✅ | Web + iOS; public feed share |
| 3 | Phases 8–11, 17–21 club hub tabs | ✅ | Overview, forum discussions, chat, bookshelf, members, stats |
| 4 | Phases 12–16 schedule | ✅ | List + calendar sparkles, edit, meeting links, RSVP |
| 5 | Phases 22–23 notifications + discovery | ✅ | `type=club`, per-club prefs; Trending / Reading Your Books |
| 6 | Phases 24–28 polish | ✅ | Nav discoverability, calendar a11y, security docs |
| 7 | Phases 29–30 QA + cleanup | ✅ | Dead `ClubEventsPanel` removed; checklists ready |

**Apply migrations before prod use.** Manual QA: `docs/BOOK_CLUB_QA.md`. **No Android.** Deferred: nested replies >1, native video, iOS banner upload UI, native event datetime picker.

---

## Sprint 8 — Audiobooks ✅

| Item | Status | Notes / references |
|------|--------|-------------------|
| Audiobook data model | ✅ | `20260801164028_sprint_8_audiobooks.sql` adds format, duration, listening progress, and session fields |
| Mark a book as an audiobook | ✅ | Web `BookFormatToggle` on the book detail page + native iOS "Track as" pill on `book/[id].tsx`; both call a dedicated format-update action/service so `books.format` can actually be set — previously nothing in the UI could set it, so the listening UI below was unreachable |
| Listening progress | ✅ | Web `ReadingProgressPanel` and native iOS book detail use listening time for audiobook metadata once a book is marked as an audiobook |
| Listening history and activity | ✅ | Audiobook saves create `reading_sessions` rows and activity events with listening metadata |
| Library discoverability | ✅ | 🎧 badge on web `BookCard` (grid/shelf views) and native iOS `CoverTile` / My Books list |
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

## Sprint 13 — Home / Overview polish ✅

| Item | Status | Notes / references |
|------|--------|--------------------|
| Overview Title Capitalization | ✅ | Shared labels in `packages/utils/overviewCopy.ts`. Web `OverviewTab` + iOS `OverviewTab` / `ActivityFeed`. Book titles, authors, reviews, notes, posts, and DB copy are unchanged. Accessibility labels match visible Quick Action and section copy. |
| Recent Activity Layout | ✅ | Heading + “View all activity” are a centered stack (title, then link, then feed). Same heading token as other Overview sections: web `READING_ROOM_SECTION_HEADING_CLASS` (`text-lg font-semibold text-puce-red md:text-xl`) via `ReadingRoomSection`; iOS `SECTION_CARD_HEADING_CLASS` (`text-base font-bold leading-tight text-puce-red`) via `SectionCard`. `actionLayout="stacked"` is column-only on all breakpoints. Spacing: 6px heading→link (`gap-1.5`), 16px link→content (`mb-4`). Route, filters, sorting, and activity records are unchanged. |
| Currently Reading Add Book | ✅ | Full-card `+` slot on empty and populated Currently Reading rows (`AddBookCoverCard`). Shared `CURRENTLY_READING_CARD_SIZE`: web **220×356**, radius 12, padding 16, cover 112×168, plus icon 40; iOS **96×224**, radius 12, cover 96×144, plus icon 32. Used by real CR cards and Add Book. Options: **Choose from TBR** / **Search for a Book**. TBR uses `getUserLibraryBooks` + `selectWantToReadBooks`, then existing `setBookShelfStatus` (web) / `setShelfStatus` (iOS). Search uses `origin=home_overview_currently_reading`; add goes straight to Currently Reading via `addCatalogBookToShelf`. Cancel/back returns to Home → Overview. Analytics events reused existing `trackProductEvent` (no new platform). Overview shelf cover 80×120 contain frame was not changed. |
| Overview Tab – Quick Actions Button Colors | ⚠️ | Three equal filled cards shipped on web + iOS. A valid **fourth current Quick Action was not available** after replacing Search Books / Trail and removing Continue Reading; no fourth destination was invented. Reserved fill `#d18dbe` is unused. |

### Quick Actions (Sprint 13)

Shipped actions (same order, web + iOS):

| Card | Label | Color | Purple token | Web | iOS |
|------|-------|-------|--------------|-----|-----|
| 1 | Open Library | `#e7a4a6` | — | `/library/` | `/library` |
| 2 | Book Clubs | `#eb9f8e` | — | `/clubs/` | `/clubs` |
| 3 | Reading Challenges | `#B89DBB` | Official `--color-primary` light / `BRAND.primary` | `/challenges/` | `/challenges` |
| 4 | **Missing** | `#d18dbe` reserved | — | not invented | not invented |

- Shared config/copy: `packages/utils/overviewCopy.ts`, `packages/utils/overviewQuickActions.ts`
- Cards: web `QuickActionCard` + `OverviewTab`; iOS same names under `apps/mobile/src/components/reading-room/`
- Analytics (existing `trackProductEvent`): `quick_action_open_library`, `quick_action_book_clubs`, `quick_action_reading_challenges`
- Search, Trail, and Continue Reading remain elsewhere (nav Search tab, Reading Room Trail tab, Currently Reading row). They are not Quick Actions.
- Fourth-action STOP: current Quick Actions were Search Books, Continue Reading, Open Library, Trail. After the required replacements/removal only Open Library remained of the old set, and it is already one of the three required cards.

### Navigation / shelf transition (Add Book)

- Origin: `home_overview_currently_reading` (`packages/utils/currentlyReadingAdd.ts`)
- Web search: `/search/?origin=…&shelf=currently_reading` → success `replace /reading-room/`
- iOS search: `/search?origin=…&shelf=currently_reading` → success `replace /` + invalidate `["library", userId]`
- Normal Search / TBR entry from Library or the Search tab is unchanged
- System shelf move is exclusive via existing services; custom-shelf memberships are not rewritten

### Testing

- Unit: `packages/utils/overviewCopy.test.ts`, `overviewQuickActions.test.ts`, `currentlyReadingAdd.test.ts`, `currentlyReadingCard.test.ts`; web `overviewCopy.test.ts`, `currentlyReadingCard.test.ts`; iOS `overviewCopy.test.ts`, `overviewQuickActions.test.ts`, `currentlyReadingCard.test.ts`, `sectionHeading.test.ts`
- Manual QA: Overview capitalization, Recent Activity centered stack (desktop + mobile web + iOS), Add Book full-card size vs CR cards, Quick Action cards (light/dark)
- Blockers: Reading Room is auth-gated — browser verification may stop at sign-in. Quick Actions fourth card is a product gap (do not invent Notes/Journal/Goals/Search).

---

## Sprint — Notes Tab – Filter by Book ✅

| Item | Status | Notes / references |
|------|--------|--------------------|
| Remove page number as primary Notes filter | ✅ | Page input remains on Full Notes Search only, inside **Advanced filters**. Note `page_number` / `chapter` fields are unchanged. |
| Book Title filter (web + iOS) | ✅ | Home Notes + Full Notes. Web: `NotesBookFilter` modal (existing `Modal` + `Input`). iOS: `NotesBookFilterSheet` (TBR picker pattern). No new dropdown library. |
| Shared filter/sort | ✅ | `packages/utils/notesBookFilter.ts` — filter key is `user_book_id`; catalog `book_id` matches only when unique. Titles are never DB keys. |
| Sort | ✅ | All Books stays newest → oldest. Selected book is oldest → newest. Home All Books still caps at `HOME_NOTES_PREVIEW_LIMIT` (5). |
| Book list | ✅ | `listNotedBooksForUser` reads the signed-in user's `reading_notes.user_book_id` values (not the full library), then one `user_books` + `books` join. A→Z title, search title+author. |
| Query / deep link | ✅ | `book=` on `/reading-room/?tab=notes&book=` and `/notes/?book=` (web); iOS `/?tab=notes&book=` and `/notes?book=`. Clearing returns All Books. |
| Empty / error | ✅ | “You haven't saved any notes yet.” / “No notes saved for this book yet.” Friendly error + Retry. No raw backend errors. |
| Note cards | ✅ | Location still via `formatNoteLocation` (page/chapter). Audiobook `chapter` timestamps like `1:23:45` display as time, not “Chapter …”. Author shown when enriched. Privacy/RLS/edit/delete paths unchanged. |

### Components / query

- Shared: `packages/utils/notesBookFilter.ts` (+ tests). Exports also from `packages/utils/index.ts`.
- Web: `NotesBookFilter`, `reading-room/NotesPanel`, `NotesSearchFilters` (book primary, page advanced), `NotesSearchResults` (`userBookId` + sort), `listNotedBooksForUser` in `readingNotes.ts`.
- iOS: `NotesBookFilterSheet`, Home `NotesPanel`, Full Notes `notes.tsx`, same service helpers.
- RPC `search_reading_notes` already accepted `p_user_book_id`; no schema/RLS migration.

### Testing

- Unit: `packages/utils/notesBookFilter.test.ts`, `noteLocation.test.ts` (timestamp); web `notesBookFilter.test.ts`; iOS `notesBookFilter.test.ts`
- Web `tsc` + production `next build` passed. iOS tests + `tsc` passed except pre-existing `quote-graphics.tsx` `"outline"` Button variant.
- Browser: Notes / Reading Room are auth-gated — verification stops at sign-in unless a session is present.

**Last updated:** 3 September 2026 (Notes Tab – Filter by Book)

---

## Free / Plus / Reading DNA (master phases)

Tracking against the Free/Plus/Reading DNA master spec (Phases 1–42). Distinct from historical Phase 1–10 above.

| Master phase | Status | Notes |
|--------------|--------|-------|
| 1 — Audit docs | ✅ | `docs/BASIC_FEATURE_AUDIT.md`, `PLUS_FEATURE_AUDIT.md`, `SUBSCRIPTION_ARCHITECTURE.md`, `READING_DNA_DATA_AUDIT.md`, `READING_DNA_ALGORITHM.md`, `HIGGSFIELD_READING_DNA_DESIGN.md`, `FEATURE_GATING_MATRIX.md` |
| 2 — Entitlements | 🔄 | FeatureKey + ENTITLEMENTS; shelves/quotes/clubs/challenges/graphics limits wired in service layer |
| 3 — Billing foundation | 🔄 | Migration `20260801190000_…`; webhook idempotency; checkout intervals — **operator Stripe/ASC catalog cutover still open** |
| 4 — Paywall UX | 🔄 | Paywall kit + FeatureLimitModal on shelves, quotes, clubs |
| 5–8 — Free library basics | ⏳ | Calendar / permanent shelves polish |
| 20–24 / 27–28 / 35 — Reading DNA core | 🔄 | DNA pages; snapshot RPC; persist on profile/DNA load **and** `completeReadingSession` (soft fail); Higgsfield blocked |
| Quote graphics Free UX | 🔄 | Remaining count + consume slot + FeatureLimitModal; AI render flag off |
| Challenges browse/join | 🔄 | Thin UI + seed migration `20260801220000_seed_reading_challenges.sql` (5 public 2026 challenges) |
| Remaining (Wrapped, AI graphics, snapshot QA) | ⏳ | Ship as capacity allows |

---

## Related documentation

| Doc | Path |
|-----|------|
| Architecture (this audit) | `BOOKMARKED_ARCHITECTURE.md` |
| Technical debt | `TECHNICAL_DEBT.md` |
| Extended progress (prior) | `docs/PROJECT_PROGRESS.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| Master task list (MVP) | `docs/project/MASTER_TASK_LIST.md` |
| Feature gating matrix | `docs/FEATURE_GATING_MATRIX.md` |
| Subscription architecture | `docs/SUBSCRIPTION_ARCHITECTURE.md` |
| Reading DNA algorithm | `docs/READING_DNA_ALGORITHM.md` |
| Sprint 6 polish / DNF QA | `docs/SPRINT_6_POLISH.md` |

**Last updated:** 5 September 2026 (History Tab — Private Reviews + 12-book grid)

---

## Twelfth Sprint — Product polish ✅

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Login Remember Me | ✅ | Web `rememberMe` localStorage vs sessionStorage. iOS preference + SecureStore/keychain tokens (not password). Logout clears. |
| 2 | Quick Action alignment | ✅ | Icon then text, shared size/spacing. Custom purple SVG icons. 3 cards only. |
| 3 | Title Case | ✅ skipped-already-done | Overview copy in `overviewCopy.ts`. User-generated text unchanged. |
| 4 | Bookmark placement | ✅ | Left of cover/spine on web + iOS `BookCover` / `BookSpine`. |
| 5 | Favorites View All | ✅ | Favorites-only listing. Origin `home_overview`. |
| 6 | Overview View Shelf back | ✅ | `origin=home_overview` vs Library. |
| 7 | Trail session notes + list/grid | ✅ | Separate session-notes view. List/Grid toggle stays on Trail. |
| 8 | Home Notes Recent Notes | ✅ | 5 recent books × 1 latest note. Not the book-title filter. |
| 9 | Reviews filters | ✅ | All / Star Rating Only / Written Review Only / **Private Reviews** / Spoiler Reviews. Fixed-height chips so tabs do not resize. |
| 10 | History Recently Finished | ✅ | Title + Browse Read Shelf `origin=home_history`. |
| 11 | Recent Sessions | ✅ | “Recent Sessions” heading. |
| 12 | Feed Trending Add to Shelf | ✅ | One Add to Shelf (TBR/CR/Finished/DNF/custom) + Rate & Review. Origin `feed`. |
| 13 | Feed Create a Post | ✅ | Placeholder “Write a post.” iOS: GIF, photo, Tag a Book from Library, mention tools. Cancel uses origin. |
| 14 | Feed spoiler toggle | ✅ | Tap reveal/hide, 30s auto-hide, cleanup. Shared `spoilerReveal`. |
| 15 | Feed Like sparkle | ✅ | Like-only, Reduce Motion, existing Bookmarked sparkles. |
| 16 | Feed Comment | ✅ | Opens that post’s comments sheet. Cover/title still go to Book Details. |
| 17 | Star ratings one row | ✅ | Shared `starFill` + nowrap `StarDisplay` / `StarRating`. |
| 18 | Feed → Book Club back | ✅ | `origin=feed` + scroll. |
| 19 | Club discussion under nav | ✅ | Sticky club tabs use `--app-nav-clearance`. Extra discussion padding. No extra z-index stacking. |
| 20 | Search → People back | ✅ | `origin=search_people` + query. |
| 21 | Search Details + Add to Shelf | ✅ | Two actions. After add stay on Search. |
| 22 | Search category switch | ✅ | Clears query/results and focuses input. |
| 23 | Search → Club back | ✅ | `origin=search_clubs`. |
| 24 | Custom shelves move | ✅ | `shelfMove` + `moveUserBookToDestination` updates existing `user_books`. Custom memberships via `user_shelf_books`. |
| 25 | Create Custom Shelf (iOS) | ✅ | Name, genre, privacy. Same backend as web. |
| 26 | Page progress | ✅ | Current Page + Total Pages. Saves `user_books.total_pages` only. |
| 27 | Custom Bookmarked icons | ⏳ waiting-on-assets | Existing custom purple set used (QA, shelves, nav). Final Leighton pack not in repo. Covers/user content untouched. |
| 28 | App opening animation (iOS) | ⏳ waiting-on-assets | Fresh-launch overlay only (`LaunchIntro`). Logo + sparkle fallback. Reduce Motion. Final cinematic assets not in repo. |
| 29 | Custom mood tags | ✅ | Create/edit/archive. Built-ins stay. Additive migration `20260903120000_twelfth_sprint_progress_mood.sql`. |
| 30 | Library All Books (iOS) | ✅ | Magnifying glass removed. `+` → Search `origin=library_all_books`. Filter order TBR → CR → Finished → DNF → All. |
| 31 | Feed Trending inline (iOS only) | ✅ | Horizontal carousels in feed. Not added to web. Weekly staleTime. |
| 32 | Reviews emoji selected (iOS) | ✅ | Border/bg + tap again to deselect. |
| 33 | Book Page Set Date to Read (iOS) | ✅ | Control removed; DNF stays full-width. |
| 34 | Search Already in Library (iOS) | ✅ | Bookmark + confirm copy. Continue still allows multi-collection. |
| 35 | iPad Grid View | ✅ | 4-across at `width >= 768`. iPhone stays 3. |

### Shared / data

- Origins: `packages/utils/navigationOrigin.ts`
- Notes-by-book query: `packages/utils/recentNotesByBook.ts` + `listRecentNotedBooksForHome`
- Additive migration only: `user_books.total_pages`, `user_mood_tags` (owner RLS). No destructive data change.
- Android: not in scope. No RLS breakage. Migration must be applied before mood tags / user total pages work in production.

### Testing

- Unit: `navigationOrigin`, `recentNotesByBook`, `spoilerReveal`, `pageProgress`, `libraryFilters`, `starRatingDisplay`, `customMoodTags`, `shelfMove`, `rememberMe`
- Manual QA: origin back, search category clear, shelf move, spoiler timer, stars, Home Recent Notes
- Blockers: web app is auth-gated — browser QA may stop at sign-in. Mood/total-pages need the new migration applied.

---

## History Tab — Private Reviews + 12-book grid ✅

Twelfth Sprint already renamed the Reviews filter **Rating & Review → Private Reviews**. This pass adds the model, RLS, and UI so privacy is real — not only a label.

| Item | Status | Notes |
|------|--------|-------|
| Visibility field | ✅ reused | `reviews.visibility` existed since phase 0 (`text not null default 'public'`). No new column. |
| Default | ✅ public | Existing rows stay public. Legacy/`followers` values normalised to **public** (never to private). |
| Allowed values | ✅ | Check constraint `visibility in ('public', 'private')`. UI is Public \| Private only. |
| RLS | ✅ | Owner read/edit/delete public + private. Others `visibility = 'public'` only. Helper `review_visible_to_viewer()`. Child reaction/reply policies already checked parent visibility. |
| Feed | ✅ | Web + iOS activity feed uses **copied** `activity_events` rows. Mobile home feed also loads **live public reviews**. Public→Private updates existing activity rows to `private` (trigger) and drops hydrate cards if the review is missing/private. Private→Public reuses the same rows — no duplicate posts. Feed notifications for those activities are deleted when a review becomes private. |
| Profile / book / discovery | ✅ | Profile uses `listPublicUserReviews`. Book community list is public-only; owner still sees their private review labelled Private. Community/trending ratings stay public-only (rating math unchanged). Share previews hide private reviews. |
| Create / edit | ✅ | Public \| Private control on web + iOS, default Public, separate from spoiler. Owner can flip anytime; persist is immediate. |
| Private Reviews filter | ✅ | Label kept. Empty copy: “You don't have any private reviews yet.” Server helper `listPrivateUserReviews` (`user_id` + `visibility = private`). Client filter matches. |
| Owner badge | ✅ | “Private” + lock icon (SVG / Ionicons). a11y “Private Review”. Not an Apple emoji. |
| History page size | ✅ | `HISTORY_PAGE_SIZE = 12`. Sort then paginate. Page 1 = 1–12. Last page may be smaller. Trail still uses `DEFAULT_PAGE_SIZE = 10`. |
| History grid | ✅ | Desktop 4×3, tablet 3, phone 2 (web). iPhone 3-across, iPad 4-across at `width >= 768` (same as Twelfth Sprint). Bookmark + favorite kept. History qualification unchanged (`shelf_status = read`, not DNF). |
| Android | ✅ skipped | Not in scope. |

### Schema / rollback

Additive migrations:
- `supabase/migrations/20260906010000_review_private_visibility.sql`
- `supabase/migrations/20260906010001_review_visibility_helper_grants.sql` (SECURITY DEFINER + execute grant)

- Reuses `reviews.visibility`; default remains `public`.
- Index `reviews_owner_private_idx` for the owner private list.
- Trigger `reviews_sync_activity_visibility` keeps copied Feed rows in sync.
- Rollback (safe, no data loss): drop trigger/function/index/check constraint. Column and public defaults stay.

### Shared utils

- `packages/utils/reviewVisibility.ts` — parse, RLS predicate tests, badge/empty copy
- `packages/utils/readingRoomHistory.ts` — `HISTORY_PAGE_SIZE = 12`

---

## Dashboard – Subtitle Capitalization ✅

Copy-only. Dashboard remains merged into Reading Room (`/dashboard/` still redirects). No routes, navigation, layout, or user-data changes.

### Exact subtitle

| | Copy |
|---|------|
| **Old** | Your reading life in one place — progress, Trail, notes, reviews, and History. |
| **New** | Your reading life in one place — Progress, Trail, Notes, Reviews, and History. |

Same punctuation, em dash, and wording. Title Case only on the five Reading Room section names: Progress, Trail, Notes, Reviews, History.

### Shared vs duplicated

- No shared constant existed. None added (one sentence, web-only).
- iOS Home (`apps/mobile/app/(app)/index.tsx`) does not use this subtitle. Header copy stays `Welcome back, {name}.` — not replaced or duplicated.

### Files

| File | Change |
|------|--------|
| `apps/web/src/app/(app)/reading-room/page.tsx` | Visible Reading Room / Home subtitle |
| `apps/web/src/app/(app)/reading-room/layout.tsx` | Metadata description lists the same five sections |
| `PROJECT_PROGRESS.md` | This section |

No `aria-label` / `accessibilityLabel` duplicated the subtitle. Visible copy is the accessible text.

### Related copy

| Surface | Old | New | Why |
|---------|-----|-----|-----|
| Reading Room SEO `description` | progress, trail, notes, reviews, and history | Progress, Trail, Notes, Reviews, and History | Same five Bookmarked sections as the subtitle |

### Left alone on purpose

- iOS Home greeting (`Welcome back, {name}.`) — different sentence, not this subtitle
- Ordinary English: “reading progress”, “write reviews”, “your trail” as session-path metaphor, “shelves and history” as account data
- Transfer / import copy that lists data types (progress, sessions, notes, reviews), not Home tabs
- User-generated reviews, notes, posts, comments, book descriptions, profiles, messages, DB text
- App Store metadata, code comments, architecture docs
- Landing “Reading progress” feature card
- Android (out of scope)

### Tests / verification

- No snapshot / string / UI / a11y test asserted the old subtitle. None updated.
- Web `tsc --noEmit`: pass
- Web `vitest`: 40 files, 217 tests pass
- iOS `tsc --noEmit`: pass
- iOS `vitest`: 10 files, 26 tests pass
- Web production `next build`: pass (`/dashboard` and `/reading-room` unchanged)
- Web `eslint`: repo already has 130 pre-existing `react-hooks/set-state-in-effect` errors (including Reading Room load effect). Copy change did not add any. Layout file is clean.
- No `expo run:ios`. Android not in scope.

---

## Feed Images — Consistent Sizing ✅

Display-only. Same source image keeps the same proportional shape on 320–wide desktop, iPhone, and iPad. No upload, storage, or schema changes.

### Root cause

Feed renderers **cropped** user photos to a fake box:

- Web `PostCard` / `RepostPreview` / `CommentAttachment`: `object-cover` + `max-h-*` (GIFs already used contain)
- iOS `AttachmentImage`: clamped aspect ratio (0.6–1.9) + `resizeMode="cover"`

Portrait was cropped, landscape/square were forced toward a mid ratio, and iPad used the same cover box instead of the post column width.

### Shared rules (`packages/utils/feedImageMedia.ts`)

| Token | Value |
|-------|--------|
| Fit | `contain` (cover only if future crop metadata says so — none stored today) |
| Max height | 480px default, 280px compact; also capped at 70% of viewport |
| Max media width | 640px inside a very wide column (iPad landscape / large desktop). Web Feed column stays `max-w-3xl` |
| Fallback reserve | 4:3 until `onLoad` / `Image.getSize` (no new DB columns) |
| Tiny images | Natural width ≤ 240px is not stretched to the column |

Portrait taller than the max height is **narrowed and centered**, not cropped. Tap opens Full Image View.

### Full Image View

**New** on both platforms (nothing existed — web opened the file in a new tab).

- Web: `FeedImageViewer` lightbox — dark backdrop, contain, Close, Escape, backdrop click, focus trap
- iOS/iPad: full-screen modal, Close, VoiceOver. No pinch-zoom (no existing viewer)

### Multi-image / crop

Posts have a single `image_url`. No crop metadata. Share-card thumbnails (48×64) may still crop; Full View and Feed cards show the original with contain.

### Surfaces

| Surface | Change |
|---------|--------|
| Main Feed / post detail / profile posts | Web `PostCard` → `FeedImageMedia` |
| Repost embed | Web + iOS compact `FeedImageMedia` |
| Comments / message attachments | Same renderer (`CommentAttachment` / `AttachmentImage` wrap) |
| Share preview cards | Left as cropped 48×64 thumbnails (preview, not Feed) |
| Notifications / club posts | No Feed image cards |
| Composer / edit previews | Unchanged (upload UI) |

### Tests / verification

- Shared: ratio, portrait narrow + center, landscape, square, panoramic, tiny, wide-column cap
- Web `tsc --noEmit`: pass
- Web `vitest`: 41 files, 231 tests pass (14 new in `feedImageMedia.test.ts`)
- Web `eslint` on new Feed image files: pass. Repo still has pre-existing `react-hooks/set-state-in-effect` errors (including `PostCard`)
- Web production `next build`: pass
- iOS `tsc --noEmit`: pass
- iOS `vitest`: 11 files, 27 tests pass
- Browser QA: Feed is auth-gated. Cursor browser tools could not keep a tab open. Local `/feed/` serves and redirects unauthenticated users to login.
- No `expo run:ios`. Android not in scope. No storage/upload/data changes.

---

## Shelf Icon Assignments + Custom Shelf Icons 🔄

Canonical IDs: `want_to_read` (TBR), `currently_reading`, `read` (Finished), `dnf`. Mapping is in `packages/utils/shelfIcons.ts` — not display labels, not per-screen maps.

| Default shelf | Logical key | Purple asset |
|---------------|-------------|--------------|
| TBR | `stack_of_books` | `want-to-read.png` |
| Currently Reading | `open_book` | `currently-reading.png` |
| DNF | `closed_book` | `did-not-finish.png` |
| Finished | `book_with_sparkle` | `finished.png` |

Default icons are **not** user-editable. Same assets on web + iOS. Android not in scope.

### Custom shelves — `icon_key`

- **Field:** created `user_shelves.icon_key` (nullable text). Existing shelves stay valid. Migration `20260906140000_user_shelves_icon_key.sql`.
- **Catalog:** `custom_icon_1` … `custom_icon_5`. Writes validate against that list; invalid keys are rejected. Null/missing → `custom_icon_1` (documented fallback, not a random assignment).
- **Create:** Choose Icon picker; first approved key is preselected; user can change before save.
- **Edit:** current icon selected; name + privacy + genre + icon; Save persists immediately and refreshes Library / Profile / Add-Move / cached cards (iOS query invalidation).
- **Sync:** same `icon_key` on web and iOS.

**BLOCKED ASSET ITEM — Leighton final files.** The 5 custom PNGs are **not** in the repo. Architecture and keys are shipped; visual fallback is the approved stack-of-books (`want-to-read.png`). Do **not** mark custom visuals complete until `custom-icon-1.png` … `custom-icon-5.png` are verified on web + iOS.

### Surfaces

Library (default + custom), Profile / shelf privacy, Home / Reading Room default sections, Book Details, Add/Move to shelf, Search, collections create/edit. No onboarding shelf-icon surface.

### Tests / verification

- Shared: default ID → key/file, custom key validation, existing-shelf fallback to `custom_icon_1`
- Web `tsc --noEmit`: pass
- Web `vitest`: 42 files, 245 tests pass
- Web `eslint` on new icon files: pass. Repo still has pre-existing `react-hooks/set-state-in-effect` on CreateShelfModal / custom shelf page
- Web production `next build`: pass
- iOS `tsc --noEmit`: pass
- iOS `vitest`: 12 files, 30 tests pass
- Migration `20260906140000_user_shelves_icon_key.sql` dry-run then applied to production (`db push --yes --linked`). No reset, no backfill
- Browser QA: Library/Profile are auth-gated. Cursor browser tools could not keep a tab open. Production `/library/` is live but this branch is not deployed; unauthenticated requests redirect. Icon picker was not exercised logged-in.
- No `expo run:ios`. Android not in scope. Default-shelf icons cannot be user-edited

---

## Next up (recommended)

| Priority | Item | Notes |
|----------|------|-------|
| P0 | Apply migrations + deploy RPC | `…190000`, `…200000`, `…210000` upsert DNA, `…220000` challenge seeds |
| P1 | Enable AI quote graphics flag | When Higgsfield/AI ready; keep Free monthly consume semantics |
| P1 | Higgsfield assets | Re-auth MCP — see `docs/higgsfield/BLOCKER.md` |
| P1 | Stripe/ASC catalog cutover | Operator-only; leave documented |
