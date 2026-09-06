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
| UGC moderation + reports | ✅ | Edge `moderate-ugc` + decision trigger; warn/block/report on Feed, comments, bio, clubs, discussions, replies |
| Club reply realtime | ✅ | Per-discussion channel; created_at sort; local sort preference; reconnect merge |

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

## Sprint 8 — Audiobook tracking (HH:MM) ✅

Format is **reader-owned** (`user_books.tracking_format`), not a global catalog property. Catalog `books.format` remains fallback for older rows. Internal storage stays **seconds**. Readers only see and enter **HH:MM** (`2:30` = 2h 30m).

| Item | Status | Notes / references |
|------|--------|-------------------|
| Shared helpers | ✅ | `packages/utils/listeningTime.ts`: `parseListeningTime`, `formatListeningTime`, `calculateAudiobookProgress`, `calculateAudiobookSessionDuration` |
| Internal unit | ✅ | Seconds in `user_books.listening_progress_seconds`, `user_books.audiobook_duration_seconds`, and `reading_sessions.listening_*_seconds`. No data rewrite. `9000` seconds displays as `2:30`, never 9000 hours |
| Format selector | ✅ | Existing Track as Book / Audiobook on web + iOS. Writes `user_books.tracking_format`. Page → audio asks for total + current time and keeps page history. Audio → page keeps listening history. Nothing is converted |
| Progress UX | ✅ | Audiobook fields: Current Listening Time + Total Listening Time only (placeholders `2:30` / `20:30`). Same progress bar and 1-decimal rounding as pages. 100% when current equals total. Finished-shelf still requires Mark as finished |
| Session model | ✅ | Existing `session_format` + nullable `listening_start_seconds` / `listening_end_seconds` / `listening_seconds`. Page fields stay 0 on audio rows and are never shown as “pages 0–0” |
| Manual session log | ✅ | Starting / Ending Listening Position (HH:MM). Duration = end − start. If end > current, current moves forward; historical sessions never rewind current |
| Trail / History / activity | ✅ | “Listened from 1:45 to 2:30 · 45 minutes”. Progress tab still sums page sessions only — audio minutes are not added to pages read |
| Sync | ✅ | Web ↔ iPhone ↔ iPad via existing Supabase rows + query invalidation after format / progress / session / duration saves |
| Out of scope | ✅ | **No listening timer.** **No Audible / Spotify sync.** Android not in this sprint. See `docs/AUDIOBOOK_RESEARCH.md` |

Additive migration: `20260906180000_eighth_sprint_audiobook_user_edition.sql` adds `user_books.tracking_format` and `user_books.audiobook_duration_seconds`. Catalog duration/format columns are unchanged.

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
| Stripe checkout (web) | 🚫 | New purchases are iOS IAP only. `/upgrade/` no longer starts Stripe Checkout. Historical Stripe subscribers keep access + billing portal. |
| App Store IAP (iOS) | ✅ | `expo-iap` + `useAppleIap` + `apple-iap-verify` — see `docs/APP_STORE_IAP.md` |
| Google Play IAP | ⬜ | Android uses web Stripe link from upgrade screen |
| Mobile web upgrade UX | ✅ | `/upgrade/` explains iOS-only subscribe; Plus from IAP unlocks on web automatically |
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
| 1 — Audit docs | ✅ | `docs/BASIC_FEATURE_AUDIT.md`, `PLUS_FEATURE_AUDIT.md`, `SUBSCRIPTION_ARCHITECTURE.md`, `READING_DNA_DATA_AUDIT.md`, `READING_DNA_ALGORITHM.md`, `HIGGSFIELD_READING_DNA_DESIGN.md`, `FEATURE_GATING_MATRIX.md`, `feature-entitlements.md` |
| 2 — Entitlements | ✅ | FeatureKey + ENTITLEMENTS; structured `check*Limit`; server triggers for shelf/club/quote; usage_counters for graphics + challenges |
| 3 — Billing foundation | 🔄 | Migration `20260801190000_…`; webhook idempotency; checkout intervals — **operator Stripe/ASC catalog cutover still open** |
| 4 — Paywall UX | ✅ | FeatureLimitModal / IosSubscribePanel at caps only; no hardcoded prices |
| 5–8 — Free library basics | ✅ | Calendar, yearly goal `(user_id, year)`, rereads, Finished vs Read documented |
| 20–24 / 27–28 / 35 — Reading DNA core | 🔄 | DNA pages; snapshot RPC; persist on profile/DNA load **and** `completeReadingSession` (soft fail); Higgsfield blocked |
| Quote graphics Free UX | 🔄 | Remaining count + consume-on-success + favorite picker; AI render flag off |
| Challenges browse/join | ✅ | Engine + Featured / Your / Completed on web + iOS. Create Challenge is Plus, subscribe on iOS only |
| Yearly Wrapped | ✅ | Free yearly recap from real activity dates; monthly Wrapped stays Plus |

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
| Feature entitlements (Free contract) | `docs/feature-entitlements.md` |
| Subscription architecture | `docs/SUBSCRIPTION_ARCHITECTURE.md` |
| Reading DNA algorithm | `docs/READING_DNA_ALGORITHM.md` |
| Sprint 6 polish / DNF QA | `docs/SPRINT_6_POLISH.md` |

**Last updated:** 6 September 2026 (BASIC / FREE tier)

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

## Content Moderation & Flagging + Club realtime replies ✅

Server-side gate is mandatory. Clients may preview; final save consumes a short-lived `moderation_decisions` row issued by Edge Function `moderate-ugc`. Postgres trigger rejects UGC text writes without a matching unused decision. RLS was not weakened.

### Types / outcomes

| Item | Notes |
|------|--------|
| Content types | `FEED_POST`, `COMMENT`, `PROFILE_BIO`, `BOOK_CLUB_NAME`, `BOOK_CLUB_DISCUSSION`, `BOOK_CLUB_REPLY`, `FUTURE` in `packages/utils/contentModeration.ts` — no scattered literals |
| Outcomes | `allow` · `warn` (mild profanity) · `block` (hate, discrimination, harassment, threats, sexual exploitation, severe abuse, other guidelines) |
| Club names | Stricter: warn is treated as block. Unicode / zero-width / whitespace tricks are normalised (`NFKC`) |
| Provider | OpenAI Moderations (`omni-moderation-latest`) via `ModerationProvider.moderate(text)`. Reuses `OPENAI_API_KEY` |
| Fail closed | Provider outage → “Content review is temporarily unavailable. Please try again.” Draft kept. Nothing published |
| Warn render | Original text stored. Spans only. Web: “Vulgar Language – Hover to View.” (hover + keyboard/focus). iOS: “Vulgar Language – Tap to View.” Tap again hides. A11y label does not announce the word while hidden |
| Block copy | “This content violates Bookmarked’s Community Guidelines and must be edited before it can be published.” Optional category. No scores |

### Reports

Reasons: Hate or discrimination; Harassment or bullying; Threats or violence; Sexual or inappropriate content; Spam; Impersonation; Other (+ optional details). Table `content_reports` gained `reviewed_by`, statuses `pending/reviewing/resolved/dismissed`, unique `(reporter, type, id)`. Users create + read own only; cannot alter resolution. Dedup returns “You’ve already reported this.”

**Admin UI:** none exists (no staff role in app). Follow-up: staff review queue over `content_reports` + `moderation_logs`. Logs store type, content_id, user_id, decision, categories, version — no tokens/passwords.

### Realtime club replies

Subscribe to `book_club_discussion_replies` filtered by `discussion_id` only (insert/update/delete). Merge + dedup by reply id. Sort Newest/Oldest First by `created_at` (not `updated_at`). Preference: `bookmarked.clubReplySort` in localStorage / AsyncStorage. Reconnect: visibility / AppState / online → resubscribe + refetch + merge. Unsubscribe on leave. RLS membership / public-club / banned still gate events.

### Surfaces wired

Feed posts + edits + comments + comment replies; profile bio; club create/rename; club discussion title/body; club replies. Reports on posts, comments, profiles, clubs, discussions, replies. Android not in scope.

### Migration / function

- `supabase/migrations/20260906160000_ugc_moderation_pipeline.sql`
- Edge Function `supabase/functions/moderate-ugc`
- Apply: `./scripts/supabase-cli.sh db push --yes --linked` then `functions deploy moderate-ugc`

### Tests / verification

- Shared: allow/warn/block classify, span masking, report RLS predicates, reply sort + dedup
- Web `tsc --noEmit`: pass
- Web `vitest`: 45 files, 269 tests pass
- Web `eslint` on new moderation files: pass. `ClubDiscussionsPanel` still has pre-existing `react-hooks/set-state-in-effect` on list/thread load
- Web production `next build`: pass
- iOS `tsc --noEmit`: pass
- iOS `vitest`: 13 files, 31 tests pass
- Migration `20260906160000_ugc_moderation_pipeline.sql` dry-run then applied to production (`db push --yes --linked`). Function `moderate-ugc` deployed. No reset, no data loss
- Browser QA: Feed/clubs/profile are auth-gated. Logged-in realtime reply merge was not exercised in this session
- No `expo run:ios`. Android not in scope. RLS not weakened. OpenAI key stays in Edge secrets, not the client bundle

---

## Thirteenth Sprint — Feature / polish ✅

Remaining product polish on **web + iOS (iPhone/iPad)**. Android not in scope. No `expo run:ios`. No TestFlight. No commit in this pass.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Book Complete Dark Mode | ✅ | Same layout/sparkles/buttons. Light stays `#642F37` / white / `#F7C767`. Dark uses existing purple/lavender tokens. Reduce Motion keeps sparkles static. |
| 2 | Notifications: social only | ✅ | Central `NOTIFIABLE_SOCIAL_EVENTS`: message, follow, post like/comment/reply, post published. Review/shelf/start/finish/progress stay on Feed. Existing notification rows not deleted. Auth/security emails untouched. |
| 3 | Per-profile post notifications | ✅ | On followed public profiles (not own): Turn On/Off Post Notifications. Table `post_notification_preferences` (subscriber, creator, enabled). Copy: `{Name} posted something new.` Tap → that post. Visibility uses follow + block + `post_visible_to_viewer`. |
| 4 | Streaks = actual reading | ✅ | Qualifies `session` / `progress` with pages or listening that day. Date = `session_date` (local day on new writes). Not shelf move, import, backdate, Finished-only, notes-only, rating/cover edits. Historical `session_date` backfilled from `created_at` UTC — not a streak-table rewrite. Pre-migration rows keep `activity_kind='session'` so old finish sessions with pages may still count until distinguished. |
| 5 | Remember Me repair | ✅ | Repair of Twelfth Sprint store — no second token store. Checked: keep email + persist session (web localStorage / iOS Keychain). Unchecked: session-only; logout clears email. Never stores passwords. Logout always clears auth. |
| 6 | Profile Posts | ✅ | Posts section near Reviews, `created_at` desc, Feed cards, empty “No posts yet.” RLS-enforced. |
| 7 | Reviews Share to Feed | ✅ | After Publish, public + new only. Preview then Share / Skip. Dedup `source_type=review` + `source_id`. Private later deletes linked Feed posts. |
| 8 | Notes Share to Feed | ✅ | Share to Feed on public notes/quotes. Preview + caption. `source_type=note`. Web + iPhone + iPad. |
| 9 | Remove Quote Title (website) | ✅ | Create/edit UI no longer has Quote Title. Column kept. Validation is quote/note text only. |
| 10 | Change email/password | ✅ | Account/Security (not public Profile). Re-auth with current password, then provider verify / password policy. Never logs passwords. |
| 11 | Profile button cleanup | ✅ | Main Profile: Public Profile kept. Copy / Edit / Quote Graphics removed from main Profile. Public Profile (owner): Copy beside Edit. Quote Graphics: larger buttons on Full Notes + Notes dashboard. Remaining profile links alternate existing tokens. |
| FLAG | Reading DNA nav | 🚩 | Route `/reading-dna` and profile `ReadingDnaSection` still exist. Main Profile action-row button removed. **Do not invent new nav.** Product decision needed if DNA should live only on the profile section. |

### Shared / data

- Utils: `notifiableEvents`, `readingStreak`, `rememberMeEmail`, `reviewSharePrompt`, `quoteTitle`, `feedShare`, `postNotifications`
- Additive migration: `supabase/migrations/20260906220000_thirteenth_sprint_social_polish.sql`
  - `reading_sessions.session_date`, `activity_kind`
  - `posts.source_type` / `source_id` unique per user
  - `post_notification_preferences` + RLS (subscriber CRUD; insert requires follow)
  - `create_notification` social allowlist; `notify_followers_of_activity` no-op
  - `notify_post_subscribers` on post insert
  - Hide/delete Feed posts when review/note leaves `public`
- No db reset. Existing notification history left in place.

### Tests / verification

- Unit: notifiable events, streak `session_date`, remember-me email-only, public-only share prompt, quote title not required
- Web `tsc --noEmit`: pass
- Web `vitest`: 52 files, 310 tests pass
- Web `eslint`: pre-existing `react-hooks/set-state-in-effect` across older pages. Sprint share prompt is derived, not an effect.
- Web production `next build`: pass
- iOS `tsc --noEmit`: pass
- iOS `vitest`: 58 files, 294 tests pass
- Migration `20260906220000_thirteenth_sprint_social_polish.sql` dry-run then applied (`db push --yes --linked`). No reset, no data loss
- Android: not in scope. No password storage. Private reviews do not prompt Share to Feed.

---

## Fourteenth Sprint — Search clear + spine + iPad grid ✅

Search X on **web + iOS**. Spine title off: **iOS only**. Grid 4-col: **iPad only**. Android not in scope. No `expo run:ios`. No TestFlight. No commit in this pass.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Search clear X | ✅ | X inside the field when `query.length > 0`. Label “Clear search”. Clears query + results, same category, refocus. Empty hides X. |
| 2 | Stale-query guard | ✅ | Request ids + invalidate on clear. iOS also `cancelQueries` + AbortSignal on book search. “Fourth Wing” then X cannot refill empty search. |
| 3 | App spine titles off | ✅ | Native `BookSpine` only. Cover + overlay/shadow kept. VoiceOver still “Title by Author”. Web spine untouched. |
| 4 | iPad Grid 4 columns | ✅ | Scene width `>= 768` → 4 equal columns. Phone stays 3. Split View / phone-like pane drops to 3. Pixel tiles (NativeWind `w-[23%]` never applied, so iPad still showed 3). |

### Why iPad was still 3-col

Twelfth Sprint set `w-[23%]` at `width >= 768`, but NativeWind arbitrary percentages did not size the tiles. Covers used intrinsic width, so three fit. Column count now uses **scene/pane** width (`useWindowDimensions`, which shrinks in Split View). Tile width is measured from the grid row so a padded card on a full iPad still gets 4.

### Files

- SearchBar: `apps/web/src/components/search/SearchBar.tsx`, `apps/mobile/src/components/SearchBar.tsx`
- Shared: `packages/utils/searchClear.ts`, `packages/utils/libraryFilters.ts` (`libraryGridLayout`)
- Native spine: `apps/mobile/src/components/library/BookSpine.tsx` (web `BookSpine.tsx` unchanged)
- Grid: `LibraryCoverGrid.tsx` used by Library / shelf / custom / All Books

### Tests / verification

- Unit: search clear visibility + href + stale Fourth Wing ignore; phone 3-col vs iPad 4-col vs Split View 3-col
- Web `tsc --noEmit`: pass
- Web `vitest`: 53 files, 317 tests pass
- Web `eslint` on `SearchBar.tsx`: pass. `SearchForm` / `SearchResults` still have pre-existing `react-hooks/set-state-in-effect`
- Web production `next build`: pass
- iOS `tsc --noEmit`: pass
- iOS `vitest`: 59 files, 301 tests pass
- Phone grid still 3. Web spine titles still render. No `expo run:ios`. Android not in scope.

---

## Fifteenth Sprint — Reading Challenges ✅

Reading Challenges on **web + iOS (iPhone/iPad)**. Android not in scope. No `expo run:ios`. No TestFlight. No commit in this pass.

**Product rule — subscribe only on iOS.** Do not add a web checkout, Stripe/web IAP, or “Subscribe on web” for Challenges or other Plus gates wired in this sprint. Purchase stays native App Store IAP. Once `user_subscriptions` is Plus, **bookmarked.online unlocks automatically**. Web locked copy sends people to the iOS app. Server entitlement is mandatory. Pricing is not hardcoded in challenge UI.

### Schema reused vs new

| Reused | New (additive, `20260907030000_reading_challenges_engine.sql`) |
|--------|----------------------------------------------------------------|
| `reading_challenges`, `reading_challenge_members` (DNA / 2026 seed) | `reading_challenge_objectives`, `rewards`, `progress`, `contributions` (unique dedup), `invites`, `milestones` |
| `user_subscriptions` (IAP + Stripe history) | `challenge_badge_definitions`, `user_badges`, `challenge_curated_lists` |
| Yearly Free join cap (`usage_counters`) | `books.trusted_metadata` (never infer identity from names) |
| `create_notification` (keeps social-polish club/feed prefs) | RPCs: `create_user_reading_challenge`, `record_challenge_contribution`, `award_user_badge`, `respond_challenge_invite`, `user_has_paid_entitlement` |

Official challenge objectives + badge defs are seeded in the same migration. No db reset.

### Rule engine

Shared in `packages/utils` — **no per-challenge screens**. `evaluateBookForChallenge` + progress / contribution / badge / display / visibility / genre helpers. Finish and progress sessions call the same evaluator.

### Finish-event hook

`completeReadingSession` (web + iOS) → History/activity → `evaluateQualifyingEventForChallenges` → `record_challenge_contribution` RPC → badge RPC → celebration. Progress page/listening sessions also evaluate (web `book.ts`, iOS `library.ts`). Dedup: membership + objective + user_book + qualifying_event. Qualifying date is the event/session/completion date, not `updated_at`. Soft-fail if evaluation errors.

Book Completion celebration is **additive**: “N Challenges Updated” + optional Share to Feed for major milestones only. Existing sparkles / tags / rate prompt stay.

### Entitlement sync (iOS → web)

1. User buys or restores in the **iOS app** (`/upgrade` → StoreKit → `verifyApplePurchaseOnServer` → Edge `apple-iap-verify`).
2. Service role writes `user_subscriptions` (`subscription_tier`, `status`, `expires_at`, Apple transaction id).
3. Web and iOS both `SELECT` that row and map it with `toSubscriptionAccessFromRow` / `subscriptionIsActive` / `canCreateReadingChallenge`.
4. `create_user_reading_challenge` re-checks `user_has_paid_entitlement()` — never a client boolean.
5. Join still uses the yearly Free cap (3). Create Challenge is Plus/Home only.

**No web subscribe path.** `/upgrade/` and Plus gates use `IosSubscribePanel` / iOS copy. They never start Stripe Checkout. iOS `/upgrade` is App Store IAP + Restore. Historical Stripe subscribers keep access on both platforms and can open the billing portal. New purchases are iOS-only.

### Files

- Shared: `packages/utils/challenge*.ts`, `subscription.ts` (`canCreateReadingChallenge`, `IOS_SUBSCRIBE_COPY`)
- Migration: `supabase/migrations/20260907030000_reading_challenges_engine.sql`
- Web: `/challenges/`, `/challenges/challenge/?id=`, `/challenges/create/`, `ChallengeService` / contribution / badge, `IosSubscribePanel`, `FeatureLimitModal`, `/upgrade/` iOS-only subscribe (no Stripe Checkout), finish + progress hooks, `ProfileBadgeCarousel`
- iOS: `app/(app)/challenges/{index,[id],create}`, mirrored services, native IAP create gate, progress hook in `library.ts`

### Admin / curation follow-up

No staff dashboard. Featured flag, `challenge_curated_lists`, and `books.trusted_metadata` are the curation surfaces. Do not guess author identity or representation from names.

### Tests / verification

- Shared rule-engine + display + iOS-subscribe copy tests
- Web `tsc --noEmit`: pass
- Web `eslint` on challenge pages / celebration / FeatureLimitModal: pass
- Web `vitest`: 56 files, 341 tests (prior sprint count; challenge engine tests included)
- Web production `next build`: pass (`/challenges`, `/challenges/challenge`, `/challenges/create`)
- iOS `tsc --noEmit`: pass
- iOS `vitest`: 62 files, 325 tests pass
- Migration dry-run then applied (`db push --yes --linked`). No reset, no data loss
- Browser QA: Challenges are auth-gated. No web checkout was added
- Confirmed: no Android; celebration intact; private friend challenges stay off Feed; no identity guessing
- No `expo run:ios`. No TestFlight

**Last updated:** 6 September 2026 (BASIC / FREE tier)

---

## Sixteenth Sprint — BASIC / FREE tier ✅

Official Free-tier product on **web + iOS (iPhone/iPad)**. Android not in scope. No `expo run:ios`. No TestFlight. No commit in this pass. Stopped after Free — Plus features were not started.

**Product rule — subscribe only on iOS.** Web never starts Stripe Checkout. Once Plus is on `user_subscriptions`, bookmarked.online unlocks automatically. Locked UX uses `IOS_SUBSCRIBE_COPY` / `IosSubscribePanel`. No hardcoded prices in Free/Plus UX.

### Audit table

| Area | Status | Pointers |
|------|--------|----------|
| Entitlement layer | Already implemented → modified | `packages/utils/subscription.ts` (`ENTITLEMENTS`, structured `check*Limit`) |
| Custom shelves (1) + icons + privacy | Implemented + server Free cap | `canCreateCustomShelf` / `enforce_custom_shelf_limit`; `icon_key`; RLS |
| Audiobook HH:MM + progress | Already implemented | `packages/utils/listeningTime.ts` |
| Rereads without duplicating books | Already implemented | `read_count` / `read_number`; `AddAnotherReadButton` |
| Notes (Free) + no web quote title | Already implemented | `readingNotes`; title field stays off web |
| Favorite quotes (25) | Implemented + server Free cap | `checkSavedQuoteLimit` + `enforce_saved_quote_limit` |
| Quote PDF (own quotes) | Implemented (web PDF; iOS share text) | `packages/utils/quotePdf.ts` |
| AI quote graphics (3/month) | Implemented but needs AI | usage_counters consume-on-success; favorite picker; Higgsfield flag off |
| Clubs (3 create or join) | Implemented + server cap | Owner-create **does** consume a slot; leave/delete frees it |
| Challenges: create Plus / join 3/year | Implemented + server cap | Official/featured are free extras; user/community/club/friend consume |
| Reviews (half-star, mood, spoilers) | Already implemented | Free is not gated by `advanced_reviews` |
| Yearly books-read goal | Implemented but modified | `yearly_reading_goals` unique `(user_id, year)`; count by completion `session_date` |
| Basic Reading Calendar | Missing → implemented | `packages/utils/readingCalendar.ts`; Progress tab web + iOS |
| Yearly Wrapped | Missing → implemented | `/wrapped/` + iOS `wrapped`; monthly Wrapped stays Plus |
| Social (follow, Feed, profiles) | Already implemented | Public reader shelves now client-filtered |
| Mood / vibe discovery | Implemented but needed Free limits → wired | `moodDiscovery` + Feed mood chips / tag IDs |
| Affiliate links | Missing → implemented | ISBN Bookshop search + disclosure; no partner IDs |
| Event calendar | Already implemented | `/events/` — no new external integrations |
| iPad 4-col library | Already implemented | `libraryGridColumnCount` |
| Finished vs Read | Documented | UI **Finished**; DB `shelf_status = read` |

### What shipped

- Structured entitlement results + club/challenge kind helpers
- Server triggers: 2nd custom shelf, 4th club membership (create or join), 26th favorite quote, 4th consuming challenge join
- Yearly goal table + completion-date counting
- Reading Calendar (month nav, covers, most-recent + count)
- Yearly Wrapped (real activity dates, share opt-in, Reduce Motion)
- Quote PDF (web) / share text (iOS)
- Mood discovery on Feed; public-library privacy filter; affiliate disclosure
- Prices removed from comparison UX

### Product decisions (resolved)

1. **Club create vs join:** create-as-owner **does** consume the 3-club cap, same as join. Leave/delete frees a slot.
2. **Challenge join kinds:** official / featured are free extras. `user` / `community` / `club` / `friend` consume a yearly slot. Rejoin of the same challenge does not consume a second slot (`abandoned` is not a join kind).
3. **Finished vs Read:** one shelf; UI Finished, DB `read`.
4. **Calendar same-day books:** most-recent qualifying cover + `+N`.
5. **Yearly goal count:** completion `session_date` + `read_number`; library `finished_at` fallback only.
6. **Reviews dates:** tied via `read_number` + completion / `user_books` dates — no extra review date columns.
7. **Yearly Wrapped is Free;** `monthly_wrapped` stays Plus.

### Docs

- `docs/feature-entitlements.md` (new)
- `docs/FEATURE_GATING_MATRIX.md` kept in sync
- `docs/BASIC_FEATURE_AUDIT.md` points here

### Tests / verification

- Shared unit tests: entitlements (club create consumes; official challenges free extra), calendar, yearly goal, quote PDF, wrapped, affiliate, mood discovery, public library visibility
- Web `tsc --noEmit` and iOS `tsc --noEmit` after the two product-rule fixes
- Migrations `20260907050000_free_tier_server_limits.sql` + `20260907060000_club_create_and_challenge_slots.sql` dry-run then applied (`db push --yes --linked`). No reset, no data loss
- No `expo run:ios`. No TestFlight

---

## Next up (recommended)

| Priority | Item | Notes |
|----------|------|-------|
| P0 | Apply remaining DNA/challenge migrations if any | `…190000`, `…200000`, `…210000` upsert DNA, `…220000` challenge seeds. Free-tier `…050000` + club/challenge slot `…060000` |
| P1 | Enable AI quote graphics flag | When Higgsfield/AI ready; keep Free monthly consume semantics |
| P1 | Higgsfield assets | Re-auth MCP — see `docs/higgsfield/BLOCKER.md` |
| P1 | Stripe/ASC catalog cutover | Operator-only; leave documented |
