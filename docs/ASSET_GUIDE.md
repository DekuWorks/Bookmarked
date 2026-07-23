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

## Bookmark overlay (separate)

Saved-book ribbon (not a shelf icon):

- Web: `apps/web/public/images/bookmark-ribbon.png` → `BookmarkedShelfBadge`
- Mobile: `apps/mobile/assets/brand/bookmark-ribbon.png` → `BookmarkRibbon`

See `docs/SHELF_ICON_AUDIT.md` for component wiring.
