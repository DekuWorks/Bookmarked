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

- User avatar + name, star rating, review excerpt
- Spoiler warning badge when `has_spoilers`
- Timestamp, link to full review

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
- Links: Dashboard, Library, Search, Profile
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

- Overlay + centered panel
- Close button, title, children
- Used for confirm actions, quick forms

---

## Usage Rules

1. Import UI from `@/components/ui/*` — do not duplicate button/input styles
2. Feature components compose UI primitives
3. All colors via Tailwind theme keys (`text-primary`, `bg-puce-red`, etc.)
4. Keep components under ~300 lines; split if larger
