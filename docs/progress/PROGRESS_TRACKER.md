# Bookmarked — Progress Tracker

Aligned with **Bookmarked_BuildPlan.pdf** (web-first build plan).

**Live:** https://bookmarked.online  
**Current focus:** Phase 1 — Web Platform First (completion sprint)

---

## PHASE 0 — PLANNING & ARCHITECTURE

- [x] Features and user flows defined
- [x] Database schema + RLS (Supabase migrations `001`–`004`)
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

*Do not confuse with old internal “Phase 2 social” — see deferred section below.*

| Item | Status |
|------|--------|
| Landing page | Done |
| About (on landing `#about`) | Done |
| Features (on landing `#features`) | Done |
| Contact / waitlist UI | Done (UI only — no backend) |
| Privacy policy `/privacy` | Done |
| Terms `/terms` | Done |
| Responsive layouts | Done |
| Public launch (domain + HTTPS) | Done |

**Build order step 9:** Public website pages — **~90%** (waitlist backend optional)

---

## PHASE 3 — MOBILE APP FOUNDATION (Build Plan)

- [ ] Expo app auth + navigation parity with web
- [ ] Same Supabase account across web and mobile

`apps/mobile/` scaffold exists (partial auth only).

**Do not start until Phase 2 sign-off.**

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

## DEFERRED (not in Build Plan PDF — built early, keep)

These were implemented before mobile; **not required for Phase 1 PDF** but live on production:

- [x] Reading Room (`/reading-room`)
- [x] Shelf analytics + sort
- [x] Reading goal (yearly)
- [x] Favorite genre + reading streak
- [x] Responsive & accessibility sprint
- [ ] Badges & achievements

## SOCIAL FEED (beyond Build Plan PDF)

- [x] Follow / unfollow users (`follows` table, migration `005`)
- [x] Following feed + For You feed (`/feed`)
- [x] Public reader profiles (`/reader/?username=`)
- [x] Activity visibility (public / followers / private)
- [ ] Likes, comments, book clubs

## DEFERRED — SOCIAL (extended)

- [ ] Likes, comments, book clubs

**Core follow + feed shipped; extended social deferred.**

---

## Last updated

Phase 1 completion sprint closed. Social follow + dual feed (`/feed`, `/reader`) added. Production live at bookmarked.online. Apply migration `005_social_follows_and_feed.sql` to Supabase before using follows in production.
