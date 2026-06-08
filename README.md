# Bookmarked

Bookmarked is a **web-first** reading platform where users can create accounts, search books, manage shelves, track progress, write reviews, and explore their collection through interactive bookshelves and **My Reading Room**.

## Structure

| Path | Description |
|------|-------------|
| `apps/web` | Next.js + TypeScript + Tailwind (primary product) |
| `apps/mobile` | React Native + Expo (Phase 3) |
| `packages/types` | Shared TypeScript types |
| `docs/` | Project, architecture, UI, and AI workflow docs |
| `supabase/migrations/` | PostgreSQL schema and RLS |

## Build order

1. **Web app** — landing, auth, dashboard, library, search  
2. **Backend** — Supabase tables and policies (shared)  
3. **Mobile app** — same backend and types later  

## Web app

```bash
cd apps/web
cp .env.local.example .env.local
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Key routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/search` | Open Library search |
| `/book/[id]` | Book details, progress, reviews |
| `/library` | Full library (bookshelf / grid) |
| `/library/want-to-read` | Want to read shelf |
| `/library/reading` | Currently reading shelf |
| `/library/read` | Read shelf |
| `/dashboard` | Home + analytics + activity feed |
| `/reading-room` | Personalized reading space (signature feature) |

## Database

Apply migrations in order via Supabase SQL Editor or `supabase db push`:

| Migration | Purpose |
|-----------|---------|
| `001_phase0_schema.sql` | Core tables, RLS, profiles, books, user_books, reviews, activity |
| `002_preferred_library_view.sql` | `profiles.preferred_library_view` (bookshelf / grid) |
| `003_book_metadata_and_reviews_unique.sql` | Book publisher/subjects; one review per user per book |
| `004_yearly_reading_goal.sql` | `profiles.yearly_reading_goal` for yearly book targets |

## Phase 1 smoke test

Manual checklist (requires Supabase env configured):

1. Open site → sign up → log in → complete profile
2. Search a book → open `/book/[id]`
3. Add to Want to Read → move to Currently Reading
4. Update progress → mark as finished
5. Write a review with spoiler toggle
6. Confirm activity feed and library update
7. Log out → log back in → confirm data persists

## Documentation

- [Project overview](docs/project/PROJECT_OVERVIEW.md)
- [Architecture](docs/architecture/ARCHITECTURE_CONTEXT.md)
- [Design system](docs/ui/DESIGN_SYSTEM.md)
- [Progress tracker](docs/progress/PROGRESS_TRACKER.md)

## Mobile (later)

```bash
cd apps/mobile
cp .env.example .env
npm install
npm start
```
