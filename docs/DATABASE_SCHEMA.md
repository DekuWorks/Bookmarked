# Bookmarked — Database Schema

> Phase 7 audit (July 2026). 44 migrations. All `public` tables have RLS enabled.

---

## Domains

| Domain | Tables |
|--------|--------|
| Users | `profiles`, `follows`, `user_subscriptions` |
| Catalog | `books` |
| Library | `user_books`, `user_shelves`, `user_shelf_books` |
| Reading | `reading_sessions`, `reading_notes`, `user_reading_note_categories` |
| Reviews | `reviews`, `review_reactions`, `review_replies` |
| Social | `activity_events`, `posts`, `post_likes`, `post_comments`, `post_comment_reactions`, `post_comment_replies`, `post_drafts` |
| Clubs | `book_clubs`, `book_club_members`, `book_club_discussions` (migrated from `book_club_posts`), `book_club_discussion_replies`, `book_club_discussion_reactions`, `book_club_events`, `book_club_event_attendees`, `book_club_invitations`, `book_club_join_requests`, `book_club_announcements`, `book_club_books`, `book_club_current_reads`, `book_club_activity`, `book_club_group_conversations`, `book_club_settings`, `book_club_member_notification_prefs` — see `docs/BOOK_CLUB_DATABASE.md` |
| Messaging | `conversations`, `conversation_participants`, `messages` |
| Notifications | `notifications` |

---

## Unique constraints (duplicate prevention)

| Table | Constraint | Notes |
|-------|------------|-------|
| `books` | `(external_source, external_id)` | Catalog dedup by ISBNdb/Open Library ID |
| `user_books` | `(user_id, book_id)` | One library row per user per book |
| `reviews` | `(user_id, book_id, read_number)` | Multiple reviews per re-read |
| `user_shelves` | `(user_id, slug)` | URL-safe shelf identifier |
| `user_shelves` | `(user_id, lower(trim(name)))` | **Phase 7** — display name dedup |
| `user_shelves.icon_key` | nullable `custom_icon_1`…`5` | Custom shelf icon; null → client fallback `custom_icon_1` |
| `user_shelf_books` | `(shelf_id, book_id)` | Book once per custom shelf |
| `follows` | `(follower_id, following_id)` | No duplicate follows |
| `conversation_participants` | `(conversation_id, user_id)` | |
| `user_reading_note_categories` | `(user_id, lower(label))` | |

---

## Hot-path indexes (Phase 7)

| Index | Table | Columns | Use case |
|-------|-------|---------|----------|
| `user_books_user_shelf_status_idx` | `user_books` | `(user_id, shelf_status)` | Library shelf filtering |
| `user_books_user_updated_idx` | `user_books` | `(user_id, updated_at desc)` | Recently updated |
| `activity_events_user_created_idx` | `activity_events` | `(user_id, created_at desc)` | User activity feed |
| `reviews_user_created_idx` | `reviews` | `(user_id, created_at desc)` | Reading Room reviews tab |
| `user_shelf_books_book_id_idx` | `user_shelf_books` | `(book_id)` | Book → shelf lookups |
| `conversation_participants_user_conversation_idx` | `conversation_participants` | `(user_id, conversation_id)` | Inbox membership |
| `post_likes_post_id_idx` | `post_likes` | `(post_id)` | Like counts |

**Pre-existing indexes** (still relevant): `notifications_user_created_idx`, `messages_conversation_created_idx`, `posts_user_id_created_idx`, `reading_notes_user_id_created_at_idx`, `follows_follower_id_idx`.

---

## RLS patterns

| Pattern | Examples |
|---------|----------|
| Own-row CRUD | `user_books`, `reading_sessions`, `reading_notes` |
| Public read, own write | `profiles` |
| Visibility helpers (`security definer`) | `shelf_visible_to_viewer`, `post_visible_to_viewer`, `activity_visible_to_viewer`, `custom_shelf_visible_to_viewer`, `reading_note_visible_to_viewer` |
| Participant-scoped | `messages`, `conversations` |
| Owner-only | `notifications`, `user_subscriptions` |

See `docs/SECURITY_AUDIT.md` for policy details and gaps.

---

## Storage buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | Yes | Profile images |
| `post-images` | Yes | Feed/post attachments |
| `message-attachments` | **No** (Phase 8) | DM images — signed URLs required |

---

## Security definer functions

| Function | Purpose |
|----------|---------|
| `create_notification()` | Insert notifications with preference checks |
| `shelf_visible_to_viewer()` | Shelf privacy RLS |
| `post_visible_to_viewer()` | Post/repost visibility |
| `activity_visible_to_viewer()` | Activity feed privacy (**Phase 8**) |
| `custom_shelf_visible_to_viewer()` | Custom shelf privacy |
| `reading_note_visible_to_viewer()` | Note visibility |
| `user_is_conversation_participant()` | Messaging RLS |
| `user_owns_user_book()` | Note insert ownership |
| `search_reading_notes()` | Full-text note search |

---

## Related docs

- `docs/BOOKMARKED_ARCHITECTURE.md` — system overview
- `docs/SECURITY_AUDIT.md` — RLS audit findings
- `supabase/migrations/` — forward-only migration history

**Last updated:** July 2026
