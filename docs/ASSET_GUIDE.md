# Asset Guide — Shelf Icons & Branding

## Shelf icons

### Locations

| Platform | Optimized assets | Source copies |
|----------|------------------|---------------|
| Web | `apps/web/public/assets/shelves/` | `apps/web/public/assets/shelves/source/` |
| Mobile | `apps/mobile/assets/shelves/` | `apps/mobile/assets/shelves/source/` |

Web URLs are served at `/assets/shelves/<name>.png`.

### Filenames

| File | Maps from design source | DB / product |
|------|-------------------------|--------------|
| `want-to-read.png` | `8.png` | `want_to_read` |
| `currently-reading.png` | `5.png` | `currently_reading` |
| `finished.png` | `7.png` | `read` → label **Finished** |
| `did-not-finish.png` | `6.png` | `dnf` flag → label **Did Not Finish** |

Do **not** use `read.png` or `dnf.png` as filenames.

## Branding assets

### Locations

| Platform | Runtime assets | Approved source |
|----------|----------------|-----------------|
| Web | `apps/web/public/assets/branding/` | `design-assets/approved/` |
| Mobile | `apps/mobile/assets/branding/` | `design-assets/approved/` |

Web URLs: `/assets/branding/bookmarked-logo-horizontal.png`, `/assets/branding/bookmarked-saved-badge.png`

### Filenames

| File | Design source | Component |
|------|---------------|-----------|
| `bookmarked-logo-horizontal.png` | `NEW LOGO.png` | `BookmarkedLogo` |
| `bookmarked-saved-badge.png` | `11.png` | `SavedBookBadge` |

### Config & components

- Web: `apps/web/src/lib/constants/brandAssets.ts` → `BRAND_ASSETS`
- Mobile: `apps/mobile/src/constants/brandAssets.ts` → `BRAND_ASSETS`
- Size tokens: `small` / `medium` / `large`

### Derived assets (not in `assets/branding/`)

| Asset | Web | Mobile |
|-------|-----|--------|
| B mark (compact nav) | `logo-mark.png` | `assets/brand/logo-mark.png` |
| Splash / adaptive | `logo-circle.png` | `assets/brand/logo-circle.png` |
| App icon | `icon.png` | `assets/brand/icon.png` |

Regenerate branding:

```bash
cd apps/web
node scripts/process-brand-assets.mjs
node scripts/generate-social-images.mjs
```

See `docs/BRANDING_ASSET_AUDIT.md` for the full audit and `docs/SHELF_ICON_AUDIT.md` for component wiring.
