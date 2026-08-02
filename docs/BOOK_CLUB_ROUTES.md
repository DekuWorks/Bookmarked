# Book Club Routes

## Web (`apps/web`)

| Route | File | Purpose |
|-------|------|---------|
| `/clubs/` | `app/(app)/clubs/page.tsx` → `ClubsPage` | Landing: My Clubs, Discover, Invitations, etc. |
| `/clubs/club/?id=` | `app/(app)/clubs/club/page.tsx` → `ClubDetailPage` | Individual club hub |
| `/events/` | `app/(app)/events/page.tsx` | Cross-club upcoming events |

Helpers: `src/lib/routes/clubs.ts` (`clubsPath`, `clubDetailPath`, `eventsPath`).

### Navigation

| Surface | Book Clubs |
|---------|------------|
| Desktop navbar | Primary link `/clubs/` |
| Mobile bottom tabs | Not present (Home, Feed, Search, Messages, Profile) |
| Mobile header More | Book Clubs + Events (≤2 taps) |
| Profile | Wire `ProfileClubsSection` |

Target: keep Clubs in More; do not add mockup left sidebar. Optional deep links for discussion/event query params (`?tab=discussions`, `?tab=schedule`).

## iOS (`apps/mobile`)

| Route | File | Purpose |
|-------|------|---------|
| `/(app)/clubs` | `app/(app)/clubs/index.tsx` | Landing |
| `/(app)/clubs/[id]` | `app/(app)/clubs/[id].tsx` | Club hub |
| `/(app)/clubs/new` | `app/(app)/clubs/new.tsx` | Create club |
| `/(app)/events` | `app/(app)/events.tsx` | Community events |

Stack: `app/(app)/clubs/_layout.tsx`.

### Navigation entry points

1. Profile → Book Clubs  
2. Messages → Book Clubs segment  
3. Search → Clubs mode  
4. Feed → Book Clubs tab (discussion cards)  
5. Deep link `/clubs/[id]`

Clubs remain a hidden tab (`href: null`) — not a primary FloatingTabBar item. Preserve existing Bookmarked nav.

## Target route additions (query/hash, not new path trees)

| Param | Use |
|-------|-----|
| `?tab=overview\|discussions\|schedule\|bookshelf\|members\|stats` | Persist selected club tab |
| `?discussion=` | Open discussion thread |
| `?event=` | Open event detail |
| Messages | Club group conversation via existing `/messages/[id]` after link created |

## Out of scope

- Android routes  
- Mockup left-side club navigation  
- Replacing primary app nav with club-only chrome  
