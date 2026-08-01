# Design System — Shelf Icons

Built-in reading shelves share a single visual language across web and mobile.

## Shelf identity

| Product label | DB `shelf_status` / flag | Icon asset | Sort |
|---------------|--------------------------|------------|------|
| Want to Read | `want_to_read` | `want-to-read.png` | 1 |
| Currently Reading | `currently_reading` | `currently-reading.png` | 2 |
| Finished | `read` | `finished.png` | 3 |
| Did Not Finish | `dnf` (boolean on `user_books`) | `did-not-finish.png` | 4 |

DB IDs are unchanged. `read` maps to the **Finished** label and `finished.png`; the `dnf` flag maps to **Did Not Finish** and `did-not-finish.png`.

## Components

| Platform | Component | Config |
|----------|-----------|--------|
| Web | `ShelfIcon`, `ShelfTitleRow`, `ShelfBadge` | `apps/web/src/lib/constants/shelfIcons.ts` |
| Mobile | `ShelfIcon`, `ShelfTitleRow`, `SavedPill` | `apps/mobile/src/constants/shelfIcons.ts` |

Always use `ShelfIcon` (or wrappers) instead of inline emoji or raw `<img>` tags for built-in shelves.

## Sizes

| Token | Pixel size | Frame | Use |
|-------|------------|-------|-----|
| `small` | 34px | 34px | Badges, pills, compact lists |
| `medium` | 68px | 68px | Section headers, library grids |
| `large` | 152px | 152px | Shelf page heroes |

Icons are borderless (transparent, no tile chrome) with `object-fit: contain`. Loading states use a transparent pulse placeholder — never emoji.

## Accessibility

- Decorative icons: default (`labeled={false}`, `aria-hidden` on web).
- Meaningful icons: `labeled={true}` or adjacent visible text; `accessibilityLabel` comes from config.
- Animations respect `prefers-reduced-motion`.

## Dark mode

PNG assets are transparent; web applies `dark:brightness-110` for legibility on dark surfaces.

## Order

Enforce product order everywhere via `getShelvesInOrder()` (status shelves) and `SHELF_ICON_ORDER` / `getShelfIconsInOrder()` (including DNF).
