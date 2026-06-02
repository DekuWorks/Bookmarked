# Bookmarked — UI Context

## Brand Feeling

Bookmarked should feel:

- **Cozy** — Warm, inviting, like a favorite reading nook
- **Modern** — Clean typography, thoughtful spacing, no clutter
- **Reader-focused** — Books and reading progress are the hero
- **Bookstore inspired** — Subtle literary warmth, not corporate
- **Warm and clean** — Soft backgrounds, readable contrast
- **Social but not overwhelming** — Reviews and activity without noise

---

## Color Palette

### Primary

| Name | Hex | Usage |
|------|-----|-------|
| **Primary Purple** | `#B89DBB` | Main brand color, buttons, accents, links |

### Secondary

| Name | Hex | Usage |
|------|-----|-------|
| **Puce Red** | `#642F37` | Headers, footer, strong text accents |
| **Rust** | `#C0350F` | Alerts, emphasis, secondary CTAs |
| **Royal Orange** | `#F3904B` | Highlights, badges, warm accents |
| **Orange-Yellow** | `#F7C767` | Soft highlights, gradients, decorative warmth |

See `DESIGN_SYSTEM.md` for CSS token names.

---

## UI Rules

1. **Purple is the main brand color** — Primary actions, brand marks, key accents
2. **Warm orange tones for highlights** — Badges, progress, featured elements
3. **Dark red/burgundy for headers and footer** — Puce red (`#642F37`) grounds the layout
4. **Clean cards for books** — Rounded corners, soft shadow or border, cover image prominent
5. **Rounded corners** — Cards, buttons, inputs use consistent radius (e.g. `rounded-xl`)
6. **Soft, readable spacing** — Generous padding; avoid cramped layouts
7. **Mobile-first, desktop-supported** — Design for small screens first; expand grids and nav on `md`/`lg`

---

## Layout Patterns

- **Landing** — Full-width sections, hero with CTA to sign up / dashboard
- **App shell** — Navbar (logged in) with links to dashboard, library, search, profile
- **Dashboard** — Card grid for stats, current reads, recent activity
- **Library** — Shelf tabs or filters; book grid
- **Book detail** — Cover + metadata + shelf actions + reviews

---

## Typography

- Use system or web-safe sans-serif stack (Tailwind defaults or extended font in theme)
- Headings: semibold/bold, puce or dark neutral
- Body: comfortable line height for long review text

---

## Do Not

- Hardcode hex colors in components — use design tokens (`bg-primary`, `text-puce-red`, etc.)
- Overuse gradients or decorative elements — keep focus on content
- Clutter navigation — keep primary paths obvious (Library, Search, Dashboard)
