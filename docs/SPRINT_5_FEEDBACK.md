# Sprint 5 — Final Feedback Fixes

Status: implemented on web + native iOS (Aug 2026).

## Feed

| Fix | Status | Notes |
|-----|--------|-------|
| Like sparkles more prominent | ✅ | `BookmarkedLikeSparkles` — brand lilac/lavender 4-point sparkles; like-only |
| Reduced-motion | ✅ | No particles; brief Like button glow/scale |
| Discovery card equal heights | ✅ | `DiscoveryBookCard` reserved rows for rating/preview/tags/action |
| Overflow for sparkles | ✅ | Like wrappers use `overflow: visible` |

## Component API

```tsx
<BookmarkedLikeSparkles active={showAnimation} />
```

`showAnimation` is true only on unliked → liked. Compatibility re-export: `LikeSparkles.tsx`.
