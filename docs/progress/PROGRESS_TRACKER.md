# Bookmarked — Progress Tracker

---

## PHASE 0 — SETUP

- [x] All setup tasks complete

---

## PHASE 1 — CORE WEB APP MVP

- [x] **Task 1** — Hydration fixes (NavbarPublicAuth, ButtonLink, date suppressHydrationWarning)
- [x] **Task 2** — Book details page (`/book/[id]` — metadata, shelf, progress, reviews)
- [x] **Task 3** — Shelf selector modal (choose shelf before save, move/update, toast feedback)
- [x] **Task 4** — Reading progress (pages, %, dates, mark finished, full-page suggestion)
- [x] **Task 5** — Reviews (rating, body, spoiler, edit/delete, one per user per book)
- [x] **Task 6** — Activity feed (5 event types, dashboard display)
- [x] **Task 7** — Empty / loading / error states across major flows
- [x] **Task 8** — Responsive QA (desktop, tablet, mobile)
- [x] **Task 9** — Database audit (tables, FKs, indexes, RLS — see ARCHITECTURE_CONTEXT)
- [x] **Task 10** — Documentation updated
- [x] **Task 11** — Phase 1 smoke test criteria met (18-step journey)

### Phase 1 user capabilities

| Capability | Route / component |
|------------|-------------------|
| Auth | `/login`, `/signup`, `proxy.ts` |
| Profile | `/profile`, `/profile/setup` |
| Search | `/search` + Open Library |
| Book details | `/book/[id]` |
| Shelves | `ShelfSelectMenu`, `BookShelfActions` |
| Progress | `ReadingProgressPanel` |
| Reviews | `BookReviewSection` |
| Activity | `ActivityFeed` on `/dashboard` |

---

## PHASE 1.5 — DIFFERENTIATION

- [x] Interactive Bookshelf (bookshelf / grid toggle)
- [x] Shelf detail pages + search + sort
- [x] Reading Analytics
- [x] Reading Room (`/reading-room`)
- [x] Profile expansion
- [x] Dashboard expansion
- [x] Visual polish

### Post–Phase 1.5 enhancements

- [x] Reading goal (yearly target, progress on dashboard / reading room / profile)
- [x] Favorite genre analytics (read-book subjects + profile fallback)
- [x] Reading streak tracking (activity events, current + best streak)
- [ ] Badges & achievements

---

## PHASE 2 — SOCIAL (DO NOT START)

- [ ] Follow users, likes, comments, communities, book clubs

---

## PHASE 3 — MOBILE APP (DO NOT START)

- [ ] Align Expo app with web MVP

---

## Last Updated

Phase 1 complete. Phase 1.5 complete.
