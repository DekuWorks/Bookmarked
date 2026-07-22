# Bookmarked — Current Architecture Audit

> Phase 0, Task 0.1 — documentation only. Captures the repository as of July 2026 before the refinement phase. No application code was changed.

---

## Overview

**Bookmarked** is a reading-life platform: search books, manage shelves, track progress, write reviews, follow readers, post to a social feed, join book clubs, take reading notes, and message other users.

The **web app** (`apps/web`) is the primary product surface. It is a **Next.js 16 static export** deployed to **GitHub Pages** at **https://bookmarked.online**. All runtime data access goes through the **Supabase JS client** in the browser — there is no Next.js server, API routes, or middleware at runtime in production.

A sibling **Expo/React Native mobile app** (`apps/mobile`) shares the same Supabase backend and type definitions but uses its own UI and navigation stack.

**Book catalog data** is sourced from **ISBNdb** (via a Supabase Edge Function proxy). Open Library was replaced; legacy `open_library` rows may still exist in the `books` table, and `openLibrary.ts` is now a thin compatibility re-export of `isbndb.ts`.

---

## Monorepo layout

```
Bookmarked/
├── apps/
│   ├── web/          # Next.js 16 web app (primary focus)
│   └── mobile/       # Expo 54 + expo-router mobile app
├── packages/
│   ├── types/        # Shared TypeScript domain types
│   └── utils/        # Shared utilities (profanity filter)
├── supabase/
│   ├── migrations/   # 41 SQL migrations (schema + RLS)
│   └── functions/
│       └── isbndb/   # Edge Function — ISBNdb API proxy
├── docs/             # Project documentation
└── .github/workflows/deploy.yml
```

There is **no root `package.json`** or workspace manager (npm/yarn/pnpm workspaces). Each app installs dependencies independently (`apps/web`, `apps/mobile`).

---

## Web stack

| Layer | Technology | Version / notes |
|-------|------------|-----------------|
| Framework | Next.js (App Router) | 16.2.7 |
| React | react / react-dom | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 (`@tailwindcss/postcss`) |
| Fonts | Geist Sans + Geist Mono | via `next/font/google` |
| Backend client | `@supabase/supabase-js` | ^2.107.0 |
| SSR package (dev/local only) | `@supabase/ssr` | ^0.10.3 — used in `server.ts` / `middleware.ts` but not active in static export |
| Build output | `output: "export"` | Static files → `apps/web/out/` |
| Lint | ESLint + eslint-config-next | ^9 / 16.2.7 |

Key config: `apps/web/next.config.ts`
- `output: "export"` + `trailingSlash: true`
- `images.unoptimized: true` (required for static hosting)
- Remote image patterns: `images.isbndb.com`, legacy `covers.openlibrary.org`, Google Books, Supabase Storage

---

## Routing

Next.js App Router under `apps/web/src/app/`. Routes fall into three groups:

### Public (no auth guard)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Marketing landing page |
| `/login/` | `app/login/page.tsx` | Sign in |
| `/signup/` | `app/signup/page.tsx` | Create account |
| `/forgot-password/` | `app/forgot-password/page.tsx` | Request reset email |
| `/reset-password/` | `app/reset-password/page.tsx` | Set new password (from email link) |
| `/privacy/` | `app/privacy/page.tsx` | Privacy policy |
| `/terms/` | `app/terms/page.tsx` | Terms of service |

### Authenticated app shell (`(app)` route group)

Wrapped by `app/(app)/layout.tsx`: `Navbar` (app variant) + `ClientAuthGuard` + `ToastProvider`.

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard/` | `(app)/dashboard/page.tsx` | Home dashboard, activity summary |
| `/feed/` | `(app)/feed/page.tsx` | Social feed (posts + activity) |
| `/reading-room/` | `(app)/reading-room/page.tsx` | Currently-reading focus view |
| `/notes/` | `(app)/notes/page.tsx` | Reading notes search/browse |
| `/library/` | `(app)/library/page.tsx` | Full library overview |
| `/library/[shelf]/` | `(app)/library/[shelf]/page.tsx` | Built-in shelf (pre-rendered slugs) |
| `/library/custom/` | `(app)/library/custom/page.tsx` | Custom shelf collections |
| `/search/` | `(app)/search/page.tsx` | ISBNdb book search |
| `/book/` | `(app)/book/page.tsx` | Book details (`?id=`) |
| `/author/` | `(app)/author/page.tsx` | Author catalog (`?name=`) |
| `/series/` | `(app)/series/page.tsx` | Series grouping (`?name=`) |
| `/reader/` | `(app)/reader/page.tsx` | Public reader profile (`?username=`) |
| `/reader-library/` | `(app)/reader-library/page.tsx` | Another user's library |
| `/reader-library/shelf/` | `(app)/reader-library/shelf/page.tsx` | Another user's shelf (`?username=&shelf=`) |
| `/profile/` | `(app)/profile/page.tsx` | Own profile settings |
| `/profile/setup/` | `(app)/profile/setup/page.tsx` | First-time username setup |
| `/clubs/` | `(app)/clubs/page.tsx` | Book clubs list |
| `/clubs/club/` | `(app)/clubs/club/page.tsx` | Club detail (`?id=`) |
| `/messages/` | `(app)/messages/page.tsx` | Inbox |
| `/messages/thread/` | `(app)/messages/thread/page.tsx` | Conversation (`?id=`) |
| `/notifications/` | `(app)/notifications/page.tsx` | Notification center |

### Query-param routes (static export pattern)

Because GitHub Pages cannot run dynamic server routes, entity detail pages use **query parameters** instead of path segments:

| Helper | Example URL |
|--------|-------------|
| `bookDetailsPath(id)` | `/book/?id={uuid}` |
| `readerProfilePath(username)` | `/reader/?username={name}` |
| `clubDetailPath(id)` | `/clubs/club/?id={uuid}` |
| `messageThreadPath(id)` | `/messages/thread/?id={uuid}` |
| `readerLibraryShelfPath(u, shelf)` | `/reader-library/shelf/?username=&shelf=` |

Route helpers live in `apps/web/src/lib/routes/`.

### Pre-rendered dynamic segments

Only built-in shelf slugs are statically generated via `generateStaticParams()`:
- `want-to-read`, `reading`, `read` (from `SHELF_CONFIG` in `lib/constants/shelves.ts`)

---

## Auth flow

### Provider

Supabase Auth (email + password). No OAuth providers configured in the web client.

### Client setup

`apps/web/src/lib/supabase/client.ts`:
- Singleton browser client via `createClient()`
- **Implicit auth flow** (not PKCE) — required so email confirmation and password-reset links work when opened on a different device than the one that requested them
- Session storage toggled by "Remember me" (`localStorage` vs `sessionStorage`)
- `resetBrowserClient()` clears cached client when auth storage changes

### Auth actions

`apps/web/src/lib/auth/actions.ts` — client-side form actions (`useActionState`):
- `login`, `signup`, `requestPasswordReset`, `updatePassword`, `saveProfile`
- Redirect targets use `authRedirectUrl()` → `https://bookmarked.online` in production (`lib/auth/siteUrl.ts`)

### Route protection

**Production (static export):** `ClientAuthGuard` (`components/auth/ClientAuthGuard.tsx`)
1. Waits for Supabase `INITIAL_SESSION` event (avoids race on page load)
2. Redirects unauthenticated users to `/login/?redirect=…` via `staticRedirect()` (full page navigation)
3. Checks `profiles.username`; redirects to `/profile/setup/` if incomplete
4. Handles `SIGNED_OUT` → login redirect

**Dev-only artifact:** `lib/supabase/middleware.ts` defines cookie-based session refresh and server redirects, but there is **no `middleware.ts` at the app root** — it is unused in the static export deployment.

### Auth UI components

| Component | Path |
|-----------|------|
| `LoginForm` | `components/auth/LoginForm.tsx` |
| `SignupForm` | `components/auth/SignupForm.tsx` |
| `ForgotPasswordForm` | `components/auth/ForgotPasswordForm.tsx` |
| `ResetPasswordForm` | `components/auth/ResetPasswordForm.tsx` |
| `ProfileSetupForm` | `components/auth/ProfileSetupForm.tsx` |
| `RememberMeField` | `components/auth/RememberMeField.tsx` |
| `LogoutButton` | `components/auth/LogoutButton.tsx` |
| `ClientAuthGuard` | `components/auth/ClientAuthGuard.tsx` |

### Hook

`useAuthUser` (`lib/hooks/useAuthUser.ts`) — subscribes to auth state, returns `User | null | undefined`.

---

## Supabase

### Client configuration

| File | Role |
|------|------|
| `lib/supabase/client.ts` | Browser singleton (production runtime) |
| `lib/supabase/server.ts` | Server Component client (cookies) — limited use in static export |
| `lib/supabase/middleware.ts` | Session refresh helper — not wired in production |
| `lib/env.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` validation |

Env vars must use **static** `process.env.NEXT_PUBLIC_*` references so Next.js inlines them at build time (dynamic access breaks static export).

### RLS patterns

All application tables have Row Level Security enabled. Common patterns:

| Pattern | Example |
|---------|---------|
| Own-row CRUD | `user_books`, `reading_sessions`, `reading_notes` — `auth.uid() = user_id` |
| Public read, own write | `profiles` — anyone can SELECT; only owner INSERT/UPDATE |
| Visibility-gated read | `reviews` — public or own; `user_shelves` — respects shelf visibility |
| Follower-aware | `posts`, `activity_events` — visible to self + followers via helper functions |
| Security definer helpers | `shelf_visible_to_viewer()`, `create_notification()` — bypass RLS for controlled operations |
| Storage buckets | `avatars`, `post-images` — public read; owner upload/update/delete |

### Edge Function: `isbndb`

`supabase/functions/isbndb/index.ts`:
- Proxies ISBNdb API v2 (`https://api2.isbndb.com`)
- API key stored as Supabase secret `ISBNDB_API_KEY` (never exposed to browser)
- Client calls: `GET {SUPABASE_URL}/functions/v1/isbndb?path=books/{query}&page=1&pageSize=12`
- Allowed paths: `book/`, `books/`, `author/`, `authors/`
- Web client wrapper: `lib/services/isbndb.ts`

### Realtime subscriptions

Hooks subscribe to Supabase Realtime for live updates:
- `useActivityFeedRealtime` — activity feed
- `usePostsRealtime` — social posts
- `useUserBooksRealtime` — shelf changes
- `useClubDiscussionsRealtime` — book club posts

Tables with `replica identity full` (for realtime): `notifications`, `reading_sessions`, `user_books`, `reading_notes`, `book_club_posts`, `posts`.

---

## Database schema summary

41 migrations in `supabase/migrations/`. Tables grouped by domain:

### Users & profiles

| Table | Key columns / notes |
|-------|---------------------|
| `profiles` | `username`, `display_name`, `bio`, `avatar_url`, `favorite_genres`, `preferred_library_view`, `yearly_reading_goal`, `preferred_language`, per-shelf visibility (`shelf_visibility_*`), notification prefs (`notify_*`) |
| `follows` | `follower_id`, `following_id` — social graph |

### Books & catalog

| Table | Key columns / notes |
|-------|---------------------|
| `books` | `external_source` (`isbndb` / legacy `open_library`), `external_id` (ISBN), `title`, `author`, `cover_url`, `page_count`, `isbn`, `publisher`, `subjects`, `series_name`, `series_position` |

### Shelves & library

| Table | Key columns / notes |
|-------|---------------------|
| `user_books` | `shelf_status` (`want_to_read` \| `currently_reading` \| `read`), `progress_pages`, `progress_percent`, `started_at`, `finished_at`, `rating`, `is_favorite`, `read_count`, `completion_tags`, `dnf`, `expected_read_date` |
| `user_shelves` | Custom shelves: `name`, `slug`, `genre`, `visibility`, `sort_order` |
| `user_shelf_books` | Junction: custom shelf ↔ book |

### Reading progress & notes

| Table | Key columns / notes |
|-------|---------------------|
| `reading_sessions` | Per-session log: `page_start`, `page_end`, `pages_read`, `percent_complete`, `note`, `read_number` |
| `reading_notes` | Journal entries: `page_number`, `chapter`, `title`, `note`, `quote`, `category`, `visibility` |
| `user_reading_note_categories` | Custom note categories per user |

### Reviews

| Table | Key columns / notes |
|-------|---------------------|
| `reviews` | `rating`, `review_body`, `has_spoilers`, `visibility`, `read_number`, `edition`, `feelings[]`, advanced dims (`plot`, `characters`, etc.), `rating_mode`, `rating_emoji` |
| `review_reactions` | Like/dislike on reviews |
| `review_replies` | Threaded replies on reviews |

### Social & feed

| Table | Key columns / notes |
|-------|---------------------|
| `activity_events` | Activity feed items: `event_type`, `entity_type`, `entity_id`, `metadata_json`, `visibility` |
| `posts` | Social posts: `body`, `image_url`, `book_id`, `repost_of_post_id` |
| `post_likes` | Post likes |
| `post_comments` | Post comments (`attachment_url`) |
| `post_comment_reactions` | Reactions on comments |
| `post_comment_replies` | Threaded comment replies |
| `post_drafts` | Saved post drafts |

### Messaging

| Table | Key columns / notes |
|-------|---------------------|
| `conversations` | `type` (`direct` \| `group`), `title`, `created_by` |
| `conversation_participants` | `role`, `last_read_at`, `pinned_at` |
| `messages` | `body`, `attachment_url`, `deleted_at` |

### Notifications

| Table | Key columns / notes |
|-------|---------------------|
| `notifications` | `type`, `title`, `body`, `actor_id`, `link_url`, `metadata_json`, `read_at` — created via `create_notification()` with dedup |

### Book clubs

| Table | Key columns / notes |
|-------|---------------------|
| `book_clubs` | `name`, `description`, `image_url`, `current_book_id`, `visibility` |
| `book_club_members` | `role` (`owner` \| `member`) |
| `book_club_posts` | Club discussion posts |

### Storage buckets

- `avatars` — profile images
- `post-images` — post/comment attachments

---

## Key services and hooks

### Services (`apps/web/src/lib/services/`)

| Service | Responsibility |
|---------|----------------|
| `isbndb.ts` | ISBNdb catalog search, editions, book details (via Edge Function) |
| `openLibrary.ts` | Compatibility re-exports from `isbndb.ts` |
| `books.ts` | Upsert catalog books, add to shelf, shelf status changes |
| `bookMetadata.ts` | Enrich stale catalog entries |
| `covers.ts` | Resolve cover URLs (ISBNdb, fallbacks) |
| `library.ts` | Fetch/group user library by shelf |
| `customShelves.ts` | CRUD custom shelves and shelf-book assignments |
| `shelfVisibility.ts` | Per-shelf privacy for public profiles |
| `suggestedShelves.ts` | Genre-based shelf suggestions |
| `readingSessions.ts` | Log reading sessions, stats by date range |
| `readingNotes.ts` | CRUD + search reading notes |
| `noteCategories.ts` | Builtin + custom note categories |
| `readingRoom.ts` | Currently-reading aggregation |
| `readingInsights.ts` | Streaks, analytics |
| `readingGoal.ts` | Yearly reading goal |
| `readingActivity.ts` | Activity panel data |
| `transferUserBook.ts` | Transfer stats between editions |
| `bookDetails.ts` | Assembled book page data |
| `reviews` (via `reviewEngagement.ts`, actions) | Review CRUD, reactions, replies |
| `reviewEngagement.ts` | Review reactions, threaded replies, mentions |
| `communityRatings.ts` | Aggregated community ratings |
| `socialFeed.ts` | Activity feed (for-you, following) |
| `posts.ts` | Social posts, likes, comments, reposts, image upload |
| `postDrafts.ts` | Draft post persistence |
| `postCommentEngagement.ts` | Comment reactions and replies |
| `feedSearch.ts` | Unified feed search (posts, users, books) |
| `follows.ts` | Follow/unfollow, follower lists |
| `activity.ts` | Record and format activity events |
| `profile.ts` | Profile fetch/update |
| `avatar.ts` | Avatar upload to Storage |
| `notifications.ts` | Notification CRUD + preference-aware creation |
| `messages.ts` | Conversations, send/receive, pins |
| `bookClubs.ts` | Club CRUD, membership, discussions |
| `series.ts` | Series grouping from catalog |
| `authorBooks.ts` | Author page book lists |
| `publicLibrary.ts` | View another user's shelves (respects visibility) |
| `recommendations.ts` | "Because you read" suggestions |
| `trending.ts` | Trending books |
| `analytics.ts` | Library analytics |
| `goodreadsImport.ts` | CSV import |
| `giphy.ts` | GIF search in composers |
| `staleCatalogRefresh.ts` | Background catalog refresh for old entries |

### Hooks (`apps/web/src/lib/hooks/`)

| Hook | Purpose |
|------|---------|
| `useAuthUser` | Current Supabase user |
| `useActivityFeedRealtime` | Live activity feed updates |
| `usePostsRealtime` | Live post updates |
| `useUserBooksRealtime` | Live shelf changes |
| `useClubDiscussionsRealtime` | Live club post updates |
| `useShelfSort` | Shelf sort preference |
| `useReadingNoteCategories` | Note category list |
| `usePreferredLocale` / `usePreferredOpenLibraryLanguage` | Language preference |
| `useStaleCatalogRefresh` | Trigger catalog refresh |
| `useFocusTrap` | Accessibility for modals/drawers |

### Server actions (`apps/web/src/lib/actions/`)

| File | Actions |
|------|---------|
| `book.ts` | `updateReadingProgress`, `markBookFinished`, shelf changes, reviews, DNF, dates |
| `library.ts` | Library-level mutations |
| `profile.ts` | Profile updates |

Auth actions live in `lib/auth/actions.ts` (not under `actions/`).

---

## Feature areas

### Reading progress

- **Data:** `user_books.progress_pages`, `progress_percent`, `started_at`, `finished_at`, `dnf`, `expected_read_date`, `read_count`
- **UI:** `ReadingProgressPanel`, `ReadingJournalSection`, `ReadingActivityPanel`
- **Logic:** `lib/actions/book.ts` (`updateReadingProgress`, `markBookFinished`) creates `reading_sessions` rows and updates `user_books`; supports multi-read (`read_number`) and completion tags
- **Transfer:** `TransferReadingStatsModal` + `transferUserBook.ts` for edition changes

### Reviews

- **Data:** `reviews` table with regular/advanced rating modes, emoji ratings, spoiler flag, visibility, feelings, dimensional scores
- **Engagement:** `review_reactions`, `review_replies` with threaded replies and attachments
- **UI:** `ReviewForm`, `ReviewCard`, `ContentReactionBar`
- **Logic:** `lib/actions/book.ts`, `lib/services/reviewEngagement.ts`, `lib/constants/reviewFeelings.ts`, `lib/constants/reviewEmojis.ts`

### Shelves

- **Built-in:** Three statuses — Want to Read, Currently Reading, Read (`lib/constants/shelves.ts`)
- **Custom:** `user_shelves` + `user_shelf_books` with slug, genre, visibility
- **Privacy:** Per-status visibility on profile (`shelf_visibility_*` on `profiles`); `shelf_visible_to_viewer()` RLS helper
- **UI:** `CustomShelfSection`, `CreateShelfModal`, `ShelfSelectMenu`, `AddToCustomShelfMenu`, `ShelfPrivacyPanel`
- **Logic:** `library.ts`, `customShelves.ts`, `shelfVisibility.ts`, `suggestedShelves.ts`

### Feed

- **Two views:** Posts tab (`posts` table) and Activity tab (`activity_events`)
- **Tabs:** For You / Following
- **Search:** `FeedSearchBar` + `feedSearch.ts` (users, books, posts)
- **Realtime:** `usePostsRealtime`, `useActivityFeedRealtime`
- **UI:** `FeedPostsPanel`, `PostComposer`, `PostCard`, `FeedCard`, `ProfileFeedSection`
- **Logic:** `socialFeed.ts`, `posts.ts`, `activity.ts`

### Profile

- **Own profile:** `/profile/` — avatar upload, language, notification prefs, shelf privacy, Goodreads import, reading streak
- **Public profile:** `/reader/?username=` — follow stats, shelf preview, feed section
- **Setup:** `/profile/setup/` — required username on first login
- **Logic:** `profile.ts`, `avatar.ts`, `follows.ts`, `readingInsights.ts`, `goodreadsImport.ts`

### Clubs

- **Routes:** `/clubs/`, `/clubs/club/?id=`
- **Data:** `book_clubs`, `book_club_members`, `book_club_posts`
- **UI:** `ClubsPage`, `ClubMembersPanel`, `ClubDiscussionCard`, `ClubDiscussionComposer`, `BookPickerModal`
- **Logic:** `bookClubs.ts`, realtime via `useClubDiscussionsRealtime`

### Notes

- **Route:** `/notes/`
- **Data:** `reading_notes`, `user_reading_note_categories`
- **UI:** `ReadingNotesSection`, `ReadingNoteForm`, `ReadingNoteCard`, `NotesSearchResults`
- **Logic:** `readingNotes.ts`, `noteCategories.ts`

### Messages

- **Routes:** `/messages/`, `/messages/thread/?id=`
- **Data:** `conversations`, `conversation_participants`, `messages`
- **UI:** `MessageList`, `MessageBubble`, `MessageComposer`, `NewMessageModal`, `MessagesUnreadBadge`
- **Logic:** `messages.ts`

### Notifications

- **Route:** `/notifications/`
- **Data:** `notifications` + preference columns on `profiles`
- **UI:** `NotificationBell` (navbar), `NotificationItem`, `NotificationPreferencesPanel`
- **Logic:** `notifications.ts` — `create_notification()` respects per-type prefs and deduplicates

---

## Navigation

### Navbar (`components/layout/Navbar.tsx`)

Two variants:
- **public** — landing page links (About, Features, Contact) + `NavbarPublicAuth`
- **app** — authenticated links: Dashboard, Feed, Reading Room, Notes, Library, Search, Book Clubs, Messages, Profile + `NotificationBell` + `LogoutButton`

### Mobile-responsive navigation (`components/layout/NavbarMenu.tsx`)

- **Desktop (`md+`):** Horizontal link row
- **Mobile (`< md`):** Hamburger → full-screen drawer (portal) with focus trap, 44px touch targets, escape-to-close
- **App links:** `AppNavLink` uses `window.location.assign()` instead of Next.js client routing (unreliable with static export on GitHub Pages)

### Layout tokens (`lib/constants/layout.ts`)

Shared responsive classes: `container`, `appMain`, `pageStack`, `formPanel`, etc.

---

## State management

No global state library (no Zustand, Redux, Jotai on web). State approach:

| Pattern | Usage |
|---------|-------|
| React `useState` / `useEffect` | Page-level data loading |
| `useActionState` | Form submissions (auth, book actions) |
| React Context | `ToastProvider` only (`components/ui/Toast.tsx`) |
| Supabase Realtime hooks | Live feed, posts, shelves, club discussions |
| `localStorage` / `sessionStorage` | Remember me, shelf sort prefs, locale |
| URL search params | Feed tabs, book detail sections, entity IDs |

Mobile app uses **Zustand** and **TanStack React Query** — not shared with web.

---

## Styling / design tokens

Defined in `apps/web/src/app/globals.css`:

| Token | Value | Tailwind class |
|-------|-------|----------------|
| Primary (mauve) | `#B89DBB` | `primary` |
| Puce red | `#642F37` | `puce-red` |
| Rust | `#C0350F` | `rust` |
| Royal orange | `#F3904B` | `royal-orange` |
| Orange yellow | `#F7C767` | `orange-yellow` |
| Background | `#FAF8FC` | `background` |
| Surface | `#FCFAFE` | `surface` |
| Text | `#1A1A1A` | `text` |
| Text muted | `#6B6B6B` | `text-muted` |
| Border | `#E5DFEB` | `border` |

Brand gradients: `.landing-hero-gradient`, `.feed-header-gradient`, `.app-shell-gradient`, `.pill-tabs`.

Additional design docs: `docs/ui/DESIGN_SYSTEM.md`, `docs/ui/UI_CONTEXT.md`.

### Shared UI components (`components/ui/`)

`Button`, `ButtonLink`, `Input`, `Modal`, `ProgressBar`, `LoadingState`, `Toast`, `CopyLinkButton`

---

## Environment variables

### Web (`apps/web/.env.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (RLS-protected) |
| `NEXT_PUBLIC_GIPHY_API_KEY` | No | GIF search in composers (paste URL works without) |
| `ISBNDB_API_KEY` | Local reference only | Actual key lives as Supabase Edge Function secret |

Validated at build time by `apps/web/scripts/validate-env.mjs`.

### Mobile (`apps/mobile/.env.example`)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Same Supabase project |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Same anon key |
| `EXPO_PUBLIC_SITE_URL` | Auth email redirect origin (default `https://bookmarked.online`) |
| `EXPO_PUBLIC_GIPHY_API_KEY` | GIF search |

### GitHub Actions secrets (deploy workflow)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GIPHY_API_KEY`, `ISBNDB_API_KEY` (documented; Edge Function secret on Supabase)

---

## Deployment

| Item | Value |
|------|-------|
| **CI/CD** | `.github/workflows/deploy.yml` — triggers on push to `main` + `workflow_dispatch` |
| **Build** | `apps/web`: `npm install` → `npm run build` → `apps/web/out/` |
| **Host** | GitHub Pages |
| **Domain** | `bookmarked.online` (`apps/web/public/CNAME`) |
| **Deploy action** | `actions/deploy-pages@v4` with stuck-deployment cancellation + retries |
| **Concurrency** | `group: pages`, `cancel-in-progress: true` |

Production site: **https://bookmarked.online**

---

## Mobile app relationship

| Aspect | Web | Mobile |
|--------|-----|--------|
| Framework | Next.js 16 static export | Expo 54 + expo-router 6 |
| React | 19.2.4 | 19.1.0 |
| Styling | Tailwind 4 | NativeWind 4 + Tailwind 3 |
| State | Local React state + Context | Zustand + TanStack Query |
| Navigation | Next.js App Router + query params | File-based expo-router with dynamic segments |
| Shared backend | Same Supabase project + RLS | Same |
| Shared types | `packages/types` (web re-exports via `apps/web/src/types`) | `apps/mobile/src/types` |
| Shared utils | `packages/utils` (profanity) | Can import same |
| Book catalog | ISBNdb via Edge Function | Same Supabase + Edge Function |
| Deploy | GitHub Pages | EAS Build (iOS) |

Mobile has **native dynamic routes** (e.g. `book/[id]`, `reader/[username]`) where web uses query params for static export compatibility.

---

## Known constraints

### Static export (GitHub Pages)

1. **No server runtime** — all data fetching and mutations are client-side via Supabase JS
2. **No middleware** — `ClientAuthGuard` replaces server-side route protection
3. **No API routes or Server Actions at runtime** — `useActionState` handlers run in the browser
4. **Query-param entity routes** — book, club, thread, reader profile use `?id=` / `?username=` instead of path segments
5. **Full-page navigation** — `AppNavLink` and `staticRedirect()` use `window.location.assign()` because Next.js 16.2 client routing is unreliable with `output: "export"` on GitHub Pages
6. **Pre-rendered shelves only** — `library/[shelf]` supports three built-in slugs; custom shelves use `/library/custom/`
7. **Unoptimized images** — required for static hosting
8. **Implicit auth flow** — chosen over PKCE for cross-device email links
9. **ISBNdb key server-side only** — browser never sees `ISBNDB_API_KEY`; all catalog calls go through Edge Function
10. **Legacy Open Library data** — `books.external_source = 'open_library'` rows may exist; new catalog writes use `isbndb`

---

## Files worth reusing for refinement phase

### Architecture & patterns

| File | Why |
|------|-----|
| `lib/supabase/client.ts` | Auth flow, singleton pattern, remember-me storage |
| `lib/navigation/staticRedirect.ts` | Static-safe redirects |
| `lib/routes/*.ts` | Centralized URL builders for query-param routes |
| `lib/env.ts` + `scripts/validate-env.mjs` | Build-time env validation |
| `lib/staticExport.ts` | Static param generation pattern |
| `components/auth/ClientAuthGuard.tsx` | Auth gate pattern for static hosting |
| `components/layout/AppNavLink.tsx` | Static-safe navigation |

### Domain logic (high reuse value)

| File | Why |
|------|-----|
| `lib/services/isbndb.ts` | Complete catalog client |
| `lib/services/books.ts` | Catalog upsert + shelf operations |
| `lib/actions/book.ts` | Reading progress, reviews, shelf mutations |
| `lib/services/socialFeed.ts` + `posts.ts` | Feed architecture |
| `lib/services/customShelves.ts` | Custom shelf CRUD |
| `lib/services/readingSessions.ts` + `readingNotes.ts` | Progress journaling |
| `lib/services/bookClubs.ts` | Club feature |
| `lib/services/messages.ts` + `notifications.ts` | Messaging + notifications |
| `packages/types/index.ts` | Canonical domain types |

### UI components (design system anchors)

| Directory | Why |
|-----------|-----|
| `components/ui/` | Base primitives |
| `components/books/` | Book cards, details, progress, notes |
| `components/social/` | Feed, posts, follows, reactions |
| `components/layout/` | Navbar, responsive menu, branding |
| `app/globals.css` | Design tokens and gradients |

### Infrastructure

| File | Why |
|------|-----|
| `next.config.ts` | Static export + image patterns |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `supabase/functions/isbndb/` | Catalog proxy |
| `supabase/migrations/` | Full schema history |

---

## Related documentation

| Doc | Path |
|-----|------|
| Architecture context (earlier draft) | `docs/architecture/ARCHITECTURE_CONTEXT.md` |
| Design system | `docs/ui/DESIGN_SYSTEM.md` |
| Feature list | `docs/Bookmarked_Features_Complete.md` |
| Master task list | `docs/project/MASTER_TASK_LIST.md` |
| Web app flowchart | `docs/Bookmarked_WebApp_Flowchart.md` |
