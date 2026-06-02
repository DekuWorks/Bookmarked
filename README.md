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

## Database

Run `supabase/migrations/001_phase0_schema.sql` in the Supabase SQL Editor for your **Bookmarked** project.

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
