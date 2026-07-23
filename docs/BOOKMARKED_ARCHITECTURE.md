# Bookmarked — Architecture

> Comprehensive architecture reference for the Bookmarked monorepo. Extends the pre-refinement snapshot in `BOOKMARKED_CURRENT_ARCHITECTURE.md` with workflow detail, component inventory, and post-MVP navigation intent.

**Live:** https://bookmarked.online · **Stack:** Next.js 16 static export · Supabase · TypeScript · Tailwind 4

---

## 1. System overview

Bookmarked is a reading-life platform: search books, manage shelves, track progress, journal notes, write reviews, follow readers, post to a social feed, join book clubs, and message other users.

```
┌─────────────────────────────────────────────────────────────┐
│                     bookmarked.online                        │
│              Next.js 16 static export (GitHub Pages)         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Marketing  │  │  Auth pages  │  │  App shell (app) │  │
│  │  /, /privacy│  │  login/signup│  │  dashboard, feed │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ @supabase/supabase-js (browser)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL + Auth)              │
│  RLS on all tables · Realtime · Storage · Edge Functions   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Edge Function: isbndb (ISBNdb API proxy)        │
└─────────────────────────────────────────────────────────────┘
```

**Sibling app:** `apps/mobile` (Expo 54 + expo-router) shares the same Supabase project but has its own UI, navigation, and state layer (Zustand + React Query).

---

## 2. Monorepo layout

```
Bookmarked/
├── apps/
│   ├── web/                 # Primary product — Next.js 16
│   └── mobile/              # Expo 54 — scaffold / early auth
├── packages/
│   ├── types/               # Shared domain types
│   └── utils/               # Shared utilities (profanity filter)
├── supabase/
│   ├── migrations/          # 41 SQL migrations
│   └── functions/isbndb/    # Catalog API proxy
├── docs/                    # Architecture, progress, design
└── .github/workflows/       # GitHub Pages deploy
```

No root workspace manager — each app installs dependencies independently.

---

## 3. Web application layers

### 3.1 Routing (`apps/web/src/app/`)

| Group | Routes | Guard |
|-------|--------|-------|
| Public | `/`, `/login/`, `/signup/`, `/forgot-password/`, `/reset-password/`, `/privacy/`, `/terms/` | None |
| App `(app)` | `/dashboard/`, `/feed/`, `/reading-room/`, `/library/`, `/search/`, `/profile/`, … | `ClientAuthGuard` |

**Static export pattern:** Entity pages use query parameters (`/book/?id=`, `/reader/?username=`, `/clubs/club/?id=`). Route helpers live in `lib/routes/`.

**Pre-rendered segments:** Built-in shelf slugs via `generateStaticParams()` — `want-to-read`, `reading`, `read`.

### 3.2 Auth

| Piece | Path / behavior |
|-------|-----------------|
| Browser client | `lib/supabase/client.ts` — singleton, implicit flow, remember-me storage toggle |
| Actions | `lib/auth/actions.ts` — login, signup, password reset, profile save |
| Guard | `components/auth/ClientAuthGuard.tsx` — waits for `INITIAL_SESSION`, redirects to login or `/profile/setup/` |
| Hook | `lib/hooks/useAuthUser.ts` |

### 3.3 Data access

All runtime data flows through **Supabase JS in the browser**. Services in `lib/services/` encapsulate queries; mutations also live in `lib/actions/` (executed client-side despite the “actions” naming).

| Pattern | Example |
|---------|---------|
| Service function | `getUserLibraryBooks()`, `getReadingRoomData()` |
| Realtime hook | `useUserBooksRealtime(userId, onChange)` |
| Form action | `useActionState(updateReadingProgress, …)` |
| Edge Function | `lib/services/isbndb.ts` → `functions/v1/isbndb` |

### 3.4 State management

No global store on web. Page-level `useState`/`useEffect`, `ToastProvider` context, Realtime subscription hooks, `localStorage` for sort prefs and remember-me, URL params for tabs and entity IDs.

---

## 4. Post-MVP information architecture (Phase 1)

### 4.1 Page purposes

| Page | Purpose | Key components |
|------|---------|----------------|
| **Dashboard** | “What should I read today?” | `CurrentlyReadingRow`, `ReadingGoalPanel`, Quick Actions, `ActivityFeed` |
| **Reading Room** | Reading-life hub (tabs) | Overview, Progress, Journal, Notes, Reviews, History |
| **Library** | Organize books only | `LibraryViewShell`, `CustomShelfCollectionsPanel`, sort/filter |
| **Feed** | Social discovery | `FeedPostsPanel`, `PostComposer` |
| **Search** | Find & add books | `SearchForm`, ISBNdb results |
| **Profile** | Identity + settings | Avatar, bio, streak, notification/language/import prefs |
| **Book detail** | Per-book hub | Progress, reviews, journal, notes |

### 4.2 Navigation

| Viewport | Pattern |
|----------|---------|
| Desktop | Top nav — Home (Reading Room), Feed, Library, Search, Clubs, Messages, Profile + notification bell |
| Mobile | Fixed bottom nav — **Home** (Reading Room), Feed, Search, Messages, Profile |

Library is reachable from Dashboard quick actions and Reading Room overview, not a bottom-tab.

---

## 5. Feature workflows

### 5.1 Reading loop

```
Search → Add to shelf → Book detail → Update progress
    → reading_sessions row + user_books update → Activity event
    → Mark finished / direct-to-Read → completeReadingSession()
    → shelf_status = read → Review (optional)
```

Direct-to-Read and all finish paths call `completeReadingSession` (`apps/web/src/lib/services/completeReadingSession.ts`, mirrored in mobile). Page count resolution priority: user-selected edition → catalog page count → prior progress → manual entry → missing. When page count is missing, the book counts as read but `pages_read` stays excluded from stats until resolved.

| Step | Tables | UI |
|------|--------|-----|
| Add book | `books` upsert, `user_books` insert | `BookShelfActions`, search results |
| Track progress | `user_books`, `reading_sessions` | `ReadingProgressPanel` |
| Journal session notes | `reading_sessions.note` | `ReadingJournalSection` (per book) |
| Reading notes | `reading_notes` | `ReadingNotesSection`, `/notes/` search |
| Finish | `user_books`, `reading_sessions` (`page_count_status`, `total_pages`, `completed_at`) | `markBookFinished`, shelf move, `MissingPageCountDialog` |

### 5.2 Library organization

| Feature | Tables | UI |
|---------|--------|-----|
| Built-in shelves | `user_books.shelf_status` | `BookshelfView`, `LibraryGridView`, `/library/[shelf]/` |
| Custom shelves | `user_shelves`, `user_shelf_books` | `CustomShelfCollectionsPanel`, `/library/custom/` |
| Sort preference | `profiles.preferred_library_view`, localStorage | `LibraryViewShell`, `useShelfSort` |
| Shelf privacy | `profiles.shelf_visibility_*` | `ShelfPrivacyPanel` |

### 5.3 Social

| Feature | Tables | Routes |
|---------|--------|--------|
| Activity feed | `activity_events` | Dashboard `ActivityFeed`, `/feed/` activity tab |
| Posts | `posts`, `post_likes`, `post_comments` | `/feed/` posts tab |
| Follows | `follows` | `/reader/?username=`, `FollowButton` |
| Public library | `user_books` + RLS `shelf_visible_to_viewer()` | `/reader-library/?username=` |

### 5.4 Reviews

| Feature | Tables | UI |
|---------|--------|-----|
| Write / edit | `reviews` | `ReviewForm`, `BookReviewSection` |
| Reactions / replies | `review_reactions`, `review_replies` | `ReviewCard`, `ContentReactionBar` |
| Advanced ratings | dimensional columns on `reviews` | `ReviewForm` advanced mode |

### 5.5 Clubs & messaging

| Feature | Tables | Routes |
|---------|--------|--------|
| Clubs | `book_clubs`, `book_club_members`, `book_club_posts` | `/clubs/`, `/clubs/club/?id=` |
| DMs | `conversations`, `conversation_participants`, `messages` | `/messages/`, `/messages/thread/?id=` |
| Notifications | `notifications` | Bell + `/notifications/` |

---

## 6. Database schema (summary)

41 migrations. All `public` tables have RLS.

### Core domains

| Domain | Tables |
|--------|--------|
| Users | `profiles`, `follows` |
| Catalog | `books` (`external_source`: `isbndb` or legacy `open_library`) |
| Library | `user_books`, `user_shelves`, `user_shelf_books` |
| Reading | `reading_sessions`, `reading_notes`, `user_reading_note_categories` |
| Reviews | `reviews`, `review_reactions`, `review_replies` |
| Social | `activity_events`, `posts`, `post_likes`, `post_comments`, `post_drafts`, … |
| Clubs | `book_clubs`, `book_club_members`, `book_club_posts` |
| Messaging | `conversations`, `conversation_participants`, `messages` |
| Notifications | `notifications` |

### RLS patterns

| Pattern | Examples |
|---------|----------|
| Own-row CRUD | `user_books`, `reading_sessions`, `reading_notes` |
| Public read, own write | `profiles` |
| Visibility-gated | `reviews`, `user_shelves`, `activity_events`, `posts` |
| Security definer RPCs | `create_notification()`, `shelf_visible_to_viewer()`, `search_reading_notes()` |

### Storage buckets

- `avatars` — profile images (public read, owner write)
- `post-images` — post/comment attachments

---

## 7. Component inventory

### 7.1 Layout (`components/layout/`)

| Component | Role |
|-----------|------|
| `Navbar` | Public vs app variants, link sets |
| `NavbarMenu` | Desktop row + mobile drawer |
| `MobileBottomNav` | Phase 1 — five-tab mobile nav |
| `AppNavLink` | Static-safe full-page navigation |
| `BrandLogo`, `Footer` | Branding |

### 7.2 UI primitives (`components/ui/`)

`Button`, `ButtonLink`, `Input`, `Modal`, `ProgressBar`, `LoadingState`, `Toast`, `CopyLinkButton`

### 7.3 Books (`components/books/`)

`BookCard`, `BookCover`, `BookDetailsPage`, `ReadingProgressPanel`, `ReadingJournalSection`, `ReadingNotesSection`, `BookReviewSection`, shelf actions

### 7.4 Library (`components/library/`)

`LibraryViewShell`, `BookshelfView`, `LibraryGridView`, `LibraryOrganizePanel`, `CustomShelfCollectionsPanel`, `ShelfSearchFilter`, `ShelfStatsPanel`

### 7.5 Reading Room (`components/reading-room/`)

`CurrentlyReadingRow`, `BookMiniGrid`, `ReadingRoomSection`, `ReadingRoomTabs` (+ tab panels)

### 7.6 Social (`components/social/`)

`FeedPostsPanel`, `PostCard`, `PostComposer`, `FollowButton`, `ProfileFeedSection`, `FeedSearchBar`

### 7.7 Profile (`components/profile/`)

`AvatarUpload`, `ReadingStreakCard`, `ShelfPrivacyPanel`, `LibraryImportPanel`, `LanguagePreferencePanel`

### 7.8 Services map (`lib/services/`)

See `BOOKMARKED_CURRENT_ARCHITECTURE.md` § Key services — 40+ service modules covering catalog, library, reading, social, clubs, messaging, notifications, analytics, and import.

---

## 8. External integrations

| Service | Access | Secret location |
|---------|--------|-----------------|
| ISBNdb | Edge Function proxy | `ISBNDB_API_KEY` Supabase secret |
| Giphy | Browser (optional) | `NEXT_PUBLIC_GIPHY_API_KEY` |
| Google Books | Cover fallback URL | No key |
| Supabase Auth | Browser anon key | `NEXT_PUBLIC_SUPABASE_*` |

---

## 9. Deployment

| Item | Value |
|------|-------|
| CI | `.github/workflows/deploy.yml` on push to `main` |
| Build | `apps/web`: `npm run build` → `out/` |
| Host | GitHub Pages + `CNAME` → bookmarked.online |
| Env validation | `scripts/validate-env.mjs` at build time |

---

## 10. Mobile app relationship

| Aspect | Web | Mobile |
|--------|-----|--------|
| Framework | Next.js static export | Expo + expo-router |
| Navigation | App Router + query params | Native file-based dynamic routes |
| State | Local React state | Zustand + React Query |
| Shared | Supabase project, RLS, types (partial) | Same backend |

Web is the source of truth for feature completeness; mobile reuses backend, not web components.

---

## 11. Design system

Tokens in `app/globals.css`: primary (mauve `#B89DBB`), puce-red, rust, royal-orange, orange-yellow, background, surface, border.

Utility classes: `.pill-tabs`, `.feed-header-gradient`, `.reading-room-bg`, `.app-shell-gradient`.

Full reference: `docs/ui/DESIGN_SYSTEM.md`, `docs/ui/UI_CONTEXT.md`.

---

## 12. Known constraints

See `docs/TECHNICAL_DEBT.md` for the full register. Headline items:

1. Static export — no server runtime or middleware
2. Full-page navigation for reliability on GitHub Pages
3. Query-param entity routes
4. Implicit auth flow for cross-device email links
5. ISBNdb key never exposed to browser

---

## Related documentation

| Doc | Purpose |
|-----|---------|
| `BOOKMARKED_CURRENT_ARCHITECTURE.md` | Pre-refinement point-in-time audit |
| `PROJECT_PROGRESS.md` | Refinement phase task tracker |
| `TECHNICAL_DEBT.md` | Debt register with priorities |
| `project/MASTER_TASK_LIST.md` | MVP-era completion record |
| `ui/DESIGN_SYSTEM.md` | Visual design tokens |

**Last updated:** July 2026
