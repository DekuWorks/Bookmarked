# Bookmarked

Bookmarked is a **web-first** reading platform where users can create accounts, search books, manage shelves, track progress, write reviews, follow readers, send **direct messages and group chats**, and explore their collection through interactive bookshelves and **My Reading Room**.

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

### Deployment

- **Hosted on:** [GitHub Pages](https://pages.github.com/) via GitHub Actions (`.github/workflows/deploy.yml`)
- **Domain:** [bookmarked.online](https://bookmarked.online)
- **Build:** Next.js static export (`output: "export"`) → `apps/web/out/`
- **DNS:** GoDaddy (four GitHub Pages A records + `www` CNAME → `DekuWorks.github.io`)

**GitHub repo secrets** (required — values are baked into the static build at compile time):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Book catalog (ISBNdb)** — the REST key stays server-side:

- Local: `ISBNDB_API_KEY` in `apps/web/.env.local` (not `NEXT_PUBLIC_`)
- Supabase: `supabase secrets set ISBNDB_API_KEY=...` (used by Edge Function `/functions/v1/isbndb`)
- GitHub: `gh secret set ISBNDB_API_KEY` (reference; not injected into the static build)

Set via GitHub → Settings → Secrets and variables → Actions, or:

```bash
cd apps/web
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2-)"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2-)"
gh secret set ISBNDB_API_KEY --body "$(grep '^ISBNDB_API_KEY=' .env.local | cut -d= -f2-)"
```

The deploy workflow fails fast with a clear error if either Supabase public secret is missing.

**Manual setup (one-time):**

1. GitHub → Settings → Pages → Source: **GitHub Actions**; Custom domain: `bookmarked.online`; enforce HTTPS after DNS propagates
2. GoDaddy DNS: A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; CNAME `www` → `DekuWorks.github.io`

**Static hosting notes:** Book details use `/book?id={uuid}` (static-safe query route). Auth and data run client-side via Supabase.

**Supabase Auth URL configuration** (Dashboard → Authentication → URL Configuration) — required for signup confirmation and password reset emails:

| Setting | Value |
|---------|--------|
| **Site URL** | `https://bookmarked.online` |
| **Redirect URLs** | `https://bookmarked.online/**` |
| | `https://www.bookmarked.online/**` |
| | `http://localhost:3000/**` |
| | `http://127.0.0.1:3000/**` |

Code sends `emailRedirectTo` → `/profile/setup/` and password-reset `redirectTo` → `/reset-password/`. Without these allow-list entries, Supabase rejects the redirect and the email link fails.

### Key routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Request password reset email |
| `/reset-password` | Set a new password from the email link |
| `/search` | ISBNdb book search |
| `/book?id={id}` | Book details, progress, reviews |
| `/library` | Full library (bookshelf / grid) |
| `/library/want-to-read` | Want to read shelf |
| `/library/reading` | Currently reading shelf |
| `/library/read` | Read shelf |
| `/dashboard` | Home + analytics + activity feed |
| `/reading-room` | Personalized reading space (signature feature) |
| `/messages` | Inbox — direct and group conversations |
| `/messages/thread?id=` | Conversation thread (static-safe query route) |
| `/feed` | Social feed + reader discovery |
| `/reader/?username=` | Public reader profile + Message button |

## Database

Apply migrations in order via Supabase SQL Editor or `supabase db push`:

CLI auth on macOS / Cursor agents: see [docs/SUPABASE_CLI.md](docs/SUPABASE_CLI.md).

| Migration | Purpose |
|-----------|---------|
| `001_phase0_schema.sql` | Core tables, RLS, profiles, books, user_books, reviews, activity |
| `002_preferred_library_view.sql` | `profiles.preferred_library_view` (bookshelf / grid) |
| `003_book_metadata_and_reviews_unique.sql` | Book publisher/subjects; one review per user per book |
| `004_yearly_reading_goal.sql` | `profiles.yearly_reading_goal` for yearly book targets |
| `005_social_follows_and_feed.sql` | Follow graph and activity visibility |
| `006_profiles_fk_for_embeds.sql` | Profile FKs for PostgREST embeds |
| `007_shelf_visibility.sql` | Per-shelf visibility + RLS |
| `008_books_catalog_update.sql` | Books catalog update policy |
| `009_messaging.sql` | Direct + group messaging tables and RLS |

## Phase 2 smoke test

Public pages (no account required):

1. Open `/` → About, Features, and Contact sections
2. Contact section links to email and signup / login
3. Open `/privacy` and `/terms` from footer links

## Phase 1 smoke test

Manual checklist (requires Supabase env configured):

1. Open site → sign up → log in → complete profile
2. Search a book → open `/book?id=…`
3. Add to Want to Read → move to Currently Reading
4. Update progress → mark as finished
5. Write a review with spoiler toggle
6. Confirm activity feed and library update
7. Log out → log back in → confirm data persists

## Documentation

- [Project overview](docs/project/PROJECT_OVERVIEW.md)
- [Master task list](docs/project/MASTER_TASK_LIST.md)
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
