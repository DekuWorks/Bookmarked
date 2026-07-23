# Branding Asset Audit

**Date:** 2026-07-23  
**Baseline:** commit `30df18c` (initial wordmark + ribbon refresh)  
**Spec:** Tasks 1–24 — normalized paths, centralized config, shared components

## Source assets (approved)

| Design file | Repo backup | Purpose |
|-------------|-------------|---------|
| `NEW LOGO.png` | `design-assets/approved/NEW LOGO.png` | Horizontal BOOKMARKED wordmark |
| `11.png` | `design-assets/approved/11.png` | Saved-book badge (lavender ribbon, purple B, large sparkles) |

## Runtime asset paths (normalized)

| Asset | Web | Mobile |
|-------|-----|--------|
| Horizontal wordmark | `apps/web/public/assets/branding/bookmarked-logo-horizontal.png` | `apps/mobile/assets/branding/bookmarked-logo-horizontal.png` |
| Saved-book badge | `apps/web/public/assets/branding/bookmarked-saved-badge.png` | `apps/mobile/assets/branding/bookmarked-saved-badge.png` |

Web URLs: `/assets/branding/bookmarked-logo-horizontal.png`, `/assets/branding/bookmarked-saved-badge.png`

### Derived assets (unchanged role)

| Asset | Web | Mobile | Notes |
|-------|-----|--------|-------|
| B mark (compact nav) | `logo-mark.png` | `assets/brand/logo-mark.png` | Derived from `11.png` |
| Splash / adaptive | `logo-circle.png` | `assets/brand/logo-circle.png` | B mark on `#FCFAFE` |
| App icon | `icon.png` | `assets/brand/icon.png` | **Not regenerated** — no new square source provided |
| Favicon | `favicon.ico`, `favicon-32x32.png` | `assets/favicon.png` | Touch icons regenerated from B mark |

## Gap vs `30df18c`

| Item | `30df18c` state | Spec target | Status |
|------|-----------------|-------------|--------|
| Asset paths | `logo.png`, `bookmark-ribbon.png` | `assets/branding/bookmarked-*.png` | ✅ Migrated |
| Source backup | `*/source/` copies | `design-assets/approved/` | ✅ Migrated |
| Config | Inline aspect ratios in components | `BRAND_ASSETS` (web + mobile) | ✅ Added |
| Logo component | `BrandLogo` | `BookmarkedLogo` with size tokens + fallback | ✅ Replaced |
| Badge component | `BookmarkRibbon` / `BookmarkedShelfBadge` | `SavedBookBadge` with size tokens | ✅ Replaced |
| Size tokens | `sm`/`md`/`lg` (web), px (mobile) | `small`/`medium`/`large` | ✅ Unified |
| Error fallback | None | Text "Bookmarked" (no emoji) | ✅ Added |
| A11y | Partial | `aria-label` / `accessibilityLabel` on badge | ✅ Added |
| Dark mode | None | `dark:brightness-110` on wordmark | ✅ Added |
| Tests | None | `brandAssets.test.ts` (web + mobile) | ✅ Added |
| Audit doc | None | This file | ✅ Created |
| Old assets removed | N/A | `logo.png`, `bookmark-ribbon.png` old paths | ✅ Removed |

## Component wiring

| Surface | Component | Asset |
|---------|-----------|-------|
| Web nav | `BookmarkedLogo` | `bookmarked-logo-horizontal.png` |
| Web book covers / spines | `SavedBookBadge` | `bookmarked-saved-badge.png` |
| Mobile auth / headers | `BookmarkedLogo` | `bookmarked-logo-horizontal.png` |
| Mobile book covers / spines | `SavedBookBadge` | `bookmarked-saved-badge.png` |

Save/unsave logic is unchanged — badge renders only when parent passes `saved` / `bookmarked`.

## Optimization

- Trimmed with sharp, PNG compression level 9
- Wordmark: 814×181 RGBA
- Saved badge: 441×547 RGBA (sparkles preserved via `overflow: visible` on parents)
- Regenerate: `node apps/web/scripts/process-brand-assets.mjs`

## Email / OG audit

| Channel | Asset used | Status |
|---------|------------|--------|
| OG default card | `og-share.png` (B mark from `logo-mark.png`) | ✅ Unchanged |
| Share preview edge fn | `logo-mark.png` footer | ✅ Unchanged |
| Supabase auth emails | Supabase-hosted templates (no custom logo embedded) | ✅ N/A |
| Browser notifications | `favicon.ico` | ✅ Unchanged |

## Verification checklist

- [x] Transparent PNGs on wordmark and badge
- [x] Web + mobile path parity
- [x] No CSS/text recreation of logo
- [x] Sparkle overflow not clipped on covers
- [x] App icon not regenerated without new square source
- [x] Unit tests for config and size tokens
