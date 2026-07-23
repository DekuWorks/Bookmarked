# Mobile UI Guide — Shelf Icons

## Usage

Import `ShelfIcon` from `src/components/ShelfIcon` and pass a `ShelfIconId`:

```tsx
import { ShelfIcon } from "../components/ShelfIcon";

<ShelfIcon id="want_to_read" size="medium" />
<ShelfIcon id="read" size="small" labeled />
<ShelfIcon id="dnf" size="small" />
```

Use `ShelfTitleRow` for header rows with icon + title.

## Sizes

| Prop | px | When |
|------|-----|------|
| `small` | 28 | Badges, book detail toggles, privacy rows |
| `medium` | 56 | Section cards, search sheet, reading room |
| `large` | 128 | Full-width shelf headers (rare on mobile) |

## Labels

User-visible copy must say **Finished** (not "Read") and **Did Not Finish** (not "DNF") for built-in shelves. DB field `shelf_status: "read"` is unchanged.

## Assets

Bundled via `require()` in `src/constants/shelfIcons.ts` from `assets/shelves/`. After art updates, run the optimization flow in `docs/ASSET_GUIDE.md` and update both platforms.

## Loading

`ShelfIcon` shows a neutral placeholder while the image loads or on error — no emoji fallbacks.

## Order

Use `getShelvesInOrder()` from `src/constants/shelves` when mapping `SHELF_CONFIG`. DNF is a separate `dnf` icon id (not a `ShelfStatus`).

## Tests

```bash
cd apps/mobile && npm test
```

Covers shelf order, Finished label, and DNF icon ordering.
