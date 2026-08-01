# Feed Components

## BookmarkedLikeSparkles

- **Web:** `apps/web/src/components/social/BookmarkedLikeSparkles.tsx` (+ CSS in `globals.css`)
- **iOS:** `apps/mobile/src/components/BookmarkedLikeSparkles.tsx` (Reanimated)
- **Compat:** `LikeSparkles.tsx` re-exports for Metro/bundler
- Props: `active` (boolean) — play burst only when liking
- `pointer-events: none`; reduced-motion skips particles

## DiscoveryBookCard

- **Web:** `apps/web/src/components/social/DiscoveryBookCard.tsx`
- Used by `FeedDiscoveryCard`
- Helpers: `packages/utils/discoveryCard.ts`
- Equal-height rows: cover → title → author → rating summary → review preview → tags → metric

## FeedDiscoveryCard

- **Web:** `apps/web/src/components/social/FeedDiscoveryCard.tsx`
- **iOS:** `apps/mobile/src/components/FeedDiscoveryCard.tsx`
- Interleaved via `interleaveFeedWithDiscovery`
