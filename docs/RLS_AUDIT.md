# RLS Audit — Book Clubs

Companion to `docs/SECURITY_AUDIT.md` focused on Community Hub policies.

## Helpers (SECURITY DEFINER)

| Function | Purpose |
|----------|---------|
| `user_is_active_club_member(club_id)` | Active membership only |
| `user_is_club_member(club_id)` | Alias → active member |
| `user_has_club_role(club_id, roles[])` | Role check + club owner_id |
| `user_is_book_club_owner(club_id)` | Storage avatar/banner writes |

## Table policy summary

| Table | SELECT | WRITE |
|-------|--------|-------|
| `book_clubs` | public OR member OR pending invitee OR owner | Insert own; update/delete owner |
| `book_club_members` | members; public roster for public clubs | Self-join open public; owner/host manage; no self-owner insert except create |
| `book_club_invitations` | invitee/inviter/owner/host | Insert owner/host; update invitee/host |
| `book_club_join_requests` | requester or owner/host | Insert self on request_approval clubs |
| `book_club_discussions` | members or public club | Insert members; update/delete own or moderators |
| `book_club_discussion_replies` | members or public club | Insert if unlocked; moderate delete |
| `book_club_discussion_reactions` | authenticated | Self insert/delete when member |
| `book_club_events` | members or public club | Insert/update/delete owner/host/creator |
| `book_club_event_attendees` | members | Self RSVP only |
| `book_club_announcements` | members or public | Owner/host write |
| `book_club_books` | members or public | Owner/host; members may suggest |
| `book_club_current_reads` | members or public | Owner/host |
| `book_club_activity` | members | Member insert own actor |
| `book_club_group_conversations` | members | Created via RPC |
| `book_club_settings` | members/owner | Owner update |
| `book_club_member_notification_prefs` | own rows | Own upsert |

## Verification ideas

1. As non-member: `select * from book_club_discussions where club_id = <private>` → 0 rows  
2. As member: attempt `update book_club_members set role = 'owner' where user_id = auth.uid()` → denied or no-op via WITH CHECK  
3. As non-member: RSVP insert → denied  
4. Accept invitation RPC as wrong user → Forbidden  

See `docs/BOOK_CLUB_QA.md` permissions section.
