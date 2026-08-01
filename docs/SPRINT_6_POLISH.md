# Sprint 6 — Final Polish & Bug Fixes

Status: implemented on web + native iOS (Aug 2026).

## Critical — DNF “Book not found”

| Item | Status | Notes |
|------|--------|-------|
| Root cause | ✅ | `getAuthUserBook` / shelf moves required a successful catalog `books` row before updating `user_books`. Catalog select failures (or missing audiobook columns) returned **Book not found** even when the book was already on Currently Reading. |
| Library-first move | ✅ | Web `setBookShelfStatus` + iOS `setShelfStatus` resolve `user_books` first; update existing row; never duplicate. |
| DNF patch | ✅ | Shared `buildUserBookShelfPatch` sets `shelf_status: dnf`, `dnf: true`, clears `finished_at`, preserves progress/sessions/notes/custom shelves. |
| Stats exclusion | ✅ | `countsTowardFinishedStats` + `countResolvedPagesRead` exclude DNF from Books Finished, Pages Read, and yearly goals. |

## Branding / typography

| Item | Status | Notes |
|------|--------|-------|
| Shelf titles | ✅ | Playfair / `font-display` (web) + `SERIF_DISPLAY_FONT` (iOS); larger, heavier weight |
| Book cards | ✅ | More prominent titles, slightly larger subtitles, cover → title → metadata spacing |
| Parity | ✅ | Web `BookCard` / bookshelf headers + iOS `CoverTile` / `ShelfTitleRow` |

## DNF consistency

| Item | Status | Notes |
|------|--------|-------|
| Optimistic UI | ✅ | Web `BookShelfActions`; iOS book detail query cache |
| Persist after refresh | ✅ | Single `user_books` update with `shelf_status = dnf` |
| No duplicate shelf entries | ✅ | Update-by-id when library row exists; custom shelves untouched |
| Built-in order | ✅ | TBR → Currently Reading → Finished → DNF |

## Shelf icons

| Item | Status | Notes |
|------|--------|-------|
| Transparent background | ✅ | Web + iOS `ShelfIcon` |
| Order + Retina assets | ✅ | Existing PNG set; labels/a11y: Want to Read, Did Not Finish |

## QA checklist (mental + unit)

| Check | Result |
|-------|--------|
| Currently Reading → DNF (library row present) | ✅ Unit: `buildUserBookShelfPatch`; service updates `user_books` without catalog hard-fail |
| Want to Read / Finished → DNF | ✅ Same patch path |
| DNF → Currently Reading | ✅ Clears `dnf` flag via patch / `setDnf(false)` |
| Progress / notes preserved on DNF move | ✅ Patch omits progress fields; `setDnf` no longer zeroes percent |
| Books Finished / Pages Read / Goals exclude DNF | ✅ `countsTowardFinishedStats` + analytics/goal filters + `countResolvedPagesRead` test |
| Custom shelf memberships retained | ✅ Only built-in `user_books.shelf_status` changes |
| Shelf icon order TBR → CR → Finished → DNF | ✅ `shelfIcons.test.ts` / `shelves.test.ts` |
| Refresh still shows DNF | ✅ Persisted `shelf_status` + `dnf` |

### Remaining gaps

- End-to-end device QA against live Supabase (confirm Sprint 6 DNF migration applied in the target project).
- If a catalog `books` row was hard-deleted while `user_books` remains, activity titles may fall back to “Untitled” until metadata is restored.
- Android out of scope for this sprint.
