# Book Club Database

> Current schema + target model for the Community Hub sprint.

## Migrations (hub)

- `20260802150000_book_club_community_hub.sql` — full additive model
- `20260802160000_book_club_notifications_discovery.sql` — club notify + trending RPC

## Current tables (after hub migrations)

### `book_clubs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| owner_id | uuid → auth.users | |
| name | text | non-empty |
| description | text | |
| image_url | text | avatar |
| banner_url | text | |
| current_book_id | uuid → books | denormalized current read |
| visibility | text | `public` \| `private` \| `invite_only` |
| join_policy | text | `open` \| `request_approval` \| `invitation_only` |
| status | text | `active` \| `archived` |
| genre_tags | text[] | |
| meeting_frequency | text | |
| member_count | int | trigger-maintained |
| created_at / updated_at | timestamptz | |

### `book_club_members`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| club_id | uuid → book_clubs | CASCADE |
| user_id | uuid → auth.users / profiles | |
| role | text | `owner` \| `member` |
| joined_at | timestamptz | |
| UNIQUE | (club_id, user_id) | |

### `book_club_posts` (discussions analogue)
Flat body + optional book_id. Realtime enabled.

### `book_club_events`
title, description, location, meeting_url (https), starts_at, ends_at, created_by.

### Helpers
- `user_is_club_member(club_id)`
- `user_is_book_club_owner(club_id)` (storage)

### Migrations
- `20260713140000_book_clubs.sql`
- `20260713151501_book_club_posts_realtime.sql`
- `20260723150000_group_club_avatars.sql`
- `20260726130000_book_club_events.sql`
- `20260801124000_book_club_event_meeting_url.sql`

---

## Target model (additive)

### Extend `book_clubs`
- `banner_url`, `join_policy` (`open` \| `request_approval` \| `invitation_only`)
- `visibility` += `invite_only`
- `status` (`active` \| `archived`)
- `genre_tags` text[]
- `meeting_frequency` text
- `member_count` int (trigger-maintained)
- Keep `current_book_id` as denormalized pointer

### Extend `book_club_members`
- `role` += `host` \| `moderator`
- `membership_status` (`active` \| `invited` \| `requested` \| `declined` \| `removed` \| `left` \| `banned`)
- `invited_by`, `updated_at`
- Unique active membership preserved

### New tables
| Table | Purpose |
|-------|---------|
| `book_club_invitations` | pending/accepted/declined/expired/canceled |
| `book_club_join_requests` | request_approval flow |
| `book_club_discussions` | migrated from `book_club_posts` + title/metadata |
| `book_club_discussion_replies` | flat replies |
| `book_club_discussion_reactions` | reactions on discussions/replies |
| `book_club_event_attendees` | RSVP going/maybe/not_going |
| `book_club_announcements` | owner/host announcements |
| `book_club_books` | curated shelf categories |
| `book_club_current_reads` | current-read history |
| `book_club_activity` | club-scoped activity log |
| `book_club_group_conversations` | 1:1 link to `conversations` |
| `book_club_settings` | club + per-member notification prefs |

### Extend `book_club_events`
- `event_type`, `timezone`, `reading_assignment`, `meeting_platform`, `reminder_config`

### Indexes (required)
- club_id, user_id, created_at, latest_activity_at composites
- Unique pending invitation (club_id, invitee_id) where status=pending
- Unique pending join request (club_id, user_id) where status=pending

### Data migration notes
1. Backfill `join_policy`: public→`open`, private→`invitation_only`
2. Backfill members `membership_status='active'`
3. Rename/migrate posts → discussions (title = left(body, 80))
4. Seed `member_count` from membership counts
5. Do **not** drop historical discussion or event rows
