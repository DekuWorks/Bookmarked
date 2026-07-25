# Bookmarked Mobile

React Native (Expo, SDK 54) app for Bookmarked. It shares the same Supabase
backend and the `packages/types` type definitions with the web app
(`apps/web`), and provides the shipped native mobile experience for Reading
Room, library, search, feed, messaging, clubs/events, profiles, and Premium.

Mobile parity is tracked in the root `PROJECT_PROGRESS.md` file.

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
      _layout.tsx            # Tabs: Home / Feed / Search / Messages / Profile
      index.tsx              # Reading Room home
      library/               # Library shelves + import
      search.tsx             # Search (ISBNdb)
      feed.tsx               # Social feed + search
      messages/              # Direct + group messages
      book/[id].tsx          # Book detail, progress, notes, reviews
      clubs/                 # Book Clubs (nested stack)
        _layout.tsx          # Stack: list + detail
        index.tsx            # Discover / Your clubs
        [id].tsx             # Club detail (book, members, discussions)
      events.tsx             # Club/community event calendar
      notes.tsx              # Reading notes
      notifications.tsx      # Notification center
      reader/[username]/     # Public reader profile/library
      upgrade.tsx            # Premium upgrade / App Store IAP
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

## Status: shipped surfaces

**Working**

- Email/password auth (sign up, log in, forgot password), session persistence
  and auto-refresh, auth guard + profile-setup redirect.
- Password reset emails open the **web** `/reset-password/` page
  (`EXPO_PUBLIC_SITE_URL`, default `https://bookmarked.online`). After resetting
  on the web, return to the app and log in with the new password.
- Bottom-tab navigation shell with Reading Room as Home.
- Reading Room: Overview, Progress, Trail, Notes, Reviews, and History tabs.
- Feed: posts/activity, reader/book/post search, reactions, comments, and composer.
- Library: shelves, shelf writes, Goodreads import, DNF / expected read date.
- Search: live ISBNdb book search via the shared Edge Function.
- Book detail: progress, mark finished, notes, ratings/reviews, community rating, shelf actions.
- Messaging: direct and group conversations, replies, reactions, attachments, pins.
- Book Clubs: discover public clubs, view your clubs, and open a club detail
  (current book, members, discussion feed). Join / leave and post discussions.
- Events: club/community event calendar.
- Notifications: in-app notification center.
- Public reader profiles and reader library browsing.
- Profile: identity, favorite genres, avatar, settings, Goodreads import, account deletion, logout.
- Premium: App Store IAP on iOS store builds, restore purchases, and web Stripe fallback.

## Recommended next steps

1. Submit/verify the latest production EAS build in TestFlight and App Review.
2. Run the Premium sandbox checklist in `docs/APP_STORE_IAP.md`, including restore purchases.
3. Continue extracting duplicated web/mobile services into `packages/`.
4. Add automated E2E smoke coverage for auth, the reading loop, messaging, and Premium gates.
