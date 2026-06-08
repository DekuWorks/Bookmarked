# Bookmarked — Design System

Design tokens and component definitions for the web app. Use these in Tailwind theme extension and CSS variables — never hardcode hex values in components.

---

## Color Tokens

Define in `apps/web/src/app/globals.css`:

```css
:root {
  --color-primary: #B89DBB;
  --color-puce-red: #642F37;
  --color-rust: #C0350F;
  --color-royal-orange: #F3904B;
  --color-orange-yellow: #F7C767;

  --color-background: #FDFBF9;
  --color-surface: #FFFFFF;
  --color-text: #1A1A1A;
  --color-text-muted: #6B6B6B;
  --color-border: #E8E0E4;
}
```

Map in `tailwind.config.ts`:

| Token | Tailwind key | Hex |
|-------|--------------|-----|
| `--color-primary` | `primary` | `#B89DBB` |
| `--color-puce-red` | `puce-red` | `#642F37` |
| `--color-rust` | `rust` | `#C0350F` |
| `--color-royal-orange` | `royal-orange` | `#F3904B` |
| `--color-orange-yellow` | `orange-yellow` | `#F7C767` |

---

## Spacing & Radius

| Token | Value | Usage |
|-------|-------|-------|
| Card radius | `rounded-xl` (12px) | Cards, modals |
| Button radius | `rounded-lg` (8px) | Buttons, inputs |
| Section padding | `py-16 px-4 md:px-8` | Landing sections |
| Card padding | `p-4 md:p-6` | Dashboard, book cards |

---

## Components

### Button

**Path:** `src/components/ui/Button.tsx`

| Variant | Style |
|---------|-------|
| `primary` | `bg-primary text-white` |
| `secondary` | `bg-royal-orange text-white` |
| `outline` | Border primary, transparent bg |
| `ghost` | Text only, hover bg |

Props: `variant`, `size` (`sm` | `md` | `lg`), `loading`, `disabled`, `children`

---

### Input

**Path:** `src/components/ui/Input.tsx`

- Rounded border, focus ring in primary
- Label + error message support
- Types: text, email, password, number, textarea variant

---

### BookCard

**Path:** `src/components/books/BookCard.tsx`

- Cover image (aspect ratio ~2:3), title, author
- Optional: shelf badge, progress bar, rating
- Click navigates to book detail

---

### ShelfBadge

**Path:** `src/components/shelves/ShelfBadge.tsx`

| Status | Label | Color hint |
|--------|-------|------------|
| `want_to_read` | Want to Read | orange-yellow |
| `currently_reading` | Reading | royal-orange |
| `read` | Read | primary |

---

### ReviewCard

**Path:** `src/components/reviews/ReviewCard.tsx`

- Display name, star rating, review excerpt
- Spoiler warning badge when `has_spoilers`; hidden body until "Reveal spoiler"
- Timestamp with `suppressHydrationWarning`

---

### BookCover

**Path:** `src/components/books/BookCover.tsx`

- Cover image with `onError` fallback to gradient placeholder
- Used on book details, reading room, library cards

---

### BookShelfActions

**Path:** `src/components/books/BookShelfActions.tsx`

- Current shelf badge, add/move shelf selector, favorite toggle
- Server actions via `lib/actions/book.ts`

---

### ReadingProgressPanel

**Path:** `src/components/books/ReadingProgressPanel.tsx`

- Current page + total pages inputs, live percent preview, progress bar
- Started / finished date display (set automatically on shelf moves)
- Save progress + Mark as finished actions with loading states

---

### BookReviewSection

**Path:** `src/components/books/BookReviewSection.tsx`

- Star rating, textarea, spoiler toggle, submit/edit/delete own review
- Lists community reviews via `ReviewCard`

---

### ActivityFeed

**Path:** `src/components/dashboard/ActivityFeed.tsx`

- Recent `activity_events` with human-readable copy
- Empty state when no activity yet

---

### ButtonLink / NavbarPublicAuth

**Paths:** `src/components/ui/ButtonLink.tsx`, `src/components/layout/NavbarPublicAuth.tsx`

- `ButtonLink`: styled Next.js link (avoids hydration mismatch)
- `NavbarPublicAuth`: client auth skeleton on public pages until session resolves

---

### EmptyShelfMessage

**Path:** `src/components/library/EmptyShelfMessage.tsx`

- Empty shelf copy + CTA to `/search`

---

### ProgressBar

**Path:** `src/components/ui/ProgressBar.tsx`

- Track: muted border/background
- Fill: gradient or `royal-orange` → `orange-yellow`
- Optional label: `42% · 128 / 300 pages`

---

### DashboardCard

**Path:** `src/components/dashboard/DashboardCard.tsx`

- White surface, rounded-xl, soft border
- Title, optional icon, children slot
- Used for stats, current read, activity snippets

---

### Navbar

**Path:** `src/components/layout/Navbar.tsx`

- Logo / wordmark (primary purple)
- Links: Dashboard, Library, Reading Room, Search, Profile
- Auth: Login / Sign up OR user menu + Logout
- Sticky top, puce-red or white bg depending on context

---

### Footer

**Path:** `src/components/layout/Footer.tsx`

- Background: `puce-red`, text light/cream
- Links: Terms, Privacy, Contact
- Copyright, social placeholders

---

### Modal

**Path:** `src/components/ui/Modal.tsx`

- Overlay + centered panel (bottom sheet on mobile)
- Close button, title, children
- Used for shelf selector, confirm actions

---

## Bookshelf Components

### BookshelfView / BookshelfSection / BookSpine

**Paths:** `src/components/library/BookshelfView.tsx`, `BookshelfSection.tsx`, `BookSpine.tsx`

- Upright book spines on wooden shelf boards (`.bookshelf-board`, `.bookshelf-back`)
- Sections per shelf status: Want to Read, Currently Reading, Read
- Horizontal scroll on narrow viewports
- Hover: spine lifts slightly (`hover:-translate-y-1`)

### LibraryViewShell

**Path:** `src/components/library/LibraryViewShell.tsx`

- Toggle: **Bookshelf View** | **Grid View**
- Persists to `profiles.preferred_library_view` (`bookshelf` | `grid`)
- Default: `bookshelf`

### ShelfSearchFilter

**Path:** `src/components/library/ShelfSearchFilter.tsx`

- Client-side filter by title/author on shelf detail pages
- Sort: Recently added (default), Title, Author — via `lib/utils/shelfSort.ts`
- Empty state when shelf is empty or search has no matches
- Fade-in on mount (`.animate-fade-in`)

---

## Component States

| State | Pattern | Examples |
|-------|---------|----------|
| **Loading** | `Button` `loading` prop; skeleton in `NavbarPublicAuth` | Progress save, review submit, add-to-shelf, logout |
| **Empty** | Dashed border panel + short copy + optional CTA | `EmptyShelfMessage`, `ActivityFeed`, shelf search no-match |
| **Error** | Toast via `ToastProvider`; route `error.tsx` | Book details load failure, action errors |
| **Success** | Toast confirmation after server actions | Shelf move, progress saved, review posted |

---

## Reading Room Components

**Route:** `/reading-room`

| Component | Path | Purpose |
|-----------|------|---------|
| `ReadingRoomSection` | `reading-room/ReadingRoomSection.tsx` | Card wrapper with emoji title |
| `CurrentlyReadingRow` | `reading-room/CurrentlyReadingRow.tsx` | Cover + progress + Continue button |
| `BookMiniGrid` | `reading-room/BookMiniGrid.tsx` | Compact cover grid with empty states |

**Layout:** `.reading-room-bg` gradient, `.animate-fade-in` section entrance

**Sections:** Currently Reading, Recently Finished, Favorites, Reading Stats, Reading Goal (placeholder), Bookshelves quick links

---

## Analytics Components

### AnalyticsGrid

**Path:** `src/components/analytics/AnalyticsGrid.tsx`

**Stats:** Books read, Currently reading, Want to read, Pages read, Reviews written, Avg. rating given

**Optional placeholders:** Reading streak, Favorite genre, Reading goal (`showFuturePlaceholders`)

**Used on:** Dashboard, Library, Reading Room, Profile

### ShelfStatsPanel

**Path:** `src/components/library/ShelfStatsPanel.tsx`

Per-shelf stats on `/library/want-to-read`, `/library/reading`, `/library/read`

---

## Usage Rules

1. Import UI from `@/components/ui/*` — do not duplicate button/input styles
2. Feature components compose UI primitives
3. All colors via Tailwind theme keys (`text-primary`, `bg-puce-red`, etc.)
4. Keep components under ~300 lines; split if larger
