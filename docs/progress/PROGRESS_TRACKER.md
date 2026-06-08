# Bookmarked — Progress Tracker

---

## PHASE 0 — SETUP

- [x] All setup tasks complete

---

## PHASE 1 — WEB APP MVP

- [x] Book details page (`/book/[id]` — cover, metadata, shelf, progress, reviews)
- [x] Reading progress editor (pages, percent, progress bar, started/finished dates, mark finished)
- [x] Reviews system (create, edit, delete, spoiler toggle, one per user per book)
- [x] Activity feed events (book_added, shelf_updated, progress_updated, book_finished, review_created)
- [x] Hydration fixes (NavbarPublicAuth, ButtonLink, suppressHydrationWarning on dates)
- [x] Empty / loading / error states (search, library, shelves, reviews, covers, actions)
- [x] Responsive QA (desktop, tablet, mobile — navbar scroll, tappable buttons, stacked cards)
- [x] Phase 1 smoke test criteria met

### Phase 1 routes

| Route | Purpose |
|-------|---------|
| `/search` | Open Library search |
| `/book/[id]` | Book details (canonical) |
| `/books/[id]` | Redirects to `/book/[id]` |
| `/library` | User library |
| `/dashboard` | Home + activity feed |

---

## PHASE 1.5 — DIFFERENTIATION

- [x] Interactive Bookshelf View (bookshelf / grid toggle, preference saved)
- [x] Shelf detail pages (`/library/want-to-read`, `/reading`, `/read` + stats + search)
- [x] Library Analytics (dashboard, library, reading room, profile)
- [x] Reading Room (`/reading-room` — signature feature)
- [x] Profile expansion (genres, stats, favorites, recently finished)
- [x] Dashboard enhancements (widgets, quick actions, Reading Room link)
- [x] Visual polish (cover placeholders, fade-in, reading room atmosphere, modal mobile sheet)
- [x] Favorites toggle on book details (feeds Reading Room)

### Phase 1.5 deferred

- [ ] Reading goal (full feature)
- [ ] Reading streak / favorite genre analytics
- [ ] Badges & achievements

---

## PHASE 2 — SOCIAL (DO NOT START)

- [ ] Follow users, likes, comments, communities, book clubs

---

## PHASE 3 — MOBILE APP (DO NOT START)

- [ ] Align Expo app with web MVP

---

## Last Updated

Phase 1 MVP complete. Phase 1.5 differentiation sprint complete.
