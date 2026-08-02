# Book Club Permissions

## Role matrix (target)

| Action | Owner | Host | Moderator | Member | Non-member (public) | Non-member (private/invite) |
|--------|-------|------|-----------|--------|---------------------|-----------------------------|
| View overview (safe) | Yes | Yes | Yes | Yes | Yes | Invite/request info only |
| View private content | Yes | Yes | Yes | Yes | No | No |
| Edit club / settings / delete | Yes | No | No | No | No | No |
| Manage roles / transfer ownership | Yes | No | No | No | No | No |
| Invite members | Yes | Yes | No | No | No | No |
| Approve join requests | Yes | Yes* | No | No | No | No |
| Remove / ban members | Yes | Yes | No | No | No | No |
| Manage current read / bookshelf | Yes | Yes | No | No | No | No |
| Create/edit/delete events | Yes | Yes | No† | No† | No | No |
| Create announcements | Yes | Yes | No | No | No | No |
| Pin/lock discussions | Yes | Yes | Lock only | No | No | No |
| Moderate replies | Yes | Yes | Yes | No | No | No |
| Create discussions / reply / react | Yes | Yes | Yes | Yes | No | No |
| RSVP / reminders (self) | Yes | Yes | Yes | Yes | No | No |
| Club group chat | Yes | Yes | Yes | Yes | No | No |
| View detailed stats | Yes | Yes | Basic | Basic | No | No |
| Share to public Feed | Yes | Yes | Yes | Yes | — | Blocked if not public |

\* Host may approve when club settings allow.  
† Original event creator may edit/delete when permitted by RLS.

## Membership statuses

| Status | Access |
|--------|--------|
| active | Full member permissions for role |
| invited | No private content until accept |
| requested | Pending join request |
| declined / removed / left / banned | No private access; banned cannot rejoin without owner action |

## Current RLS gaps (pre-sprint)

1. No member UPDATE — cannot change roles via client
2. Owner cannot delete others’ posts
3. Any member can create events
4. Public club posts/members/events readable by any authenticated non-member
5. No invitations / join requests tables
6. Clients could insert elevated roles if CHECK expanded without WITH CHECK guards

## Target enforcement

- SECURITY DEFINER: `user_is_active_club_member`, `user_has_club_role(club_id, roles[])`
- RPCs for accept/decline invite, approve/decline join request, transfer ownership
- Role elevation: owner only for host/moderator/owner transfer
- Clients cannot set `role` to `owner` on insert
- Banned/removed excluded from `user_is_active_club_member`
- Private meeting URLs: members-only SELECT

## App-layer entitlements

Free plan `joined_book_clubs` limit remains in `packages/utils/subscription.ts` (not RLS).
