# Bookmarked — Project Progress

> Post-MVP refinement tracker. Updated July 2026.

**Live:** https://bookmarked.online

---

## Phase overview

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Audit & documentation | ✅ Complete | All four Phase 0 docs delivered |
| 1 | Navigation redesign | ✅ Complete | Dashboard, Library, Reading Room tabs, mobile bottom nav |
| 2 | Reading Room depth | 🟡 In progress | Finish workflow + review polish shipped; journal mood tags remain |
| 3 | Profile & social cleanup | ⚪ Not started | Remove cross-page duplication on public profiles |
| 4 | Mobile app parity | ⚪ Not started | `apps/mobile/` scaffold exists |
| 5 | Performance & QA | ⚪ Not started | Full responsive QA after nav redesign |

Legend: ✅ Complete · 🟡 In progress · ⚪ Not started · 🔴 Blocked

---

## Phase 0 — Audit & documentation

| Task | Status | Deliverable |
|------|--------|-------------|
| 0.1 Current architecture snapshot | ✅ | `docs/BOOKMARKED_CURRENT_ARCHITECTURE.md` |
| 0.2 Comprehensive architecture doc | ✅ | `docs/BOOKMARKED_ARCHITECTURE.md` |
| 0.3 Technical debt register | ✅ | `docs/TECHNICAL_DEBT.md` |
| 0.4 Progress tracker (this file) | ✅ | `docs/PROJECT_PROGRESS.md` |

### Audit scope covered

- [x] Folder structure, routes, auth, Supabase integration
- [x] Database tables, RLS policies
- [x] Reusable components, duplicated code patterns
- [x] State management, UI components, API/service layer
- [x] Reading / review / library / feed / profile workflows
- [x] Mobile responsive layouts
- [x] Technical debt

---

## Phase 1 — Navigation redesign

### 1.1 Dashboard (`/dashboard/`)

**Purpose:** “What should I read today?”

| Item | Status | Notes |
|------|--------|-------|
| Keep: Currently Reading | ✅ | `CurrentlyReadingRow` |
| Keep: Reading Goal | ✅ | `ReadingGoalPanel` compact |
| Keep: Quick Actions | ✅ | Search, continue, library, add |
| Keep: Recent Activity | ✅ | `ActivityFeed` |
| Remove: Suggested Shelves | ✅ | Was not on dashboard |
| Remove: Reading At A Glance / Community picks | ✅ | `TrendingNewsletterPanel` removed |
| Improve hero, spacing, typography | ✅ | Gradient hero + headline updated |

### 1.2 Library (`/library/`)

**Purpose:** Organize books only.

| Item | Status | Notes |
|------|--------|-------|
| Bookshelf + Grid view | ✅ | `LibraryViewShell` |
| Collections (custom shelves) | ✅ | `CustomShelfCollectionsPanel` |
| Search, sort, filter | ✅ | Shelf pages + `ShelfSortSelect` |
| Remove reading goal / stats / insights | ✅ | Not present on library page |
| Remove suggested shelves | ✅ | `SuggestedShelvesPanel` removed from library |
| Remove journal / notes | ✅ | Only on book detail pages |

### 1.3 Reading Room (`/reading-room/`)

**Purpose:** All reading-life features in one place.

| Tab | Status | Components |
|-----|--------|------------|
| Overview | ✅ | Currently reading, finished, favorites, library link |
| Progress | ✅ | Reading goal, activity charts, analytics grid |
| Journal | ✅ | User-wide reading sessions |
| Notes | ✅ | Recent notes + link to `/notes/` |
| Reviews | ✅ | User review list |
| History | ✅ | Finished books timeline + recent sessions |
| Remove long-scroll layout | ✅ | Tabbed layout replaces vertical stack |

### 1.4 Profile (`/profile/`)

| Item | Status | Notes |
|------|--------|-------|
| Keep avatar, username, bio, genres | ✅ | Already focused |
| Keep reading streak | ✅ | `ReadingStreakCard` |
| Keep settings + logout | ✅ | Account settings accordion |
| Remove duplicated shelves / goal / notes / stats / feed | ✅ | Not on own profile page (public `/reader/` still has shelf preview + feed — Phase 3) |

### 1.5 Mobile navigation

| Item | Status | Notes |
|------|--------|-------|
| Desktop top nav | ✅ | Simplified links; Reading Room as Home |
| Mobile bottom nav (5 tabs) | ✅ | Home, Feed, Search, Messages, Profile |
| Reading Room = Home on mobile | ✅ | `/reading-room/` |
| Library accessible from Home | ✅ | Link on Reading Room overview + dashboard quick actions |
| Replace hamburger on app mobile | ✅ | Bottom nav primary; header shows logo + notifications |

---

## Phase 2 — Reading Room depth

### 2.1 Mark as finished workflow

| Item | Status | Notes |
|------|--------|-------|
| Auto-set pages to 100% on finish | ✅ | `markBookFinished` |
| Move to Read shelf | ✅ | `shelf_status: read` |
| Save finish date (with picker) | ✅ | `MarkFinishedDialog` + `finished_at` on action |
| Create journal entry | ✅ | `createReadingSessionWithClient` at finish |
| Post-finish “Rate this book?” prompt | ✅ | `RateBookPrompt` — Skip / Review now |

### 2.2 Ratings & reviews

| Item | Status | Notes |
|------|--------|-------|
| Half-star ratings (0.5 increments) | ✅ | `StarRating`, `parseHalfStarRating`, `StarDisplay` |
| Multiple reviews per read | ✅ | `read_number` + unique index per read |
| Add another read | ✅ | `AddAnotherReadButton` + `addAnotherRead` |
| Book edition on reviews | ✅ | Preset chips (Hardcover, Paperback, Kindle, etc.) + custom |
| Advanced category ratings | ✅ | `ReviewForm` advanced tab |
| Feelings / mood tags | ✅ | `REVIEW_FEELINGS` in advanced review mode |
| Auto completion tags | ✅ | `computeCompletionTags` on finish |

### 2.3 Journal, notes & streak

| Item | Status | Notes |
|------|--------|-------|
| Reading journal (sessions timeline) | ✅ | `ReadingJournalSection` + `reading_sessions` |
| Session notes | ✅ | Inline note editor per session |
| Reading notes (quotes, tags) | ✅ | `ReadingNotesSection` on book detail |
| Reading streak | ✅ | `ReadingStreakCard` on profile + Reading Room Progress tab |

### 2.4 Remaining Phase 2 work

| Item | Status | Notes |
|------|--------|-------|
| Journal mood tags on sessions | ⚪ | Schema has `note` only; no mood column yet |
| Mobile finish → rate prompt parity | ⚪ | Web only; mobile uses separate flow |
| Review aggregation polish in Reading Room | 🟡 | Tab exists; deeper filters TBD |

---

## Pre-refinement baseline (MVP — complete)

| Area | Status |
|------|--------|
| Auth (email/password, remember me) | ✅ |
| Book search (ISBNdb via Edge Function) | ✅ |
| Library & built-in shelves | ✅ |
| Custom shelves & collections | ✅ |
| Reading progress & sessions | ✅ |
| Reviews & reactions | ✅ |
| Social feed & posts | ✅ |
| Follow graph & public profiles | ✅ |
| Book clubs & messaging | ✅ |
| Notifications | ✅ |
| Goodreads CSV import | ✅ |
| GitHub Pages deploy | ✅ |

---

## Related docs

| Doc | Path |
|-----|------|
| Architecture (comprehensive) | `docs/BOOKMARKED_ARCHITECTURE.md` |
| Architecture (pre-refinement snapshot) | `docs/BOOKMARKED_CURRENT_ARCHITECTURE.md` |
| Technical debt | `docs/TECHNICAL_DEBT.md` |
| Design system | `docs/ui/DESIGN_SYSTEM.md` |
| Master task list (MVP era) | `docs/project/MASTER_TASK_LIST.md` |

**Last updated:** July 2026
