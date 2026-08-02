# Web UI Guide — Book Clubs

Community Hub patterns for `apps/web` Book Clubs.

## Navigation

- Desktop: primary navbar → **Book Clubs** (`/clubs/`)
- Mobile web: header **More** → Book Clubs (≤2 taps). Do not hide behind desktop-only nav.
- Preserve existing app chrome — no mockup left sidebar.

## Landing (`ClubsPage`)

Sections: My Clubs · Discover (search + filters + Trending / Clubs Reading Your Books) · Invitations · Join Requests · Upcoming Events shortcut.

## Club detail (`ClubDetailPage`)

Tabs: Overview · Discussions · Schedule · Bookshelf · Members · Stats. Persist via `?tab=` and `?discussion=`.

Header actions: Join/Leave/Request · Invite · Settings (owners edit club; all members set notification level) · Message the Club · Share.

## Schedule

`ClubSchedulePanel` + `ClubCalendar`: List/Calendar switcher, sparkle on event days, RSVP, HTTPS meeting links with Copy/Join.

## Accessibility

- Pill tabs use `role="tab"` / `aria-selected`
- Calendar grid uses `role="grid"` with day `aria-label` including event counts
- Modals use existing `Modal` focus trap
- Prefer `motion-safe:` / respect `prefers-reduced-motion` for decorative motion

## Dark mode

Use semantic tokens (`bg-surface`, `text-text`, `border-border`, `text-puce-red`, `bg-primary/15`). Avoid pure invert.
