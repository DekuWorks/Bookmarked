# Bookmarked Mobile

React Native (Expo, SDK 54) app for Bookmarked. It shares the same Supabase
backend and the `packages/types` type definitions with the web app
(`apps/web`), and provides the core navigation shell, authentication, and
foundation screens (Feed, Library, Search, Profile).

This is the **foundation**, not full feature parity with the web app.

## Stack

- **Expo** SDK 54 + **expo-router** (file-based routing)
- **React Native** 0.81 / **React** 19
- **NativeWind** 4 (Tailwind for RN) for styling + brand tokens
- **Supabase JS** with `AsyncStorage` session persistence
- **TanStack Query** for data fetching/caching
- **Zustand** for auth session state

## Prerequisites

- Node 18+ and npm
- The [Expo Go](https://expo.dev/go) app (iOS/Android) or a simulator/emulator
- Access to the Bookmarked Supabase project (same project the web app uses)

## Environment

Secrets are **not** committed. Copy the example file and fill in the same
Supabase URL / anon key the web app uses (`apps/web/.env.local` →
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`):

```bash
cp .env.example .env
```

`.env` (git-ignored):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Only `EXPO_PUBLIC_*` values are read at build time (`src/constants/env.ts`).

## Install & Run

From `apps/mobile`:

```bash
npm install            # installs deps (legacy-peer-deps is set via .npmrc)
npm run start          # start the Metro dev server (press i / a / w)
npm run ios            # build + install + open iOS simulator (starts Metro)
npm run android        # open in Android emulator
npm run web            # run in the browser
```

> **Simulator red screen ("No script URL provided")?** A debug build needs Metro.
> Run `npm run start` and keep it open, or use `npm run ios` which starts Metro for you.
> For App Review demos, use the **TestFlight build on a physical iPhone** instead
> (`store/ios/REVIEW_DEMO_SCRIPT.md`).

> This app is a standalone Expo project (its own `package.json` /
> `node_modules`), sibling to `apps/web`. There is no root workspace install;
> run npm commands from within `apps/mobile`.

## Quality checks

```bash
npx tsc --noEmit                 # type-check
npx expo-doctor                  # environment / dependency checks
npx expo export --platform ios   # Metro bundle sanity check
```

## Project structure

```
apps/mobile/
  app/                       # expo-router routes
    _layout.tsx              # root providers (Query, SafeArea, auth bootstrap)
    index.tsx                # entry redirect (auth/profile-setup/tabs)
    (auth)/                  # login, signup, forgot-password, profile-setup
    (app)/                   # authenticated bottom tabs
      _layout.tsx            # Tabs: Home / Library / Search / Clubs / Profile
      index.tsx              # Home → Feed
      library.tsx            # Library (shelves)
      search.tsx             # Search (ISBNdb)
      clubs/                 # Book Clubs (nested stack)
        _layout.tsx          # Stack: list + detail
        index.tsx            # Discover / Your clubs
        [id].tsx             # Club detail (book, members, discussions)
      profile.tsx            # Profile + logout
  src/
    components/              # Button, Input, BookCover, Avatar, FeedCard, ...
    constants/               # env, shelves
    hooks/                   # useAuth, useProfile, useFeed, useLibrary, useBookSearch
    lib/                     # react-query client
    screens/                 # auth + Home screen implementations
    services/                # supabase client, feed, library, isbndb
    store/                   # zustand auth store
    types/                   # re-exports packages/types + local nav types
```

## Shared code with the web app

- **Types**: `src/types/index.ts` re-exports from `../../../../packages/types`
  (the same shared package the web app consumes), so data shapes stay in sync.
- **Supabase**: same project/URL/anon key as web. The RN client
  (`src/services/supabase.ts`) uses `AsyncStorage` for session persistence.
- **ISBNdb search**: `src/services/isbndb.ts` calls the shared
  `supabase/functions/isbndb` Edge Function (same proxy the web app uses), so
  the ISBNdb API key stays server-side.
- **Feed / Library**: `src/services/feed.ts` and `src/services/library.ts`
  are RN-appropriate wrappers that query the same Supabase tables
  (`activity_events`, `profiles`, `books`, `user_books`) as the web services.
- **Book Clubs**: `src/services/bookClubs.ts` mirrors the web
  `bookClubs` service against the same `book_clubs`, `book_club_members`, and
  `book_club_posts` tables + RLS (discover, my clubs, detail, members,
  discussions, join, leave, post discussion).
- **Rating emoji**: review activity in the feed surfaces a reader's signature
  `reviews.rating_emoji` (Fable-style, e.g. ⚡) next to the star rating. It is
  read from the activity `metadata_json` and exposed as `FeedItem.ratingEmoji`.

## Brand

Brand tokens mirror the web design system (`apps/web/src/app/globals.css`) and
are defined in `tailwind.config.js`:

| Token           | Hex       | Usage                          |
| --------------- | --------- | ------------------------------ |
| `primary`       | `#B89DBB` | lavender — accents, avatars    |
| `puce-red`      | `#642F37` | primary buttons, headings      |
| `rust`          | `#C0350F` | errors                         |
| `royal-orange`  | `#F3904B` | accent                         |
| `orange-yellow` | `#F7C767` | accent                         |
| `background`    | `#FAF8FC` | app background                 |
| `surface`       | `#FCFAFE` | cards                          |

The Feed header uses an `expo-linear-gradient` lavender→background wash to
match the web `feed-header-gradient`.

## Status: what works vs. stubbed

**Working**

- Email/password auth (sign up, log in, forgot password), session persistence
  and auto-refresh, auth guard + profile-setup redirect.
- Password reset emails open the **web** `/reset-password/` page
  (`EXPO_PUBLIC_SITE_URL`, default `https://bookmarked.online`). After resetting
  on the web, return to the app and log in with the new password.
- Bottom-tab navigation shell with brand styling.
- Feed: read-only list of recent public reading activity.
- Library: user's books grouped by shelf (Want to Read / Reading / Read).
- Search: live ISBNdb book search via the shared Edge Function.
- Book Clubs: discover public clubs, view your clubs, and open a club detail
  (current book, members, discussion feed). Join / leave and post discussions.
- Profile: identity, favorite genres, avatar, logout.

**Stubbed / not yet implemented**

- Writing actions (adding books to shelves, posting, following) — read-only for now.
- Push notifications, messaging, reading sessions/notes.
- Book club owner management (create/edit club, set current book, remove
  members, delete) — stays on the web app for now.
- A dedicated reviews UI. Ratings/emojis currently surface via the feed only.
- Book detail screens and deep links from feed/search results.
- Following-aware feed ranking (currently a simple public activity feed).

## Recommended next steps

1. Add book-detail + "add to shelf" flows (write path against `user_books`).
2. Port the following-aware/for-you feed ranking from
   `apps/web/src/lib/services/socialFeed.ts`.
3. Extract the shared Supabase query logic into `packages/` so web + mobile
   share services, not just types.
4. Bump `expo`/`expo-router` to the latest SDK 54 patch (`npx expo install --check`).
5. Replace placeholder icon/splash assets with final brand artwork.
