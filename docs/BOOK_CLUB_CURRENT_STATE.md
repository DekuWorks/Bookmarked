# Book Club Current State

> Updated: August 2, 2026 — post Community Hub implementation  
> Platforms: bookmarked.online + native iOS (Android out of scope)

## Verdict

Book Clubs are now a **Community Hub** with additive schema, invitations/join requests, forum discussions, schedule list+calendar, curated bookshelf, announcements, club group chat link, feed share for public clubs, discovery sections, and per-club notification preferences — on web and iOS.

## Status legend

- **Complete** — works end-to-end on web + iOS (pending migration apply + manual QA)
- **Partial** — exists with known gaps
- **Missing** — not implemented
- **Bugged** — broken

---

## Requirement matrix (post-sprint)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Main Book Clubs landing | Complete | My Clubs, Discover, Invitations, Join Requests, events shortcut |
| Club creation | Complete | Multi-step; visibility + join_policy + genres; share-to-feed for public |
| Club discovery | Complete | Search/filters; Trending; Clubs Reading Your Books |
| Public / private / invite-only | Complete | Schema + UI |
| Join requests | Complete | request_approval + host/owner approve |
| Invitations | Complete | Multi-select; accept/decline; notify trigger |
| Roles host/moderator | Complete | Schema + Members tab actions |
| Ownership transfer | Complete | RPC + UI confirmation |
| Current read | Complete | History table + RPC `set_book_club_current_read` |
| Club bookshelf | Complete | Categories; independent of personal library |
| Forum discussions | Complete | Title, replies, pin/lock, spoilers; flat replies (no deep nesting) |
| Club group messaging | Complete | `ensure_book_club_group_conversation` → Messages |
| Events + meeting links | Complete | Types, platform, HTTPS, Copy/Join |
| Calendar view | Complete | Sparkle indicators; list/calendar switcher |
| RSVP | Complete | Going/Maybe/Not Going |
| Reminders | Partial | Attendee `reminder_at` fields; in-app notify on event create |
| Announcements | Complete | Overview + create for owner/host |
| Member management | Complete | Invite/approve/promote/remove/ban/transfer |
| Statistics | Complete | `getClubStats`; detailed for owner/host |
| Feed share club | Complete | `club_shared` activity; public only |
| Notifications | Complete | `type=club`, global `notify_clubs`, per-club levels |
| Mobile web nav | Complete | More menu ≤2 taps |
| iOS navigation | Partial | Secondary entry points (by design) |
| Dark mode / a11y | Partial | Tokens + calendar labels; full QA pending |
| Nested replies >1 | Missing | Documented deferral — flat replies only |
| Banner upload (iOS) | Partial | Displays URL; upload UI gap |
| Native video meetings | Missing | HTTPS vendors only |
| Android | Missing | Out of scope |

## Migrations to apply

1. `supabase/migrations/20260802150000_book_club_community_hub.sql`
2. `supabase/migrations/20260802160000_book_club_notifications_discovery.sql`

## Key docs

- `docs/BOOK_CLUB_DATABASE.md`
- `docs/BOOK_CLUB_PERMISSIONS.md`
- `docs/BOOK_CLUB_ROUTES.md`
- `docs/BOOK_CLUB_QA.md`
- `docs/WEB_UI_GUIDE.md` / `docs/IOS_UI_GUIDE.md`
- `docs/RLS_AUDIT.md` / `docs/RELEASE_CHECKLIST.md`
