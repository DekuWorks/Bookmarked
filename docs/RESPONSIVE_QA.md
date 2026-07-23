# Bookmarked — Responsive QA

> Phase 9 audit (July 2026). Tailwind breakpoints; no device lab required.

---

## Checklist

| Page | Mobile (<768px) | Tablet | Desktop | Status |
|------|-----------------|--------|---------|--------|
| Dashboard | Cards stack; hero readable | 2-col goal/actions | Wide layout | ✅ |
| Reading Room | Tab scroll; gradient full-bleed | Same | Tabs + panels | ✅ |
| Library | Organize panels stack | Grid | Wide shell | ✅ |
| Feed | Pill tabs scroll; single column | Same | Sidebar trending | ✅ Fixed tabs overflow |
| Profile | Gradient header; cards stack | Same | Centered stack | ✅ |
| Messages inbox | List full width | Same | Max-width list | ✅ |
| Message thread | Composer above bottom nav | Same | Sticky composer | ✅ Fixed overlap |
| Search | Hero + form stack | Results grid | Wide results | ✅ |
| Book details | Progress/reviews stack | Same | Two-column sections | ✅ |
| Login / Signup | Centered form panel | Same | Same | ✅ |
| Mobile app — Library | Tab bar spacing | — | — | ✅ Spot-check |
| Mobile app — Feed | Card shadows | — | — | ✅ Spot-check |

Legend: ✅ Pass · 🟡 Minor · 🔴 Blocked

---

## Fixes applied (Phase 9)

### Web

1. **Message thread composer overlap** — `MessageComposer` sticky offset `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]` on mobile so it clears the bottom nav; thread container uses `min-h-[calc(100dvh-10rem)]`.
2. **Feed pill tabs overflow** — Added `overflow-x-auto` and `shrink-0` on feed view/tab pill tabs (matches Reading Room pattern).
3. **Bottom nav safe area** — Already uses `pb-[max(0.5rem,env(safe-area-inset-bottom))]` on `MobileBottomNav`.
4. **App shell padding** — Main content `pb-24 md:pb-10` prevents content hidden behind bottom nav.
5. **Modals** — `Modal` uses bottom-sheet on mobile (`items-end`, `rounded-t-2xl`, `max-h-[90vh]`).
6. **Premium upgrade (mobile web)** — `/upgrade/` surface card uses `p-4 sm:p-6`; subscribe CTA full-width on narrow viewports.
7. **Pill tabs** — `min-height: 44px`, horizontal scroll with hidden scrollbar; `.pill-tab.shrink-0` no longer stretches in scroll rows.
8. **Premium lock CTA** — upgrade button `w-full max-w-xs` on mobile for tap targets.

### Mobile (Expo)

- Library uses `TAB_BAR_SPACE` + safe area insets for scroll padding
- `ScreenGradientWash` on library; card shadows on feed posts (Phase 5)
- No new layout regressions found in spot-check

---

## Tap targets

| Component | Min size | Status |
|-----------|----------|--------|
| Mobile bottom nav links | 48px height | ✅ |
| Modal close button | 44×44px | ✅ |
| Navbar drawer links | 44px height | ✅ |
| Pill tabs | Padding + flex | ✅ |

---

## Known minor issues (deferred)

| Issue | Notes |
|-------|-------|
| Desktop nav has 8+ links | Acceptable; bottom nav on mobile covers primary IA |
| Feed trending sidebar hidden on mobile | By design; mobile trending on For You feed |
| Very long usernames in headers | `truncate` not applied everywhere |
| Club pages not in bottom nav | Direct URL / desktop nav only |

---

## Test plan (manual)

- [ ] iPhone SE width (375px): feed tabs scroll, message composer visible
- [ ] Message thread: send text + image attachment
- [ ] Login/signup forms fit without horizontal scroll
- [ ] Book detail: progress panel and review form usable
- [ ] Modal open/close on small screen (create shelf, new message)

---

## Related docs

- `docs/ui/DESIGN_SYSTEM.md` — breakpoints and tokens
- `docs/PROJECT_PROGRESS.md` — phase tracker

**Last updated:** July 2026
