# Bookmarked — Architecture Context

## Build Order

1. **Web app** — Next.js site and authenticated web experience
2. **Backend** — Supabase tables, RLS, auth policies (shared with web)
3. **Mobile app** — React Native + Expo (Phase 3)

---

## Frontend (Web)

| Technology | Role |
|------------|------|
| **Next.js** | App framework, routing, SSR/SSG where useful |
| **TypeScript** | Type safety across components and services |
| **Tailwind CSS** | Utility-first styling with design tokens |
| **App Router** | File-based routing under `src/app/` |

### Web App Location

```
apps/web/
  src/
    app/           # Routes (page.tsx, layout.tsx)
    components/    # UI, layout, feature components
    lib/           # Supabase client, utils, services
```

---

## Backend

| Technology | Role |
|------------|------|
| **Supabase** | BaaS: auth, database, future storage |
| **PostgreSQL** | Primary data store (via Supabase) |
| **Supabase Auth** | Email/password (and future OAuth) |
| **Supabase Storage** | Avatars and media (later) |

### Schema Location

```
supabase/migrations/
```

Tables: `profiles`, `books`, `user_books`, `reviews`, `activity_events`

Row Level Security (RLS) and policies are defined in migrations.

### Database audit (Phase 1)

| Table | Foreign keys | Unique / duplicate prevention | Indexes | RLS |
|-------|--------------|-------------------------------|---------|-----|
| `profiles` | `id` → `auth.users` | `username` unique | `profiles_username_lower` | Public read; owner insert/update |
| `books` | — | `(external_source, external_id)` | — | Authenticated read/insert |
| `user_books` | `user_id`, `book_id` | `(user_id, book_id)` | `user_id`, `book_id` | Owner CRUD only |
| `reviews` | `user_id`, `book_id` | `(user_id, book_id)` via migration 003 | `book_id`, `user_id` | Owner write; authenticated read |
| `activity_events` | `user_id` | — | `user_id`, `created_at desc` | Owner read/insert only |

**Auth:** Supabase email/password; `proxy.ts` protects app routes and redirects unauthenticated users to `/login`.

**Migrations:** `001` (schema + RLS), `002` (`preferred_library_view`), `003` (book metadata + review uniqueness).

### Key routes (web)

| Route | Handler |
|-------|---------|
| `/book/[id]` | Canonical book details (progress, shelf, reviews) |
| `/books/[id]` | Legacy redirect → `/book/[id]` |
| `/library`, `/library/[shelf]` | Library views and shelf detail |
| `/reading-room` | Personalized reading space (Phase 1.5) |
| `/dashboard` | Activity feed + analytics widgets |

### Server actions & services

| Module | Role |
|--------|------|
| `lib/actions/book.ts` | Shelf moves, progress updates, reviews, favorites |
| `lib/services/bookDetails.ts` | Book + user_book + reviews fetch; Open Library enrich |
| `lib/services/activity.ts` | Records `activity_events` on user actions |
| `lib/services/books.ts` | Open Library search → `books` cache + shelf add |
| `src/proxy.ts` | Auth session refresh + route protection (Next.js 16 proxy) |

---

## Mobile (Later)

| Technology | Role |
|------------|------|
| **React Native** | Cross-platform mobile UI |
| **Expo** | Tooling, build, OTA updates |
| **TypeScript** | Shared patterns with web |

### Mobile App Location

```
apps/mobile/
```

Uses the same Supabase project and `packages/types` as the web app.

---

## Shared Data Model

All clients read/write the same Supabase tables:

| Entity | Table | Notes |
|--------|-------|-------|
| **Users** | `auth.users` | Supabase Auth |
| **Profiles** | `profiles` | 1:1 with auth user |
| **Books** | `books` | Catalog; Open Library external IDs |
| **Shelves / progress** | `user_books` | Per-user book state |
| **Reviews** | `reviews` | User book reviews |
| **Activity** | `activity_events` | Feed events |

### Shared Types

```
packages/types/
```

Export TypeScript interfaces used by web and mobile.

---

## External APIs

| API | Use |
|-----|-----|
| **Open Library** | Book search and metadata (web MVP) |

Book records are cached in `books` when added to a user's library.

---

## Environment Variables

### Web (`apps/web/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Mobile (`apps/mobile/.env`)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Principles

- Keep Supabase access in `lib/supabase/` and service modules — not scattered in components
- Web ships before mobile; do not block web on mobile work
- Use shared types from `packages/types` where possible
- RLS enforces data access; clients use anon key + user session
