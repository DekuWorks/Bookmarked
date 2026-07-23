# Asset Guide — Shelf Icons

## Locations

| Platform | Optimized assets | Source copies |
|----------|------------------|---------------|
| Web | `apps/web/public/assets/shelves/` | `apps/web/public/assets/shelves/source/` |
| Mobile | `apps/mobile/assets/shelves/` | `apps/mobile/assets/shelves/source/` |

Web URLs are served at `/assets/shelves/<name>.png`.

## Filenames

| File | Maps from design source | DB / product |
|------|-------------------------|--------------|
| `want-to-read.png` | `8.png` | `want_to_read` |
| `currently-reading.png` | `5.png` | `currently_reading` |
| `finished.png` | `7.png` | `read` → label **Finished** |
| `did-not-finish.png` | `6.png` | `dnf` flag → label **Did Not Finish** |

Do **not** use `read.png` or `dnf.png` as filenames.

## Optimization

- Source PNGs (1024×1024) live in each `source/` folder.
- Shipped assets are 256×256 RGBA, `object-fit: contain` at display time.
- Re-optimize with sharp when replacing art:

```bash
cd apps/web
node -e "
const sharp = require('sharp');
const fs = require('fs');
const map = [['8.png','want-to-read.png'],['5.png','currently-reading.png'],['7.png','finished.png'],['6.png','did-not-finish.png']];
const SRC = '/path/to/Shelf Icon Designs';
for (const [src, dest] of map) {
  for (const base of ['public/assets/shelves', '../mobile/assets/shelves']) {
    fs.copyFileSync(\`\${SRC}/\${src}\`, \`\${base}/source/\${dest}\`);
    sharp(\`\${SRC}/\${src}\`).resize(256,256,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png({compressionLevel:9}).toFile(\`\${base}/\${dest}\`);
  }
}
"
```

Copy optimized files to **both** web and mobile paths to keep parity.

## Bookmark overlay

Saved-book ribbon (not a shelf icon):

| Platform | Optimized | Source |
|----------|-----------|--------|
| Web | `apps/web/public/images/bookmark-ribbon.png` | `apps/web/public/images/source/bookmark-ribbon.png` |
| Mobile | `apps/mobile/assets/brand/bookmark-ribbon.png` | `apps/mobile/assets/brand/source/bookmark-ribbon.png` |

- Design source: `11.png` (purple B ribbon with larger sparkles).
- Trimmed shipped size: 441×547 RGBA; aspect `441/547` in `BookmarkedShelfBadge` / `BookmarkRibbon`.
- Re-optimize with `node apps/web/scripts/process-brand-assets.mjs` (set `BRAND_SRC` to the design folder).

## Logo / wordmark

| Asset | Web | Mobile | Notes |
|-------|-----|--------|-------|
| Full wordmark | `apps/web/public/logo.png` | `apps/mobile/assets/brand/logo.png` | `NEW LOGO.png` → 814×181 trimmed |
| B mark (icon) | `apps/web/public/logo-mark.png` | `apps/mobile/assets/brand/logo-mark.png` | Derived from `11.png` |
| Splash / adaptive | `apps/web/public/logo-circle.png` | `apps/mobile/assets/brand/logo-circle.png` | B mark on `#FCFAFE` |
| App / favicon | `icon.png`, `favicon-32x32.png`, `apple-touch-icon.png` | `icon.png`, `apple-touch-icon.png` | Generated from logo-mark |

Source copies: `apps/web/public/assets/brand/source/` and `apps/mobile/assets/brand/source/`.

Regenerate all brand assets:

```bash
cd apps/web
node scripts/process-brand-assets.mjs
node scripts/generate-social-images.mjs
```

See `docs/SHELF_ICON_AUDIT.md` for component wiring.
