# iOS UI Guide — Book Clubs

Community Hub patterns for `apps/mobile` Book Clubs.

## Navigation

Clubs remain a secondary stack (`href: null` tab), reachable from:

1. Profile → Book Clubs  
2. Messages → Book Clubs segment  
3. Search → Clubs mode  
4. Feed → Book Clubs discussion cards  

Preserve FloatingTabBar (Home, Feed, Search, Messages, Profile). No Android config.

## Screens

| Route | Role |
|-------|------|
| `/(app)/clubs` | Landing: My Clubs / Discover / Invites / host join requests |
| `/(app)/clubs/new` | Multi-step create |
| `/(app)/clubs/[id]` | Hub tabs: Overview, Discuss, Schedule, Bookshelf, Members, Stats |
| `/(app)/events` | Cross-club upcoming events |

## Components

- `ClubCalendar` — month grid + sparkle event days  
- `InviteMembersSheet` — multi-select invites  
- `ClubDiscussionThreadSheet` — forum thread + replies  
- `SpoilerReveal` — spoiler gating  

## iOS UX requirements

- Safe-area aware layouts  
- Minimum ~44×44 touch targets on primary actions  
- VoiceOver labels on calendar days and tab controls  
- Keyboard-aware discussion/event composers where practical  
- Preserve selected hub tab while navigating sheets  

## Known gaps

- Banner upload UI not wired (displays `banner_url` if set)  
- Event datetime uses text `YYYY-MM-DDTHH:mm` (no native picker yet)  
