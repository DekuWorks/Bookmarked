# Bookmarked — Performance Audit

> Phase 6 quick wins (July 2026). Focused improvements only — no over-engineering.

---

## Summary

| Area | Status | Action taken |
|------|--------|--------------|
| Bundle size | ✅ Quick win | `GifSearchPicker` lazy-loaded via `GifSearchPickerLazy.tsx` in composer/comment/message flows |
| Images | ✅ Quick win | `BookCover` uses `loading="lazy"` when not `priority` |
| Feed hydration N+1 | ✅ Fixed | `hydrateFeedItems` uses Maps instead of nested item×row loops |
| Feed/posts pagination | ✅ Verified | `fetchFollowingFeed` / `fetchForYouFeed` limit 30; `listFeedPosts` limit 30 |
| Messages pagination | ✅ Quick win | `getMessages` capped at 200 most recent (cursor pagination deferred) |
| Library fetch | ⚪ Deferred | Full library load is intentional for shelf grouping; virtualize if libraries grow large |
| Memoization | ✅ Quick win | `FeedCard` wrapped in `React.memo` |
| Loading states | ✅ Quick win | Feed posts/activity use skeleton placeholders instead of blank spinners |
| Code splitting | ✅ Partial | Gif picker split; route-level splitting limited by static export |

---

## Bundle — Gif picker lazy load

**Before:** `GifSearchPicker` (Giphy API client + grid UI) imported statically in `PostComposer`, `MessageComposer`, `CommentAttachmentControls`, and `PostEditPanel`.

**After:** Shared `GifSearchPickerLazy.tsx` uses `next/dynamic` with `ssr: false`. Giphy code loads only when a user opens the picker.

**Remaining:** `QuoteRepostModal`, club modals, and chart panels are still static. Split if bundle analysis shows them in the critical path.

---

## Images — Book covers

`BookCover` passes `loading="lazy"` to Next `Image` unless `priority` is set (hero/detail covers). Combined with `sizes` hints and `unoptimized` (GitHub Pages constraint), covers defer off-screen loads.

**Remaining:** No CDN resizing while `images.unoptimized: true`. Consider Supabase image transforms or a cover proxy if LCP regresses.

---

## Database — Feed hydration

**Issue:** `hydrateFeedItems` nested loops over feed items × `user_books`/`reviews` query results — O(n×m) per batch.

**Fix:** Build `Map<id, book_id>` from query results, then single pass over items.

**Verified OK:**
- `attachProfilesToActivity` — one profile query per batch (not N+1)
- `listFeedPosts` — joins author in one query via `hydratePosts`

**Watch:** `getUserLibraryBooks` loads entire library with no limit. Acceptable for typical libraries; add pagination/virtualization if users exceed ~500 books.

---

## Pagination

| Endpoint | Limit | Notes |
|----------|-------|-------|
| `fetchForYouFeed` | 30 (fetches 80, filters) | OK |
| `fetchFollowingFeed` | 30 | OK |
| `listFeedPosts` | 30 | OK |
| `getMessages` | 200 | **New cap** — older messages need cursor pagination |
| `getUserLibraryBooks` | none | By design |

---

## Memoization

- `FeedCard` — `React.memo` (stable props from parent list keys)
- `PostCard` — not memoized (frequent realtime/like state updates; marginal gain)

---

## Loading UX

Feed page shows `PostCardSkeleton` / `FeedCardSkeleton` (3 placeholders) while data loads instead of centered text spinners.

**Remaining:** Search results, Reading Room tabs, and messages inbox still use `LoadingState` text.

---

## Static export constraints

- No Next.js route-level `dynamic()` for pages
- No server components or ISR
- Client-side data fetch on every navigation (`AppNavLink` full reload)

These architectural limits dominate perceived performance more than micro-optimizations. See `TECHNICAL_DEBT.md` → Static export.

---

## Recommended next steps (not in scope)

1. Cursor-based message history ("Load earlier messages")
2. Feed infinite scroll / `loadMore` with offset cursors
3. Virtualized library grid (`@tanstack/react-virtual`)
4. Bundle analyzer pass (`@next/bundle-analyzer`) after dependency audit
5. Migrate hosting to enable SSR + image optimization

**Last updated:** July 2026
