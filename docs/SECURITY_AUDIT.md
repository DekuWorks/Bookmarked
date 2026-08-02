# Bookmarked — Security Audit

> Phase 8 audit (July 2026). Covers RLS, storage, auth, input validation, and error handling.

---

## Summary

| Area | Status | Action |
|------|--------|--------|
| RLS on all tables | ✅ | 27 public tables, RLS enabled |
| Activity visibility | ✅ Fixed | `activity_visible_to_viewer()` + updated SELECT policy |
| Message attachments | ✅ Fixed | Bucket set `public: false`; signed URLs in app |
| Private notes | ✅ | `reading_notes` visibility helper + owner bypass |
| Messages | ✅ | Participant-scoped SELECT/INSERT |
| Reviews | ✅ | `visibility = 'public' OR owner` |
| `post_likes` SELECT | ✅ Fixed | Gated on `post_visible_to_viewer()` |
| Note categories | ✅ Fixed | Owner-only SELECT |
| Notifications DELETE | ✅ Added | Users can delete own rows |
| Auth flows | ✅ Verified | Login, signup, reset-password, session guard |
| Input validation | ✅ Added | Length limits on messages, posts, reviews, passwords |
| Rate limiting | 🟡 Stub | `rate-limit-stub` Edge Function scaffold |
| Error logging | ✅ | `console.error` with context; no secrets in messages |

---

## Critical fixes (Phase 8 migration)

### 1. `activity_events` visibility leak

**Before:** `activity_select_authenticated` allowed any authenticated user to read all rows, ignoring `visibility` (`public` / `followers` / `private`).

**After:** `activity_select_visible` uses `activity_visible_to_viewer(user_id, visibility, auth.uid())` — mirrors client-side `canViewerSeeActivity()`.

Also added owner UPDATE/DELETE policies.

### 2. Message attachment bucket public

**Before:** `message-attachments` bucket was `public: true`. Anyone with a URL could fetch private DM images.

**After:** Bucket `public: false`. Web and mobile services store storage paths and resolve signed URLs on read (1-hour TTL). Legacy public URLs are parsed and re-signed when possible.

---

## RLS by priority table

### `reading_notes`

- SELECT: owner OR `reading_note_visible_to_viewer()`
- INSERT: owner + `user_owns_user_book()` (security definer)
- UPDATE/DELETE: owner only
- `friends_only` visibility uses one-way follow (viewer follows owner)

### `reviews`

- SELECT: `visibility = 'public' OR user_id = auth.uid()`
- INSERT/UPDATE/DELETE: owner only
- Child tables (`review_reactions`, `review_replies`) check parent review visibility

### `messages` / `conversations`

- Messages SELECT: `user_is_conversation_participant(conversation_id)`
- Conversations: participant or creator bootstrap pattern
- No hard DELETE on messages (soft-delete via UPDATE `deleted_at`)

### `user_books`

- Dual SELECT: own rows + `shelf_visible_to_viewer()` for other users' shelves

### `posts` / `post_likes`

- Posts: owner OR `post_visible_to_viewer()`
- Likes: SELECT now gated on post visibility (**Phase 8**)

### `notifications`

- SELECT/UPDATE: owner only
- INSERT: blocked for clients — `create_notification()` security definer only
- DELETE: owner only (**Phase 8**)

---

## Auth flows verified

| Flow | Implementation | Notes |
|------|----------------|-------|
| Login | `lib/auth/actions.ts` → `signInWithPassword` | Remember-me via storage toggle |
| Signup | `signUp` + email confirm | Password 6–128 chars |
| Forgot password | `resetPasswordForEmail` | Redirect to `/reset-password/` |
| Reset password | `updatePassword` | Requires active session from email link |
| Session guard | `ClientAuthGuard` | Waits for `INITIAL_SESSION` |
| Implicit flow | `lib/supabase/client.ts` | Cross-device email links (see TECHNICAL_DEBT) |

---

## Input validation (Phase 8)

| Field | Limit | Location |
|-------|-------|----------|
| Message body | 4,000 chars | `MessageComposer`, `sendMessage()` |
| Post body | 10,000 chars | `PostComposer`, `MentionComposer` |
| Review body | 20,000 chars | `ReviewForm` |
| Password | 6–128 chars | `signup`, `updatePassword` actions |
| Shelf name | 80 chars | DB check + UI `maxLength` |
| Custom note category | 40 chars | Existing |

---

## Rate limiting

**Stub deployed path:** `supabase/functions/rate-limit-stub/`

- Requires header `x-rate-limit-key` matching `RATE_LIMIT_STUB_SECRET`
- Returns 429 without valid key
- **Not integrated** into ISBNdb proxy or auth — document for future Redis/Supabase counter integration

---

## Remaining gaps (non-critical)

| Item | Severity | Notes |
|------|----------|-------|
| `books` UPDATE open to any authenticated user | Medium | Catalog vandalism risk; consider service-role-only |
| `follows` graph visible to all authenticated | Low | Intentional for social features |
| `reading_notes` `friends_only` = one-way follow | Low | Document if product expects mutual |
| Stripe/webhook signature verification | Medium | Deferred to billing go-live |
| No automated RLS E2E tests | Medium | Manual QA + direct PostgREST probing |

---

## Error handling

- Services use `console.error("[context] message:", error)` — no API keys or tokens logged
- Auth errors return user-safe messages from Supabase
- `SupabaseConfigError` component for missing env at runtime

---

## Book Club Community Hub (August 2026)

Migrations: `20260802150000_book_club_community_hub.sql`, `20260802160000_book_club_notifications_discovery.sql`.

| Control | Status | Notes |
|---------|--------|-------|
| Active membership helper | ✅ | `user_is_active_club_member` excludes banned/removed/left |
| Role helper | ✅ | `user_has_club_role(club, roles[])` + owner_id bypass |
| Invitation / join RPCs | ✅ | SECURITY DEFINER accept/decline/approve |
| Ownership transfer | ✅ | Owner-only RPC; cannot self-assign owner on insert |
| Event writes | ✅ | Owner/host (creator may edit) |
| RSVP | ✅ | Self-only insert/update |
| Private meeting links | ✅ | Event SELECT still public for public clubs; private clubs member-only |
| Club chat link | ✅ | `book_club_group_conversations` + participant sync |
| Feed share | ✅ | App + metadata; only `visibility=public` |
| Notifications | ✅ | `type=club` + `notify_clubs` + per-club prefs |

Full matrix: `docs/BOOK_CLUB_PERMISSIONS.md`.

---

## Related docs

- `docs/DATABASE_SCHEMA.md` — tables, indexes, constraints
- `docs/BOOK_CLUB_DATABASE.md` / `docs/BOOK_CLUB_PERMISSIONS.md`
- `docs/TECHNICAL_DEBT.md` — static export, implicit auth, billing stubs

**Last updated:** August 2026
