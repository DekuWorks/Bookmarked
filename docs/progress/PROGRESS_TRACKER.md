# Bookmarked — Progress Tracker

Technical progress detail: routes, migrations, and smoke tests.

**Canonical status summary:** [Master Task List](../project/MASTER_TASK_LIST.md)

Aligned with **Bookmarked_BuildPlan.pdf** (web-first build plan).

**Live:** https://bookmarked.online  
**Current focus:** Phase 3 — Mobile app foundation

---

## PHASE 0 — PLANNING & ARCHITECTURE

- [x] Features and user flows defined
- [x] Database schema + RLS (Supabase migrations `001`–`007`)
- [x] GitHub repo + docs structure
- [x] Supabase backend configured
- [x] Next.js app scaffold (`apps/web`)

**Outcome:** Technical foundation ready for development — **complete**

---

## PHASE 1 — WEB PLATFORM FIRST

**Goal:** Users can fully use Bookmarked in the browser (accounts, search, shelves, progress, reviews).

### Build order (PDF steps 1–8)

| Step | Item | Status |
|------|------|--------|
| 1 | Supabase backend | Done |
| 2 | Next.js web app | Done |
| 3 | Authentication + profiles | Done |
| 4 | Book search (Open Library) | Done |
| 5 | Shelves / library | Done |
| 6 | Reading progress | Done |
| 7 | Reviews + ratings | Done |
| 8 | Web dashboard | Done |

### Phase 1 completion sprint

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Book details routing | Done | Static route `/book/?id={uuid}` — GitHub Pages safe |
| 2 | Continue Reading routing | Done | Dashboard uses `bookDetailsPath()` |
| 3 | Reading progress tracking | Done | `ReadingProgressPanel` on book page |
| 4 | Reviews and ratings | Done | `BookReviewSection` — 1–5 stars, spoiler, edit/delete |
| 5 | Activity feed | Done | `ActivityFeed` on dashboard |
| 6 | Cover fallback system | Done | Open Library → ISBN → Google Books → placeholder |
| 7 | Final production QA | Done | Deploy, env vars, domain, client 404/cover fixes |
| 8 | Documentation updates | Done | README, architecture, project overview |

### Core routes

| Capability | Route / component |
|------------|-------------------|
| Auth | `/login`, `/signup`, `ClientAuthGuard` |
| Profile | `/profile`, `/profile/setup` |
| Search | `/search` + Open Library |
| Book details | `/book/?id={id}` |
| Shelves | `ShelfSelectMenu`, `BookShelfActions` |
| Library | `/library`, `/library/want-to-read`, `/library/reading`, `/library/read` |
| Views | Bookshelf + grid (`LibraryViewShell`) |
| Progress | `ReadingProgressPanel` |
| Reviews | `BookReviewSection` |
| Activity | `ActivityFeed` on `/dashboard` |
| Dashboard | `/dashboard` |

### Deployment (static export)

- GitHub Actions → GitHub Pages → `bookmarked.online`
- Client-side Supabase (no server actions at runtime)
- `NEXT_PUBLIC_SUPABASE_*` secrets required at build time

**Phase 1 outcome:** Users can fully use Bookmarked without the mobile app — **complete**

---

## PHASE 2 — WEBSITE POLISH & PUBLIC PAGES (Build Plan)

| Item | Status |
|------|--------|
| Landing page | Done |
| About (on landing `#about`) | Done |
| Features (on landing `#features`) | Done |
| Contact | Done | `#contact` — mailto + signup / login CTAs |
| Privacy policy `/privacy` | Done |
| Terms `/terms` | Done |
| Responsive layouts | Done |
| Public launch (domain + HTTPS) | Done |

**Build order step 9:** Public website pages — **complete**

### Phase 2 smoke test

1. Open `/` logged out → hero, About, Features, and Contact sections render
2. Public nav links scroll to `#about`, `#features`, `#contact`
3. Contact section shows mailto link and signup / login buttons
4. `/privacy` and `/terms` load from footer links
5. Resize to mobile width → landing and legal pages remain usable

---

## SOCIAL & DISCOVERY (beyond Build Plan PDF)

### Follow graph & feeds

| Feature | Status | Route / notes |
|---------|--------|----------------|
| Follow / unfollow | Done | `follows` table — migration `005` |
| Following feed | Done | `/feed` → Following tab |
| For You feed | Done | `/feed` → ranked by genres, recency, follows |
| Activity visibility | Done | `public` / `followers` / `private` on `activity_events` |
| Feed book covers | Done | Hydrated from metadata + `books` catalog; all shelf/review events |
| Feed search | Done | Readers, catalog books, posts — debounced on `/feed` |
| Feed search → profile | Done | `ReaderSearchCard` links to `/reader/?username=` |

### Public profiles & library

| Feature | Status | Route / notes |
|---------|--------|----------------|
| Public reader profile | Done | `/reader/?username=` (case-insensitive lookup) |
| Follower / following counts | Done | Clickable on `/profile` and `/reader` |
| Follower / following lists | Done | `FollowListModal` — mutuals + “you both follow” |
| Profile shelf preview | Done | First 3 shelves, 4 books each — `/profile` + `/reader` |
| Full public library | Done | `/reader-library/?username=` |
| See more → library | Done | Own profile → `/reading-room`; others → reader library |
| Shelf privacy controls | Done | Per-shelf: Public / Followers only / Private — migration `007` |
| Shelf privacy UI | Done | `ShelfPrivacyPanel` on `/profile` |

### Supabase migrations (social)

| Migration | Purpose |
|-----------|---------|
| `005_social_follows_and_feed.sql` | `follows` table; `activity_events.visibility` |
| `006_profiles_fk_for_embeds.sql` | Profile FKs for PostgREST embeds |
| `007_shelf_visibility.sql` | Per-shelf visibility columns + `user_books` RLS |

### Social routes summary

| Route | Purpose |
|-------|---------|
| `/feed` | For You + Following tabs + search |
| `/reader/?username=` | Public profile, shelves preview, activity, follow |
| `/reader-library/?username=` | Full public bookshelf for a reader |

### Deferred social

- [ ] Likes, comments, book clubs
- [ ] Badges & achievements

---

## DEFERRED (not in Build Plan PDF — built early, keep)

| Feature | Status |
|---------|--------|
| Reading Room (`/reading-room`) | Done |
| Shelf analytics + sort | Done |
| Reading goal (yearly) | Done |
| Favorite genre + reading streak | Done |
| Responsive & accessibility sprint | Done |
| Badges & achievements | Not started |

---

## PHASE 3 — MOBILE APP FOUNDATION (Build Plan)

- [ ] Expo app auth + navigation parity with web
- [ ] Same Supabase account across web and mobile

`apps/mobile/` scaffold exists (partial auth only).

**Phase 2 signed off — ready to start.**

---

## PHASE 4 — MOBILE APP CORE FEATURES (Build Plan)

- [ ] Mobile shelves, search, progress, reviews, dashboard

**Not started.**

---

## PHASE 5 — SYNC, TESTING & FINAL DELIVERY (Build Plan)

- [x] Web deployment + production fixes
- [ ] Cross-platform sync testing
- [ ] App store readiness

---

## Last updated

June 2026 — Master Task List added; Phases 0–2 complete. Social layer live on production. Live at https://bookmarked.online.
