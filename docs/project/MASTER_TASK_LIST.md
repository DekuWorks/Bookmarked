# Bookmarked — Master Development Task List

Canonical high-level project status. For route-level detail and migration history, see [Progress Tracker](../progress/PROGRESS_TRACKER.md).

**Live:** https://bookmarked.online

---

## Project Synopsis

Bookmarked is a web-first reading platform that allows users to search books, organize personal libraries, track reading progress, write reviews, and discover other readers.

The project is intentionally being built in phases.

The website and web application are the primary focus. The mobile application will not begin until the web platform reaches MVP completion.

The long-term vision is for Bookmarked to become the modern reading platform that combines the best parts of Goodreads, StoryGraph, and a cozy personal digital library, while adding a unique social reading experience.

---

## Technology Stack

**Frontend**

- Next.js
- TypeScript
- Tailwind CSS

**Backend**

- Supabase
- PostgreSQL
- Authentication
- Row Level Security

**Book Data**

- Open Library API
- Google Books fallback (covers)
- Future ISBNdb integration

**Deployment**

- GitHub
- GitHub Actions
- GitHub Pages
- GoDaddy DNS
- HTTPS

---

## Current Project Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 0 — Foundation | ✅ Complete | Planning, architecture, infra |
| Phase 1 — Web Platform | ✅ Complete | Core app live in production |
| Phase 2 — Public Pages & Polish | ✅ Complete | Landing, legal, contact, launch |
| Phase 3 — Mobile Foundation | 🟡 Ready to start | `apps/mobile/` scaffold only |
| Phase 4 — Mobile Core Features | ⚪ Not started | Shelves, search, progress on mobile |
| Phase 5 — Sync & Delivery | 🟡 Partial | Web deploy done; app store pending |

**Current focus:** Phase 3 — Mobile app foundation

---

## Development Philosophy

Finish the web application first.

Once the browser experience is polished and feature complete:

1. Build the React Native mobile app.
2. Reuse the same Supabase backend.
3. Reuse authentication.
4. Reuse database models.
5. Reuse business logic whenever possible.

The website is the foundation for the mobile app.

---

# SECTION 2 — Completed Features & Current Progress

## Phase 0 — Foundation (100% Complete)

The planning and architecture phase has been completed.

**Completed:**

- Project vision
- Product roadmap
- Feature planning
- User flows
- UI planning
- Color palette
- Branding
- Database architecture
- Authentication architecture
- GitHub repository
- Supabase project
- Environment variables
- GitHub Actions
- GitHub Pages deployment
- GoDaddy DNS
- HTTPS certificate
- Production deployment
- Architecture documentation
- Progress tracker documentation
- UI context documentation
- AI workflow rules
- Project overview documentation

---

## Phase 1 — Web Platform (100% Complete)

The core web application is functional and deployed.

### Authentication

**Completed**

- User registration
- User login
- Logout
- Protected routes
- Session persistence
- Supabase Auth integration

### User Profiles

**Completed**

- Profile creation
- Profile editing
- User data storage
- Avatar placeholder
- Username support
- Favorite genres
- Preferred library view (bookshelf / grid)
- Yearly reading goal

Future improvements can be added later.

### Dashboard

**Completed**

- Dashboard layout
- Welcome section
- Quick Actions
- Continue Reading section
- Reading overview
- Activity feed
- Navigation

### Book Search

**Completed**

- Open Library API integration
- Search by title
- Search by keyword
- Search results page
- Book cards
- Cover image loading
- Pagination support

**Future**

- Better filtering
- Better sorting
- ISBNdb integration

### Book Details

**Completed**

- Static-safe route `/book/?id={uuid}` (GitHub Pages)
- Book metadata display
- Shelf actions from book page
- Reading progress panel
- Reviews section

### Library

**Completed**

- Personal library
- User shelves
- Shelf organization
- Book persistence
- Database integration
- Dedicated shelf pages (`/library/want-to-read`, `/library/reading`, `/library/read`)
- Per-shelf analytics and sort

### Shelves

**Completed**

- Want To Read
- Currently Reading
- Read

Books can be added and moved between shelves.

### Reading Progress

**Completed**

- Page and percent tracking
- Start and finish dates
- Mark as finished flow
- Progress persisted to Supabase

### Reviews

**Completed**

- Star ratings (1–5)
- Review text
- Spoiler toggle
- Edit and delete own reviews
- One review per user per book

### Bookshelf Experience

**Completed**

- Traditional Grid View
- Bookshelf View
- Toggle between both layouts
- Reading Room (`/reading-room`) — signature personalized space

Bookshelf View can continue being polished; the foundation is complete.

### Cover Fallback

**Completed**

Fallback order for missing covers:

1. Open Library cover ID
2. Open Library ISBN URL
3. Google Books API
4. Branded Bookmarked placeholder

### Navigation

**Completed**

App navigation includes:

- Dashboard
- Feed
- Reading Room
- Library
- Search
- Profile
- Logout

Public landing navigation includes:

- About
- Features
- Contact

Responsive navigation is working.

### Deployment

**Completed**

- GitHub Pages
- Custom domain — bookmarked.online
- HTTPS / SSL
- Production build (Next.js static export)
- Environment variables
- Supabase production connection

The application is live.

### Accessibility

**Completed**

- Responsive layouts
- Mobile support
- Tablet support
- Keyboard navigation improvements
- Semantic HTML
- Skip link and focus-visible patterns

### UI Design System

**Completed**

**Primary color:** Pastel Purple

**Supporting colors:**

- Puce Red
- Rust
- Royal Orange
- Orange Yellow
- Pastel Purple

These colors should continue being used throughout the application for consistency. See [Design System](../ui/DESIGN_SYSTEM.md).

---

## Phase 2 — Public Pages & Polish (100% Complete)

**Completed**

- Landing page (hero, About, Features, How it works, dashboard preview, Contact)
- Hero headline and centered mobile-first layout
- CTA buttons (signup / login)
- Contact section (mailto + account CTAs — waitlist removed)
- Privacy policy (`/privacy`)
- Terms of service (`/terms`)
- Public launch on bookmarked.online with HTTPS
- Responsive legal and marketing pages

---

## Beyond Build Plan — Social & Discovery (Shipped)

These features were built after Phase 1 and are live in production.

### Follow graph & feeds

**Completed**

- Follow / unfollow
- Following feed and For You feed (`/feed`)
- Activity visibility (public / followers / private)
- Feed book cover hydration
- Feed search (readers, books, posts)

### Public profiles & library

**Completed**

- Public reader profiles (`/reader/?username=`)
- Follower / following counts and lists (with mutuals)
- Profile shelf previews
- Full public reader library (`/reader-library/?username=`)
- Per-shelf privacy controls (Public / Followers only / Private)

### Deferred social

- Likes, comments, book clubs
- Badges & achievements

---

## Mobile Planning

The mobile app has **not** started (Phase 3).

The architecture is already planned. The future React Native application will reuse:

- Supabase
- Authentication
- Database
- Business logic
- API structure

The web application is the source of truth.

`apps/mobile/` exists with partial auth scaffold only.

---

## Current Overall Status

### Completed ✅

| Area | Status |
|------|--------|
| Authentication | ✅ |
| Profiles | ✅ |
| Dashboard | ✅ |
| Book search | ✅ |
| Book details | ✅ |
| Library & shelves | ✅ |
| Reading progress | ✅ |
| Reviews | ✅ |
| Activity feed | ✅ |
| Grid & bookshelf views | ✅ |
| Reading Room | ✅ |
| Cover fallback | ✅ |
| Landing page | ✅ |
| Privacy & terms | ✅ |
| Responsive design | ✅ |
| Accessibility | ✅ |
| Production deployment | ✅ |
| Social feed & follows | ✅ |
| Public reader profiles | ✅ |
| Shelf privacy | ✅ |

### Next up — Phase 3

- Expo app auth + navigation parity with web
- Same Supabase account across web and mobile

### Later — Phase 4 & 5

- Mobile shelves, search, progress, reviews, dashboard
- Cross-platform sync testing
- App store readiness

Everything else should build on the existing architecture rather than replacing it.

---

# SECTION 3 — Architecture, Development Rules & Coding Standards

## Development Philosophy

Bookmarked is being built as a web-first platform.

The web application is the primary product.

Every feature should be designed so it can later be reused in the React Native mobile application with little or no backend changes.

The website should always be considered the source of truth.

---

## Architecture

**Frontend**

- Next.js
- TypeScript
- Tailwind CSS

**Backend**

- Supabase
- PostgreSQL
- Authentication
- Row Level Security

**Deployment**

- GitHub Pages
- GitHub Actions
- GoDaddy DNS (custom domain)

**Book API**

**Current**

- Open Library (search and metadata)
- Google Books fallback (covers when Open Library has no art)

**Future**

- ISBNdb integration for richer metadata

For deployment and static-export constraints, see [Architecture Context](../architecture/ARCHITECTURE_CONTEXT.md).

---

## Development Rules

Always build reusable code.

Avoid creating duplicate components.

Prefer reusable UI components over page-specific code.

Create reusable:

- Buttons
- Cards
- Forms
- Modals
- Empty states
- Loading states
- Error states
- Book cards
- Shelf cards

If something is repeated twice, consider making it a reusable component.

---

## Folder Organization

Keep code organized. Follow the existing monorepo structure:

```
apps/web/src/
  components/
    ui/
    layout/
    books/
    dashboard/
    profile/
    landing/
    social/
    library/
  lib/
    supabase/
    services/
    utils/
    hooks/
  app/
  types/

apps/mobile/        # Phase 3+
packages/types/     # Shared types
supabase/migrations/
docs/
```

Follow the existing project structure where possible. Do not invent parallel patterns.

---

## Styling Rules

Continue using Tailwind CSS.

Do not hardcode colors repeatedly.

Use the Bookmarked design system — see [Design System](../ui/DESIGN_SYSTEM.md).

**Primary color:** Pastel Purple

**Supporting colors:**

- Puce Red
- Rust
- Royal Orange
- Orange Yellow

Spacing should remain consistent throughout the application.

Buttons should look and behave consistently.

Cards should share the same design language.

---

## Responsive Design Rules

Always build mobile-first.

Every new page must support:

- Desktop
- Laptop
- Tablet
- Mobile

Never allow:

- Horizontal scrolling
- Broken cards
- Overflowing text
- Tiny tap targets

Every feature must be responsive before being considered complete.

---

## Accessibility Rules

Every feature should include:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Labels for inputs
- Proper heading structure
- Meaningful alt text
- Accessible buttons
- Accessible forms

Accessibility is not an afterthought.

---

## Database Rules

Continue using Supabase.

Keep database normalized.

Avoid duplicate records.

Maintain relationships between:

- Users
- Books
- Shelves
- Reviews
- Reading progress
- Activity

Never duplicate book data unnecessarily.

Reuse existing tables whenever possible.

Schema changes go in numbered migrations under `supabase/migrations/`. Enable RLS on every new table in `public`.

---

## Authentication Rules

Authentication is complete.

Every new feature should respect authentication.

Only authenticated users can:

- Save books
- Edit shelves
- Track progress
- Write reviews
- Edit profile
- Follow other readers

Guest users may browse public pages (landing, privacy, terms) and view public reader content where visibility allows.

---

## API Rules

Continue using Open Library for search and catalog growth.

Never hardcode book information.

Always fetch metadata.

If metadata is missing:

1. Use available fields.
2. Show placeholder (Open Library → ISBN → Google Books → branded placeholder).
3. Never crash.

**Future improvements**

- ISBNdb metadata

---

## Error Handling

Every feature must have:

- Loading state
- Empty state
- Error state
- Success state

Do not leave blank pages.

Do not expose raw errors.

Always provide useful feedback to users.

---

## Routing Rules

Because the site deploys using GitHub Pages with Next.js static export:

- Avoid routing patterns that break static exports.
- Use query-based routes where needed (e.g. `/book?id={uuid}`, `/reader?username=`).
- Verify refreshing pages works correctly.
- Prevent 404s wherever possible.
- Include `public/.nojekyll` for GitHub Pages.

---

## Component Standards

Components should be:

- Reusable
- Small
- Readable
- Typed

Avoid giant files (target under ~300 lines).

Separate business logic from UI whenever practical — prefer `lib/services/` over inline Supabase calls in pages.

---

## Performance Rules

- Lazy load where appropriate.
- Avoid unnecessary re-renders.
- Optimize book cover loading (fallback chain, avoid layout shift).
- Avoid blocking rendering.
- Prefer lightweight animations.

---

## Documentation Rules

Whenever a major feature is completed, update:

- README
- [Progress Tracker](../progress/PROGRESS_TRACKER.md)
- This Master Task List (when status changes)
- Architecture docs when patterns change

Keep project documentation synchronized with the codebase.

For AI-assisted development, also follow [AI Workflow Rules](../ai/AI_WORKFLOW_RULES.md).

---

## Phase Rules

**Phases 0, 1, and 2 are complete.** Phase 3 (mobile foundation) may begin.

Do **not** begin until explicitly planned:

- **Mobile app core features** (Phase 4) before Phase 3 foundation is done
- **Messaging**
- **AI features**
- **Premium / paid features**
- **Social v2** — likes, comments, book clubs (social v1 — feed, follows, public profiles — is already live)

Web work should extend the existing architecture. Mobile should reuse Supabase auth, schema, and services — not fork the backend.

---

## Overall Goal

Every feature should move Bookmarked closer to becoming a polished, production-quality reading platform.

The application should feel simple for users while maintaining a clean, scalable architecture for future development.

Build features that can grow with the product rather than solving only today's requirements.

---

# SECTION 4 — Phase 1 Completion Sprint

**Status: ✅ Complete** (signed off — live at https://bookmarked.online)

## Phase Goal

Finish the Bookmarked web application so users can complete their entire reading journey directly from the browser.

By the end of Phase 1, a user should be able to:

Create an account → Login → Search for books → Add books to shelves → View book details → Track reading progress → Write reviews → View activity → Manage their personal library

Phase 1 represents a complete MVP.

---

## Task 1 — Complete Book Details ✅

**Goal:** Create a complete details page for every book — the central hub for each book.

**Display:** Cover, title, author, description, publish year, page count, ISBN, current shelf, reading progress, reviews

**Actions:** Add to Want To Read / Reading / Read, update progress, write review

**Entry points:** Search, Library, Dashboard, Bookshelf View, Grid View

**Implementation:** `/book?id={uuid}` · `BookDetailsPage` · `BookShelfActions` · `ReadingProgressPanel` · `BookReviewSection`

**Done when:** Every book opens a complete details page. ✅

---

## Task 2 — Fix Continue Reading ✅

**Goal:** Continue Reading always routes correctly.

**Behavior:**

- If user has a current reading book → open Book Details
- If user has no current book → guide to Search (no broken links)

**Implementation:** `CurrentlyReadingRow` on dashboard — `bookDetailsPath()` for active reads; empty state links to `/search` and want-to-read shelf

**Done when:** Continue Reading always works. ✅

---

## Task 3 — Reading Progress System ✅

**Goal:** Users can track reading progress end-to-end.

**Features:** Current page, total pages, progress %, progress bar, started date, finished date

**Behavior:**

- Moved to Reading → set `started_at`
- Finished → move to Read, set `finished_at`, progress 100%

**Implementation:** `ReadingProgressPanel` · `updateReadingProgress` / finish actions · `user_books` columns

**Done when:** Users can completely track reading progress. ✅

---

## Task 4 — Shelf Workflow Improvements ✅

**Goal:** Seamless shelf management without duplicates.

**Shelves:** Want To Read, Currently Reading, Read

**Behavior:** Choose shelf on add; update existing row instead of duplicating (`unique (user_id, book_id)`)

**Implementation:** `BookShelfActions` · `ShelfSelectMenu` · shelf pages under `/library/[shelf]`

**Done when:** Shelf management feels seamless. ✅

---

## Task 5 — Reviews ✅

**Goal:** Users can review books throughout the app.

**Build:** 1–5 star rating, review body, spoiler toggle, edit, delete

**Rules:** One review per user per book; spoilers hidden by default; users edit own review only

**Implementation:** `BookReviewSection` · migration `003` unique constraint

**Done when:** Reviews work throughout the application. ✅

---

## Task 6 — Activity Feed ✅

**Goal:** Dashboard reflects user activity.

**Track:** Book added, shelf changed, progress updated, book finished, review added

**Implementation:** `ActivityFeed` on `/dashboard` · `activity_events` table

**Done when:** Dashboard reflects user activity. ✅

---

## Task 7 — Book Cover Improvements ✅

**Goal:** No broken book covers.

**Current chain:**

1. Open Library cover ID
2. Open Library ISBN URL
3. Google Books fallback
4. Branded Bookmarked placeholder

**Future (not required for Phase 1):** ISBNdb metadata

**Implementation:** `BookCover` component · cover resolution in search/catalog services

**Done when:** No broken book covers appear. ✅

---

## Task 8 — Empty States ✅

**Goal:** Every major page provides loading, empty, error, and success feedback.

**Examples:** Empty library, no search results, no reviews, no progress, no currently-reading books

**Implementation:** `LoadingState` · `BookMiniGrid` empty messages · dashed-border empty blocks · toast success/error on actions

**Done when:** Every page provides user feedback. ✅

---

## Task 9 — Responsive QA ✅

**Goal:** Entire web app works across desktop, laptop, tablet, and mobile.

**Verified areas:** Dashboard, Library, Search, Book Details, Reviews, Profile, Navigation, Bookshelf View, Grid View

**Requirements:** No horizontal scrolling, tappable buttons, cards resize correctly

**Implementation:** Mobile-first Tailwind · `NavbarMenu` · responsive grids · landing page centering sprint

**Done when:** Entire web app works across devices. ✅

---

## Task 10 — Production QA ✅

**Goal:** Full user flow works in production with data persistence.

**Flow tested:** Sign up → login → search → details → add to shelf → move to reading → update progress → finish → review → logout → login → verify persistence

**Implementation:** GitHub Pages deploy · Supabase production · static export routing fixes · env secrets in CI

**Done when:** No critical bugs remain in the core loop. ✅

---

## Phase 1 Completion Checklist

| Item | Status |
|------|--------|
| Authentication | ✅ Complete |
| Profiles | ✅ Complete |
| Book Search | ✅ Complete |
| Library | ✅ Complete |
| Shelves | ✅ Complete |
| Book Details | ✅ Complete |
| Reading Progress | ✅ Complete |
| Reviews | ✅ Complete |
| Activity Feed | ✅ Complete |
| Responsive QA | ✅ Complete |
| Production QA | ✅ Complete |
| Deployment | ✅ Complete |

**Phase 1 is officially finished.**

Next: [Phase 2](../progress/PROGRESS_TRACKER.md#phase-2--website-polish--public-pages-build-plan) (complete) → [Phase 3 — Mobile foundation](../progress/PROGRESS_TRACKER.md#phase-3--mobile-app-foundation-build-plan) (current focus).

---

## Related docs

- [Progress Tracker](../progress/PROGRESS_TRACKER.md) — routes, migrations, smoke tests
- [Project Overview](./PROJECT_OVERVIEW.md) — product vision and MVP scope
- [Architecture Context](../architecture/ARCHITECTURE_CONTEXT.md)
- [Design System](../ui/DESIGN_SYSTEM.md)

**Last updated:** June 2026
