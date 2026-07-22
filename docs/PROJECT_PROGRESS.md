# Bookmarked — Project Progress

> Post-MVP refinement tracker. Updated July 2026.

**Live:** https://bookmarked.online

---

## Phase overview

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Audit & documentation | ✅ Complete | All four Phase 0 docs delivered |
| 1 | Navigation redesign | ✅ Complete | Dashboard, Library, Reading Room tabs, mobile bottom nav |
| 2 | Reading Room depth | ✅ Complete | Finish workflow, mood tags, mobile parity, reviews tab polish |
| 3 | Community | ✅ Complete | Feed polish, trending (web + mobile), public profile dedup |
| 4 | Premium architecture | 🟡 In progress | Subscription schema, feature gates, upgrade page; billing TBD |
| 5 | Mobile app parity | 🟡 In progress | Finish → rate prompt parity shipped |
| 6 | Performance & QA | ⚪ Not started | Full responsive QA after nav redesign |

Legend: ✅ Complete · 🟡 In progress · ⚪ Not started · 🔴 Blocked

---

## Phase 0 — Audit & documentation

| Task | Status | Deliverable |
|------|--------|-------------|
| 0.1 Current architecture snapshot | ✅ | `docs/BOOKMARKED_CURRENT_ARCHITECTURE.md` |
| 0.2 Comprehensive architecture doc | ✅ | `docs/BOOKMARKED_ARCHITECTURE.md` |
| 0.3 Technical debt register | ✅ | `docs/TECHNICAL_DEBT.md` |
| 0.4 Progress tracker (this file) | ✅ | `docs/PROJECT_PROGRESS.md` |

---

## Phase 1 — Navigation redesign ✅

Dashboard, Library, Reading Room tabs, Profile cleanup, and mobile bottom nav — all complete. See prior sections in git history.

---

## Phase 2 — Reading Room depth ✅

### 2.1 Mark as finished workflow

| Item | Status | Notes |
|------|--------|-------|
| Auto-set pages to 100% on finish | ✅ | `markBookFinished` |
| Move to Read shelf | ✅ | `shelf_status: read` |
| Save finish date (with picker) | ✅ | `MarkFinishedDialog` + `finished_at` on action |
| Create journal entry | ✅ | `createReadingSessionWithClient` at finish |
| Post-finish “Rate this book?” prompt | ✅ | `RateBookPrompt` — Skip / Review now |
| Mobile finish → rate prompt parity | ✅ | `MarkFinishedSheet` + `RateBookPromptSheet` |

### 2.2 Ratings & reviews

| Item | Status | Notes |
|------|--------|-------|
| Half-star ratings | ✅ | |
| Multiple reviews per read | ✅ | |
| Book edition on reviews | ✅ | Preset chips + custom |
| Advanced category ratings | ✅ | |
| Feelings / mood tags on reviews | ✅ | `REVIEW_FEELINGS` |
| Reading Room reviews tab polish | ✅ | Filters, monthly grouping, feelings/edition |

### 2.3 Journal mood tags

| Item | Status | Notes |
|------|--------|-------|
| `mood` column on `reading_sessions` | ✅ | Migration `20260721120000_reading_sessions_mood.sql` |
| Mood picker on book journal | ✅ | `SessionMoodPicker` in `ReadingJournalSection` |
| Mood display in Reading Room journal tab | ✅ | `ReadingRoomTabs` |

---

## Phase 3 — Community ✅

### 3.1 Feed

| Item | Status | Notes |
|------|--------|-------|
| Chronological activity sort | ✅ | For You activity feed sorted by `created_at` |
| Card spacing & typography | ✅ | `FeedCard` + `space-y-6` on feed lists |
| Review ratings on activity cards | ✅ | Star display for review events |
| Trending sidebar on Feed | ✅ | `TrendingNewsletterPanel` (desktop sidebar) |
| Post reactions | ✅ | Already on `PostCard` (likes) |

### 3.2 Messaging

| Item | Status | Notes |
|------|--------|-------|
| DMs | ✅ | `/messages/` — existing |
| Group chats | ✅ | Conversation `type: group` — existing |

### 3.3 Events calendar

| Item | Status | Notes |
|------|--------|-------|
| Book clubs / signings / challenges calendar | 🔴 Future | Book clubs exist (`/clubs/`); no calendar UI yet |

### 3.4 Trending & community ratings

| Item | Status | Notes |
|------|--------|-------|
| Trending books / most shelved / most reviewed | ✅ | `fetchTrendingSections` on Feed sidebar |
| Mobile trending section | ✅ | `TrendingBooksSection` on mobile For You feed |
| Bookmarked community rating on book pages | ✅ | `CommunityRatingDisplay` (web + mobile) |
| Public profile deduplication | ✅ | `/reader/` — identity + top-3 shelf preview only |

### 3.5 Remaining Phase 3 work

| Item | Status | Notes |
|------|--------|-------|
| Events calendar UI | ⚪ | Deferred |
| Personalized activity ranking toggle | ⚪ | Replaced with chronological for clarity |

---

## Phase 4 — Premium architecture 🟡

### 4.1 Data model

| Item | Status | Notes |
|------|--------|-------|
| `user_subscriptions` table | ✅ | Migration `20260722120000_user_subscriptions.sql` |
| RLS (owner-only read/write) | ✅ | Separate table — not on public `profiles` select |
| Profile backfill trigger | ✅ | Auto-create row on profile insert |

### 4.2 Feature gating

| Item | Status | Notes |
|------|--------|-------|
| `canAccessFeature()` helper | ✅ | `packages/utils/subscription.ts` |
| `useSubscription` hook (web) | ✅ | `apps/web/src/lib/hooks/useSubscription.ts` |
| Premium lock component | ✅ | `PremiumFeatureLock` |
| Upgrade modal | ✅ | `UpgradeModal` |
| Upgrade page | ✅ | `/upgrade/` |
| Advanced analytics gate | ✅ | Reading Room → Progress → Activity heatmap |
| AI insights placeholder gate | ✅ | Reading Room → Progress → AI insights section |

### 4.3 Remaining Phase 4 work

| Item | Status | Notes |
|------|--------|-------|
| Stripe / App Store billing integration | ⚪ | Upgrade page is informational until provider wired |
| Mobile premium UI | ⚪ | Types shared; gates not yet on mobile |
| Admin / webhook subscription updates | ⚪ | Service-role path for payment events |

---

## Pre-refinement baseline (MVP — complete)

Auth, search, library, reviews, feed, follows, clubs, messaging, notifications, import, deploy — all ✅.

---

## Related docs

| Doc | Path |
|-----|------|
| Architecture (comprehensive) | `docs/BOOKMARKED_ARCHITECTURE.md` |
| Technical debt | `docs/TECHNICAL_DEBT.md` |
| Master task list (MVP era) | `docs/project/MASTER_TASK_LIST.md` |

**Last updated:** July 2026
