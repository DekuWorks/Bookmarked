# Bookmarked

Bookmarked is a mobile-first reading tracker and social platform where users can organize books, track progress, write reviews, and connect with other readers.

## Structure

- `apps/mobile` — React Native app (Expo + TypeScript)
- `apps/web` — Next.js site (Phase 1+)
- `packages/types` — Shared TypeScript types

## Mobile app

```bash
cd apps/mobile
npm install
npm start
```

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and add your Supabase project URL and anon key.

## Database

Apply SQL in `supabase/migrations/` from the Supabase SQL Editor (or Supabase CLI).
