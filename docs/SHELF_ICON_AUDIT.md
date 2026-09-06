# Shelf Icon Audit

Canonical mapping lives in `packages/utils/shelfIcons.ts`. Platform files only attach web URLs / iOS `require()` sources. Product order, DB IDs unchanged:

| Shelf | Canonical ID | Logical key | Asset | Users can change? |
|-------|--------------|-------------|-------|-------------------|
| TBR | `want_to_read` | `stack_of_books` | `want-to-read.png` | No |
| Currently Reading | `currently_reading` | `open_book` | `currently-reading.png` | No |
| Finished | `read` | `book_with_sparkle` | `finished.png` | No |
| DNF | `dnf` | `closed_book` | `did-not-finish.png` | No |

A11y: “TBR Shelf”, “Currently Reading Shelf”, “Finished Shelf”, “DNF Shelf”.

## Custom shelves

`user_shelves.icon_key` stores `custom_icon_1` … `custom_icon_5` only (never paths, blobs, or emoji). Missing/invalid keys fall back to `custom_icon_1`.

**BLOCKED ASSET ITEM — Leighton final files.** Expected drop-ins: `custom-icon-1.png` … `custom-icon-5.png` in `apps/web/public/assets/shelves/` and `apps/mobile/assets/shelves/`. Until those exist, `CUSTOM_SHELF_ICON_ASSETS_READY` is `false` and every custom key renders the approved stack-of-books PNG (`want-to-read.png`). Do not mark custom visuals complete.

Create preselects `custom_icon_1`. Edit persists name, privacy, genre, and icon immediately. Default-shelf icons are not editable. Android is out of scope.

**Shared:** `packages/utils/shelfIcons.ts`  
**Config:** `apps/web/src/lib/constants/shelfIcons.ts` · `apps/mobile/src/constants/shelfIcons.ts`  
**Assets:** `apps/web/public/assets/shelves/` · `apps/mobile/assets/shelves/` (source copies in `source/`)  
**Components:** `ShelfIcon` · `ShelfTitleRow` (web + mobile)  
**Docs:** `docs/DESIGN_SYSTEM.md` · `docs/ASSET_GUIDE.md` · `docs/MOBILE_UI_GUIDE.md`

## Web

| Location | File | Updated |
|----------|------|---------|
| Shelf config (sortOrder, accessibilityLabel) | `apps/web/src/lib/constants/shelves.ts` | ✅ |
| Central icon config | `apps/web/src/lib/constants/shelfIcons.ts` | ✅ |
| Shelf labels | `apps/web/src/lib/constants/shelfLabels.ts` | ✅ |
| ShelfIcon component | `apps/web/src/components/shelves/ShelfIcon.tsx` | ✅ |
| ShelfTitleRow component | `apps/web/src/components/shelves/ShelfTitleRow.tsx` | ✅ |
| Library — bookshelf sections | `apps/web/src/components/library/BookshelfSection.tsx` | ✅ |
| Library — bookshelf view | `apps/web/src/components/library/BookshelfView.tsx` | ✅ |
| Library — grid view | `apps/web/src/components/library/LibraryGridView.tsx` | ✅ |
| Library — shelf page header | `apps/web/src/app/(app)/library/[shelf]/ShelfPageClient.tsx` | ✅ |
| Reader public shelf page | `apps/web/src/app/(app)/reader-library/shelf/page.tsx` | ✅ |
| Add / move to shelf modal | `apps/web/src/components/shelves/ShelfSelectMenu.tsx` | ✅ |
| Book details — shelf badge | `apps/web/src/components/shelves/ShelfBadge.tsx` | ✅ |
| Book details — quick shelf buttons | `apps/web/src/components/books/BookShelfActions.tsx` | ✅ |
| Book card shelf badge | `apps/web/src/components/books/BookCard.tsx` | ✅ (via ShelfBadge) |
| Suggested shelf preview bar | `apps/web/src/components/shelves/SuggestedShelfPreviewBar.tsx` | ✅ (via ShelfBadge) |
| Landing preview badges | `apps/web/src/components/landing/PreviewDashboardSection.tsx` | ✅ (via ShelfBadge) |
| Profile — shelf preview | `apps/web/src/components/profile/ProfileShelfPreview.tsx` | ✅ |
| Profile — shelf privacy | `apps/web/src/components/profile/ShelfPrivacyPanel.tsx` | ✅ |
| Reading Room — overview tabs | `apps/web/src/components/reading-room/ReadingRoomTabs.tsx` | ✅ |
| Reading Room — section helper | `apps/web/src/components/reading-room/ReadingRoomSection.tsx` | ✅ |
| Library service | `apps/web/src/lib/services/library.ts` | ✅ |
| Saved-book bookmark overlay hook | `apps/web/src/components/books/SavedBookBadge.tsx` | ✅ |
| Unit tests | `apps/web/src/lib/constants/shelfIcons.test.ts` | ✅ |
| Custom shelf collections | `CustomShelfSection.tsx`, create/edit pickers | ✅ `icon_key` + fallback |
| Book cover placeholder | `BookCover.tsx` | ⬜ N/A — not a shelf icon |
| Message reaction emoji picker | `messageReactions.ts` | ⬜ N/A — unrelated emoji UI |

## Mobile

| Location | File | Updated |
|----------|------|---------|
| Shelf config | `apps/mobile/src/constants/shelves.ts` | ✅ |
| Central icon config | `apps/mobile/src/constants/shelfIcons.ts` | ✅ |
| ShelfIcon component | `apps/mobile/src/components/ShelfIcon.tsx` | ✅ |
| ShelfTitleRow component | `apps/mobile/src/components/ShelfTitleRow.tsx` | ✅ |
| SectionCard (shelfIconId prop) | `apps/mobile/src/components/SectionCard.tsx` | ✅ |
| Library — bookshelf sections | `apps/mobile/src/components/library/BookshelfSection.tsx` | ✅ |
| Library — grid view | `apps/mobile/src/components/library/LibraryGridView.tsx` | ✅ |
| Library — index | `apps/mobile/app/(app)/library/index.tsx` | ✅ |
| Library — shelf detail | `apps/mobile/app/(app)/library/[shelf].tsx` | ✅ |
| Reader public library | `apps/mobile/app/(app)/reader/[username]/library/index.tsx` | ✅ |
| Reader public shelf | `apps/mobile/app/(app)/reader/[username]/library/[shelf].tsx` | ✅ |
| Search — add-to-shelf sheet | `apps/mobile/app/(app)/search.tsx` | ✅ |
| Book details — shelf toggles | `apps/mobile/app/(app)/book/[id].tsx` | ✅ |
| Saved pill | `apps/mobile/src/components/SavedPill.tsx` | ✅ |
| Profile — shelf preview | `apps/mobile/src/components/ProfileShelfPreview.tsx` | ✅ |
| Shelf privacy | `apps/mobile/app/(app)/shelf-privacy.tsx` | ✅ |
| Reading Room — overview | `apps/mobile/app/(app)/index.tsx` | ✅ |
| All-books tabs | `apps/mobile/app/(app)/library/my-books.tsx` | ✅ |
| Library service | `apps/mobile/src/services/library.ts` | ✅ |
| Saved-book bookmark overlay hook | `apps/mobile/src/components/SavedBookBadge.tsx` | ✅ |
| Unit tests | `apps/mobile/src/constants/shelves.test.ts` | ✅ |
| Custom shelf sections | `CustomShelfSection.tsx`, `custom.tsx`, shelf-privacy | ✅ `icon_key` + fallback |
| Club cards / feed | `ClubCard.tsx`, etc. | ⬜ N/A — not built-in shelf icons |

## Bookmark overlay ✅

Purple B ribbon with larger sparkles (`11.png`):

- **Web:** `apps/web/public/assets/branding/bookmarked-saved-badge.png` → `SavedBookBadge`
- **Mobile:** `apps/mobile/assets/branding/bookmarked-saved-badge.png` → `SavedBookBadge`

Aspect ratio updated to `441/547`; sparkles use `overflow: visible` so they are not clipped.
