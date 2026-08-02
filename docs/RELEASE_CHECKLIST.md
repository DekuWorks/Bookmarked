# Release Checklist — Book Club Community Hub

## Before deploy

- [ ] Apply migrations:
  - `20260802150000_book_club_community_hub.sql`
  - `20260802160000_book_club_notifications_discovery.sql`
- [ ] Verify RLS helpers: `user_is_active_club_member`, `user_has_club_role`
- [ ] Smoke-test invite accept RPC and ensure club group conversation RPC
- [ ] Confirm storage policies for club avatars/banners

## Web

- [ ] Production build (`apps/web` `npm run build`)
- [ ] Clubs landing: My Clubs / Discover / Invitations
- [ ] Create public + private + invite-only
- [ ] Share public club to Feed; private share blocked
- [ ] Club hub tabs + calendar sparkles + RSVP
- [ ] Mobile Safari: More → Book Clubs ≤2 taps; horizontal tabs

## iOS

- [ ] Typecheck / Expo prebuild validation
- [ ] Clubs from Profile + Messages
- [ ] Create flow + invite sheet
- [ ] Message the Club → group conversation
- [ ] Schedule list/calendar + RSVP
- [ ] Light + Dark mode spot check

## Security

- [ ] Non-member cannot read private discussions via API
- [ ] Client cannot self-promote to owner/host
- [ ] Meeting URLs require HTTPS; private clubs hide links from non-members
- [ ] Banned/removed members lose chat + private content

## Docs

- [ ] `PROJECT_PROGRESS.md` sprint marked complete after QA
- [ ] `docs/BOOK_CLUB_QA.md` checklist executed
