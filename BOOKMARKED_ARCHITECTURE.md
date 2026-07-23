# Bookmarked — Architecture

> **Phase 0 audit** — July 23, 2026. Live: [bookmarked.online](https://bookmarked.online)

Comprehensive architecture reference for the Bookmarked monorepo: Next.js web (static export) + Expo mobile + Supabase backend.

---

## 1. System overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Clients                                                          │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐  │
│  │  Web (Next.js 16)       │  │  Mobile (Expo 54 + RN 0.81)  │  │
│  │  bookmarked.online      │  │  iOS (TestFlight)            │  │
│  │  Static export / GH Pages│  │  expo-router file routes     │  │
│  └───────────┬─────────────┘  └──────────────┬───────────────┘  │
└──────────────┼─────────────────────────────────┼──────────────────┘
               │  @supabase/supabase-js (browser / RN)               │
               ▼                                                     │
┌──────────────────────────────────────────────────────────────────┐
│  Supabase                                                         │
│  PostgreSQL + Auth + RLS + Realtime + Storage + Edge Functions   │
└───────────┬──────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────┐
│  External APIs (server-side)                                      │
│  ISBNdb (catalog) · Giphy (optional) · Google Books (covers)     │
└──────────────────────────────────────────────────────────────────┘
```

**Book catalog:** Production search uses **ISBNdb** via the `isbndb` Edge Function. `openLibrary.ts` is a backward-compatible re-export. Legacy `books.external_source = 'open_library'` rows may still exist. **Google Books** provides cover URL fallback when ISBNdb art is missing.

---

## 2. Monorepo layout

```
Bookmarked/
├── apps/
│   ├── web/                    # Primary product — Next.js 16, Tailwind 4
│   │   └── src/
│   │       ├── app/            # App Router pages (static export)
│   │       ├── components/     # UI by domain (books, library, social, …)
│   │       └── lib/            # services, hooks, auth, routes, utils
│   └── mobile/                 # Expo 54 — expo-router, NativeWind 4
│       ├── app/                # File-based routes
│       └── src/                # components, services, hooks, store
├── packages/
│   ├── types/                  # Shared TypeScript domain types
│   └── utils/                  # subscription, readingCompletion, profanity, …
├── supabase/
│   ├── migrations/             # 55 SQL migrations (forward-only)
│   └── functions/              # Edge Functions (Deno)
├── docs/                       # Extended audits, design system, progress
├── scripts/                    # Build / repair utilities
├── design-assets/              # Brand source assets
└── .github/workflows/          # GitHub Pages deploy
```

**No root workspace manager** — `apps/web` and `apps/mobile` each have their own `package.json` and `node_modules`. Shared code lives in `packages/` via relative imports.

| Package / app | Stack highlights |
|---------------|------------------|
| `apps/web` | Next.js 16.2, React 19, Tailwind 4, Vitest |
| `apps/mobile` | Expo 54, React Native 0.81, TanStack Query 5, Zustand 5, NativeWind 4 |
| `packages/types` | Shelf, Profile, Review, Post, Message, Subscription types |
| `packages/utils` | `canAccessFeature`, `readingCompletion` helpers, profanity filter |

---

## 3. Web application

### 3.1 Routing (`apps/web/src/app/`)

Static export on GitHub Pages — entity pages use **query parameters** where dynamic segments would break.

| Group | Routes | Auth |
|-------|--------|------|
| **Public** | `/`, `/login/`, `/signup/`, `/forgot-password/`, `/reset-password/`, `/privacy/`, `/terms/` | None |
| **App `(app)`** | See table below | `ClientAuthGuard` in `(app)/layout.tsx` |

| Route | Purpose |
|-------|---------|
| `/reading-room/` | Home — Reading Room tabs (Overview, Progress, Trail, Notes, Reviews, History) |
| `/dashboard/` | Legacy redirect → `/reading-room/` |
| `/library/`, `/library/[shelf]/`, `/library/custom/` | Personal library (built-in + custom shelves) |
| `/search/` | ISBNdb book search |
| `/book/?id=` | Book detail hub |
| `/feed/` | Social feed (activity + posts) |
| `/messages/`, `/messages/thread/?id=` | Inbox + thread |
| `/clubs/`, `/clubs/club/?id=` | Book clubs |
| `/profile/`, `/profile/setup/`, `/profile/settings/` | Own profile + setup |
| `/reader/?username=` | Public reader profile |
| `/reader-library/?username=` | Public reader library |
| `/notes/` | User-wide reading notes search |
| `/notifications/` | Notification inbox |
| `/upgrade/` | Premium upgrade (informational) |
| `/author/?name=`, `/series/?name=` | Author / series discovery |
| `/journal/` | Redirect to Trail tab |

**Route helpers:** `apps/web/src/lib/routes/` — `book.ts`, `reader.ts`, `messages.ts`, `clubs.ts`, etc.

**Pre-rendered shelves:** `generateStaticParams()` for `want-to-read`, `reading`, `read`.

### 3.2 Navigation

| Viewport | Pattern | File |
|----------|---------|------|
| Desktop | Top nav — Home, Feed, Library, Search, Clubs, Messages, Profile + notification bell | `Navbar.tsx` |
| Mobile | Fixed bottom nav — Home (Reading Room), Feed, Search, Messages, Profile | `MobileBottomNav.tsx` |

Library is on desktop nav; on mobile it is reached from Reading Room quick actions.

### 3.3 Auth flow

```
Sign up / Login (Supabase Auth)
    → Session persisted (localStorage + remember-me toggle)
    → ClientAuthGuard waits for INITIAL_SESSION event
    → Profile lookup (profiles.username)
    → Missing username → /profile/setup/
    → App shell renders
```

| Piece | Location |
|-------|----------|
| Browser client | `lib/supabase/client.ts` — singleton, **implicit flow** (not PKCE) |
| Auth actions | `lib/auth/actions.ts` |
| Route guard | `components/auth/ClientAuthGuard.tsx` |
| Session hook | `lib/hooks/useAuthUser.ts` |
| Remember me | `lib/auth/rememberMe.ts` |

**Why implicit flow:** Password-reset and email-confirmation links must work when opened on a different device than the one that requested them. PKCE breaks that on static hosting.

**Redirects:** Signup `emailRedirectTo` → `/profile/setup/` · Reset → `/reset-password/`. Must be allow-listed in Supabase Auth URL config.

### 3.4 Data access & state

All runtime data flows through **Supabase JS in the browser**. No Next.js server runtime in production.

| Layer | Pattern | Example |
|-------|---------|---------|
| Services | `lib/services/*.ts` — query encapsulation | `library.ts`, `socialFeed.ts` |
| Actions | `lib/actions/*.ts` — form mutations (client-side) | `book.ts`, `profile.ts` |
| Realtime hooks | `lib/hooks/use*Realtime.ts` | `useUserBooksRealtime`, `usePostsRealtime` |
| Routes | URL params for tabs/entities | `?tab=trail`, `?id=` |

**State management (web):** No global store. Page-level `useState`/`useEffect`, `ToastProvider` context, Realtime subscription hooks, `localStorage` for sort prefs. **No TanStack Query on web.**

### 3.5 Deployment

| Item | Value |
|------|-------|
| CI | `.github/workflows/deploy.yml` on `main` |
| Build | `npm run build` → `out/` (static export) |
| Host | GitHub Pages + CNAME `bookmarked.online` |
| Required secrets | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| ISBNdb key | Supabase secret → Edge Function only |

---

## 4. Mobile application

### 4.1 Routing (`apps/mobile/app/`)

Expo Router file-based routes with dynamic segments (no static-export constraint).

| Group | Routes |
|-------|--------|
| **Auth `(auth)`** | `login`, `signup`, `forgot-password`, `profile-setup` |
| **Tabs `(app)`** | `index` (Home/Reading Room), `feed`, `search`, `messages`, `profile` |
| **Hidden tabs** | `library`, `reading-room`, `book`, `clubs`, `notes`, `notifications`, `reader`, `upgrade`, `settings`, … |

| Route | Purpose |
|-------|---------|
| `/(app)/index` | Reading Room — Overview, Progress, Trail tabs |
| `/(app)/library/`, `[shelf]`, `custom`, `my-books` | Library views |
| `/(app)/book/[id]` | Book detail — shelves, progress, reviews, notes |
| `/(app)/feed` | Social feed |
| `/(app)/messages/`, `[id]` | Messaging |
| `/(app)/clubs/`, `[id]`, `new` | Book clubs |
| `/(app)/reader/[username]/` | Public profile + library sub-routes |
| `/(app)/notes` | Reading notes search |
| `/(app)/upgrade` | Premium upgrade screen |

### 4.2 Auth flow

```
App launch → authStore bootstrap (Zustand)
    → No session → /(auth)/login
    → Session + no username → /(auth)/profile-setup
    → Tabs layout renders
```

| Piece | Location |
|-------|----------|
| Supabase client | `src/services/supabase.ts` — AsyncStorage persistence |
| Auth store | `src/store/authStore.ts` (Zustand) |
| Theme store | `src/store/themeStore.ts` (Zustand) |
| Profile hook | `src/hooks/useProfile.ts` (TanStack Query) |
| Password reset | Opens web `/reset-password/` via `EXPO_PUBLIC_SITE_URL` |

### 4.3 Data access & state

| Layer | Pattern |
|-------|---------|
| Services | `src/services/*.ts` — mirrors web service names (33 modules) |
| Hooks | `src/hooks/*.ts` — TanStack Query wrappers |
| Types | Re-export from `packages/types` via `src/types/index.ts` |

**State management (mobile):** Zustand for auth + theme; TanStack Query for server state caching; no shared pattern with web.

### 4.4 Navigation

Primary tabs match web mobile bottom nav: **Home, Feed, Search, Messages, Profile**. Secondary screens (library, clubs, book detail) use `href: null` hidden tab screens + stack navigation.

`FloatingTabBar.tsx` — custom tab bar with scroll-hide behavior via `TabBarScrollProvider`.

---

## 5. Supabase integration

### 5.1 Client setup

| Platform | Client | Storage |
|----------|--------|---------|
| Web | `createClient()` singleton | `localStorage` / sessionStorage (remember-me) |
| Mobile | `supabase` export | `@react-native-async-storage/async-storage` |

Both use the same project URL and anon key. All data access is subject to **Row Level Security**.

### 5.2 Edge Functions (`supabase/functions/`)

| Function | Purpose |
|----------|---------|
| `isbndb` | ISBNdb API proxy — keeps API key server-side |
| `subscription-webhook` | Premium subscription upsert stub (service role) |
| `delete-account` | Account deletion |
| `og-card` | Open Graph card generation |
| `share-preview` | Share link previews |
| `rate-limit-stub` | Rate limiting placeholder |

### 5.3 Realtime

Subscriptions used for: `user_books`, `reading_sessions`, `reading_notes`, `posts`, `notifications`, `book_club_posts`. Replica identity FULL on realtime tables (WAL overhead tradeoff).

### 5.4 Storage buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `avatars` | Public read | Profile images |
| `post-images` | Public read | Feed/post attachments |
| `message-attachments` | Private (signed URLs) | DM images |

---

## 6. Database schema overview

**55 migrations** in `supabase/migrations/`. All `public` tables have RLS enabled.

### Core domains

| Domain | Tables |
|--------|--------|
| Users | `profiles`, `follows`, `user_subscriptions` |
| Catalog | `books` (`external_source`: `isbndb` or legacy `open_library`) |
| Library | `user_books`, `user_shelves`, `user_shelf_books` |
| Reading | `reading_sessions`, `reading_notes`, `user_reading_note_categories` |
| Reviews | `reviews`, `review_reactions`, `review_replies` |
| Social | `activity_events`, `posts`, `post_likes`, `post_comments`, `post_drafts`, … |
| Clubs | `book_clubs`, `book_club_members`, `book_club_posts` |
| Messaging | `conversations`, `conversation_participants`, `messages` |
| Notifications | `notifications` |

### Key columns (Phase 2 reading)

| Table | Notable columns |
|-------|-----------------|
| `user_books` | `read_count`, `completion_tags`, `dnf`, `expected_read_date` |
| `reviews` | `read_number`, `edition`, `feelings`, `rating_emoji`, `plot`/`characters`/…, `rating_mode` |
| `reading_sessions` | `read_number`, `mood`, `pages_read`, `page_count_status` |

### RLS patterns

| Pattern | Examples |
|---------|----------|
| Own-row CRUD | `user_books`, `reading_sessions`, `reading_notes` |
| Public read, own write | `profiles` |
| Visibility helpers (`SECURITY DEFINER`) | `shelf_visible_to_viewer()`, `post_visible_to_viewer()`, `activity_visible_to_viewer()` |
| Participant-scoped | `messages`, `conversations` |
| Owner-only | `notifications`, `user_subscriptions` |

Full reference: `docs/DATABASE_SCHEMA.md`, `docs/SECURITY_AUDIT.md`.

---

## 7. Component architecture

### 7.1 Web (`apps/web/src/components/`)

| Directory | Responsibility |
|-----------|----------------|
| `layout/` | `Navbar`, `MobileBottomNav`, `AppNavLink`, `BookmarkedLogo` |
| `ui/` | Primitives — `Button`, `Input`, `Modal`, `Toast`, `LoadingState` |
| `auth/` | `LoginForm`, `ClientAuthGuard`, `ProfileSetupForm` |
| `books/` | `BookDetailsPage`, `BookCover`, `ReadingProgressPanel`, `BookReviewSection` |
| `library/` | `LibraryViewShell`, `BookshelfView`, `LibraryGridView`, `CustomShelfCollectionsPanel` |
| `reading-room/` | `ReadingRoomTabs`, `TrailPanel`, `CurrentlyReadingRow` |
| `social/` | `FeedPostsPanel`, `PostCard`, `PostComposer`, `FollowButton` |
| `messages/` | `ConversationList`, thread UI, reactions |
| `clubs/` | `ClubsPage`, `ClubDetailPage` |
| `profile/` | Avatar, streak, import, privacy, notification prefs |
| `premium/` | `PremiumFeatureLock`, `AiInsightsPanel`, `PremiumBadge` |
| `reviews/` | `ReviewForm`, `StarDisplay` |

~188 component files total.

### 7.2 Mobile (`apps/mobile/src/components/`)

Parallel component set in React Native: `BookCover`, `FeedCard`, `MarkFinishedSheet`, `TrailPanel`, `PremiumFeatureLock`, messaging components, library views, etc. Styling via NativeWind + brand tokens in `constants/theme.ts`.

### 7.3 Shared packages

| Package | Contents |
|---------|----------|
| `packages/types` | `Profile`, `Review`, `Post`, `ShelfStatus`, `PremiumFeature`, … |
| `packages/utils` | `canAccessFeature`, `readingCompletion` math, `profanity`, `profileValidation`, `messageAttachments` |

**Not shared:** UI components, most service query logic (28 service files duplicated by name across web/mobile).

---

## 8. Services layer

### 8.1 Web-only services (`apps/web/src/lib/services/`)

`analytics`, `avatar`, `bookBadges`, `bookMetadata`, `communityRatings`, `covers`, `entityAvatar`, `feedSearch`, `goodreadsImport`, `openLibrary` (alias), `productAnalytics`, `publicLibrary`, `readingActivity`, `readingRoom`, `readingSessionBackfill`, `recommendations`, `shelfVisibility`, `staleCatalogRefresh`, `suggestedShelves`, `transferUserBook`

### 8.2 Mobile-only services

`feed`, `libraryView`, `reviews`, `storage`, `supabase`

### 8.3 Shared service names (duplicated implementations)

`activity`, `authorBooks`, `bookClubs`, `bookDetails`, `books`, `completeReadingSession`, `customShelves`, `follows`, `giphy`, `isbndb`, `library`, `messages`, `moderation`, `noteCategories`, `notifications`, `postCommentEngagement`, `postDrafts`, `posts`, `profile`, `readingGoal`, `readingInsights`, `readingNotes`, `readingSessions`, `reviewEngagement`, `series`, `socialFeed`, `subscription`, `trending`

Business logic for reading completion is partially shared via `packages/utils/readingCompletion.ts`; orchestration (`completeReadingSession`) is duplicated per platform.

---

## 9. Feature workflows

### 9.1 Reading loop

```
Search (ISBNdb) → Add to shelf → Book detail
    → Update progress (user_books + reading_sessions)
    → Mark finished → completeReadingSession()
    → shelf_status = read, session row, activity event, completion_tags (web)
    → Rate / review (optional, per read_number)
```

**Files:** `ReadingProgressPanel`, `completeReadingSession.ts`, `ReviewForm`, `MarkFinishedDialog` / `MarkFinishedSheet`

### 9.2 Library workflow

```
Built-in shelves (want_to_read / currently_reading / read)
    + Custom shelves (user_shelves + user_shelf_books)
    + Sort/filter (profiles.preferred_library_view + localStorage)
    + Shelf privacy (profiles.shelf_visibility_*)
```

**Files:** `library.ts`, `LibraryViewShell`, `CustomShelfCollectionsPanel`, `ShelfPrivacyPanel`

### 9.3 Review workflow

```
Finish read (read_number) → ReviewForm
    → rating (half-stars), body, spoilers, feelings, edition
    → optional advanced ratings (plot, characters, …)
    → reviews (user_id, book_id, read_number) unique
    → activity event + feed visibility per RLS
```

**Files:** `ReviewForm.tsx`, `BookReviewSection.tsx`, `reviews.ts` (mobile)

### 9.4 Feed workflow

```
Following / For You tabs
    → activity_events (shelf changes, finishes, reviews)
    → posts (text, images, GIFs, book attachments)
    → likes, comments, reactions
    → trending sidebar (most shelved, reviewed)
```

**Files:** `socialFeed.ts`, `FeedPostsPanel`, `PostComposer`, `trending.ts`

### 9.5 Profile workflow

```
Own profile (/profile/) — settings, streak, import, privacy, upgrade
Public reader (/reader/?username=) — identity, shelf preview, posts, follow
```

**Files:** `profile.ts`, `follows.ts`, `ProfileFeedSection`, mobile `reader/[username]/`

---

## 10. Web / mobile parity notes

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| Auth + profile setup | ✅ | ✅ | Reset password via web |
| ISBNdb search | ✅ | ✅ | Shared Edge Function |
| Library + custom shelves | ✅ | ✅ | |
| Book detail + shelf actions | ✅ | ✅ | |
| Reading progress + finish | ✅ | ✅ | |
| Completion auto-tags | ✅ | ⬜ | Web only in `completeReadingSession` |
| Reading Room tabs | 6 | 3 | Mobile missing Notes, Reviews, History |
| Reviews (full UI) | ✅ | 🔄 | Mobile: book page + sheets |
| Messaging | ✅ | ✅ | |
| Book clubs | ✅ | ✅ | |
| Feed + trending | ✅ | ✅ | |
| Feed search | ✅ | ⬜ | |
| Goodreads import | ✅ | ⬜ | |
| Premium gates | ✅ | ✅ | No live billing |
| Notifications | ✅ | ✅ | |
| Public profiles | ✅ | ✅ | |

---

## 11. Design system

Tokens in `apps/web/src/app/globals.css`:

- **Primary:** Pastel Purple `#B89DBB`
- **Supporting:** Puce Red, Rust, Royal Orange, Orange Yellow

Utility classes: `.surface-card`, `.feed-header-gradient`, `.reading-room-bg`, `.app-shell-gradient`, `.pill-tabs`, `.search-input`

Mobile mirrors tokens in `tailwind.config.js` + `ScreenGradientWash` / `BrandTopHeader`.

Full reference: `docs/ui/DESIGN_SYSTEM.md`, `docs/MOBILE_UI_GUIDE.md`.

---

## 12. TypeScript conventions

- Strict TypeScript in both apps
- Domain types centralized in `packages/types/index.ts`
- Web types may extend via `apps/web/src/types/index.ts`
- Mobile re-exports shared types from `apps/mobile/src/types/index.ts`
- Route helpers return static-safe paths (trailing slashes for GitHub Pages)
- Services return `{ data, error }` or throw; UI handles loading/empty/error states

---

## Related documentation

| Doc | Path |
|-----|------|
| Progress tracker | `PROJECT_PROGRESS.md` |
| Technical debt | `TECHNICAL_DEBT.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| Security audit | `docs/SECURITY_AUDIT.md` |
| Performance audit | `docs/PERFORMANCE_AUDIT.md` |
| Prior architecture snapshot | `docs/BOOKMARKED_CURRENT_ARCHITECTURE.md` |

**Last updated:** July 23, 2026 (Phase 0 audit)
