# Bookmarked — AI Workflow Rules

Rules for AI assistants and developers working on Bookmarked. Follow these on every change.

---

## Stack & Style

- **Always use TypeScript** — No plain JavaScript for app code
- **Always use Tailwind CSS** — No inline styles or ad-hoc CSS modules unless documented exception
- **Never hardcode colors** in components — Use design tokens from `DESIGN_SYSTEM.md` / Tailwind theme
- **Mobile-first responsive design** — Base styles for mobile; `md:` / `lg:` for larger screens

---

## Code Organization

- **Keep components reusable** — UI in `components/ui/`, feature logic in feature folders
- **Keep files clean and organized** — One main export per file when practical
- **Keep components under 300 lines** when possible — Split into subcomponents or hooks
- **Use clear naming** for folders, files, and components (PascalCase components, kebab or camel for utilities)

---

## Architecture

- **Keep Supabase logic inside services** — `lib/supabase/` for clients; `lib/services/` or similar for queries/mutations
- **Do not put raw Supabase calls in page components** — Use hooks or server actions that call services
- **Use shared types** from `packages/types` when they match the schema

---

## Phase Discipline

- **Follow the current phase only** — See [Master Task List](../project/MASTER_TASK_LIST.md) and [Progress Tracker](../progress/PROGRESS_TRACKER.md)
- **Do not add unrequested future features** — No messaging, AI, premium, or social v2 unless asked
- **Build web app first before mobile app** — Phases 0–2 complete; Phase 3 (mobile foundation) is next

---

## Documentation

- Update `PROGRESS_TRACKER.md` when completing checklist items
- Prefer extending existing docs over creating new doc files
- Architecture and UI decisions should align with `ARCHITECTURE_CONTEXT.md` and `UI_CONTEXT.md`

---

## Git & Quality

- Match existing patterns in the file you edit
- Minimal scope per change — no drive-by refactors
- Run lint/build for web before marking tasks done when feasible

---

## Quick Reference

| Do | Don't |
|----|-------|
| `className="bg-primary"` | `style={{ background: '#B89DBB' }}` |
| `lib/services/books.ts` | Supabase in `page.tsx` |
| Web MVP features | Mobile Expo features in Phase 1 |
| Check progress tracker | Assume all phases active |
