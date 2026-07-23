# Shelf Icon Audit

Custom PNG shelf icons replace emoji for the four built-in shelf states. Mapping (product order, DB IDs unchanged):

| Shelf | DB / icon ID | Asset | Old emoji |
|-------|----------------|-------|-----------|
| Want to Read | `want_to_read` | `want-to-read.png` (source `8.png`) | 📚 |
| Currently Reading | `currently_reading` | `currently-reading.png` (source `5.png`) | 📖 |
| Finished / Read | `read` | `read.png` (source `7.png`) | ✅ |
| Did Not Finish | `dnf` | `dnf.png` (source `6.png`) | — |

**Config:** `apps/web/src/lib/constants/shelfIcons.ts` · `apps/mobile/src/constants/shelfIcons.ts`  
**Assets:** `apps/web/public/images/shelves/` · `apps/mobile/assets/shelves/`  
**Components:** `ShelfIcon` · `ShelfTitleRow` (web + mobile)

## Web

| Location | File | Updated |
|----------|------|---------|
| Shelf config (removed emoji field) | `apps/web/src/lib/constants/shelves.ts` | ✅ |
| Central icon config | `apps/web/src/lib/constants/shelfIcons.ts` | ✅ |
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
| Library service (removed emoji from ShelfGroup) | `apps/web/src/lib/services/library.ts` | ✅ |
| Saved-book bookmark overlay hook | `apps/web/src/components/books/BookmarkedShelfBadge.tsx` | ✅ (doc only) |
| Custom shelf collections (generic 📚) | `CustomShelfSection.tsx`, `CustomShelfCollectionsPanel.tsx`, `AddToCustomShelfMenu.tsx`, `SuggestedShelvesPanel.tsx`, `library/custom/page.tsx` | ⬜ N/A — custom shelves, not built-in |
| Book cover placeholder (no cover image) | `apps/web/src/components/books/BookCover.tsx` | ⬜ N/A — not a shelf icon |
| Message reaction emoji picker | `messageReactions.ts` | ⬜ N/A — unrelated emoji UI |

## Mobile

| Location | File | Updated |
|----------|------|---------|
| Shelf config (removed emoji field) | `apps/mobile/src/constants/shelves.ts` | ✅ |
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
| Book details — DNF action | `apps/mobile/app/(app)/book/[id].tsx` | ✅ |
| Saved pill | `apps/mobile/src/components/SavedPill.tsx` | ✅ |
| Profile — shelf preview | `apps/mobile/src/components/ProfileShelfPreview.tsx` | ✅ |
| Profile — library link | `apps/mobile/app/(app)/profile.tsx` | ✅ |
| Shelf privacy | `apps/mobile/app/(app)/shelf-privacy.tsx` | ✅ |
| Reading Room — overview | `apps/mobile/app/(app)/index.tsx` | ✅ |
| Library service (removed emoji from ShelfGroup) | `apps/mobile/src/services/library.ts` | ✅ |
| Saved-book bookmark overlay hook | `apps/mobile/src/components/BookmarkRibbon.tsx` | ✅ (doc only) |
| All-books list DNF tab (text label) | `apps/mobile/app/(app)/library/my-books.tsx` | ⬜ Text tab only; DNF icon used on book detail |
| Custom shelf sections (generic 📚) | `shelf-privacy.tsx` custom rows | ⬜ N/A — custom shelves |
| Club cards / feed (generic 📚) | `ClubCard.tsx`, etc. | ⬜ N/A — not built-in shelf icons |

## Bookmark overlay (pending asset)

When the larger-sparkles bookmark ribbon is approved, drop the new PNG in:

- **Web:** `apps/web/public/images/bookmark-ribbon.png`
- **Mobile:** `apps/mobile/assets/brand/bookmark-ribbon.png`

Components `BookmarkedShelfBadge` (web) and `BookmarkRibbon` (mobile) read from those paths — no code changes required.
