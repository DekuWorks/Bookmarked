# Feature entitlements (Free / Plus / Home)

Canonical Free-tier product contract. Limits live in `ENTITLEMENTS` (`packages/utils/subscription.ts`). UI uses structured helpers (`check*Limit` → `{ allowed, reason, currentUsage, limit }`). Server triggers / RPCs re-check `user_has_paid_entitlement`.

Subscribe **only on iOS**. Web never starts Stripe Checkout. After IAP writes `user_subscriptions`, bookmarked.online unlocks automatically.

## Plan names

| DB / code | User-facing |
|---|---|
| `free` | Free |
| `plus` | Plus |
| `home` | Home |

**Premium vs Plus:** the $5.99 plan code stays `plus`. “Premium” is a legacy alias in IAP SKUs (`*.premium.*`) and older docs. Do not create a third paid DB tier.

Official Home display prices: $9.99/month, $99.99/year (≈ $8.33/month; save $19.89 / ~16.6%) from `homePricing`. iOS buttons prefer StoreKit `displayPrice`. Web never starts Stripe Checkout.

## Free allowances

| Surface | Free | Plus / Home | Enforcement |
|---|---|---|---|
| Built-in shelves (TBR / Currently Reading / Finished / DNF) | unlimited | unlimited | — |
| Custom shelves | 1 | unlimited (`Infinity`, no second cap) | `checkCustomShelfLimit` + `enforce_custom_shelf_limit` |
| Custom shelf icons + privacy | yes | yes | `icon_key` + RLS |
| Audiobook tracking (HH:MM) | yes | yes | `listeningTime` |
| Progress / Trail / Notes | yes | yes | Notes stay Free. Quote title field stays removed on web. |
| Favorite quotes | 25 | unlimited | `checkSavedQuoteLimit` + `enforce_saved_quote_limit` |
| Quote graphics | 3 / UTC month | unlimited (abuse/rate protection; no Plus monthly cap) | `usage_counters` + `try_increment_usage_counter` (consume only after success). UI shows `PLUS_UNLIMITED_FAIR_USE_COPY` |
| Book clubs (create or join) | 3 active memberships | unlimited | `checkBookClubJoinLimit` + `enforce_book_club_join_limit` (owner + member) |
| Create club | consumes a join slot | allowed | `clubMembershipConsumesJoinSlot("create_owner")` is `true` |
| Join challenges | 3 / UTC year for user / community / club / friend | unlimited | Official / featured are free extras. `checkReadingChallengeJoinLimit` + yearly counter + `enforce_reading_challenge_join_limit` |
| Create challenge | no | yes | `canCreateReadingChallenge` + `user_has_paid_entitlement` |
| Yearly books-read goal | yes | yes | `yearly_reading_goals` unique `(user_id, year)` |
| Yearly Wrapped recap | yes | yes | Accurate activity dates only |
| Monthly Wrapped | no | yes | Plus FeatureKey `monthly_wrapped` — `/wrapped/month/` + iOS `wrapped-month` |
| Insights (speed, time, week/month, habits, YoY, heatmaps) | no | yes | `plusInsights` — pages/hour only with pages + duration; reading time and listening time stay separate (no combined “Total Reading Time”) |
| Favorite authors | no | yes | `user_favorite_authors` unique user+author; never auto-follow |
| Advanced goals | no | yes | `advanced_reading_goals`; `ADVANCED_GOAL_SIMULTANEOUS_LIMIT = null` (no simultaneous cap) |
| AI companion | no | yes | Edge `ai-reading-companion`; spoiler + ending confirm |
| Quote scanner | no | yes | Edge `quote-scanner`; editable preview; never auto-save |
| Club polls / analytics | no | yes | Polls default one vote; creator may opt in to `allow_multiple`. Vote RPC enforces the mode. Analytics owner/host + Plus (`canViewDetailedStats`) — no admin role |
| Advanced review extras | no | yes | Chapter notes, optional character 5-star half-star ratings (user-entered names), Would Recommend Yes/No, reread likelihood on the same 5-star half-star scale |
| Reviews (half-star, feelings, spoilers, categories) | yes | yes | `advanced_reviews` is Plus extras only; Free is not gated off reviews |
| Reading calendar | yes | yes | Qualifying session/progress dates |
| Feed / follow / public profiles | yes | yes | Private shelves/notes stay private |
| Reading DNA | top 3 | full / advanced | existing DNA gates; Home personality is derived, not invented |
| Book Map | no | Home | `canAccessFeature("book_map")` + `book_map_places` |
| Reader Map | no | Home | opt-in default off; age + Home RPCs |
| Experiences / meetups | club events | Home extras | `event_access` data; video join RPC |
| Concierge | no | Home | server-derived priority; no SLA |

## Finished vs Read

- **UI label:** Finished (library filters, History, goals).
- **DB key:** `user_books.shelf_status = 'read'`.
- There is no second “Read” shelf. Do not add one.

## Calendar dating

A day qualifies only from `session_date` on a `session` or `progress` row with pages or listening time. Never `created_at` alone, shelf-moves, Goodreads import, reviews, or ratings.

**Same day, multiple books:** most-recent qualifying cover + a `+N` count.

## Yearly goal dating

Count completion attempts (`activity_kind = completion`) by `session_date`. Import / backfill / correction do not count. Rereads keep prior completion rows (`read_number`). Library `finished_at` is a fallback only — never `updated_at`.

## Club create vs join

Creating a club as owner **consumes** the Free 3-club cap, same as join / invite accept / request approve. `clubMembershipConsumesJoinSlot` returns `true` for every kind. Server trigger `enforce_book_club_join_limit` counts all active memberships (owner included). A modified client cannot create a 4th club when already at 3. Leave or delete (existing owner-delete flow) frees a slot.

## Challenge join kinds

- **Do not consume** a yearly slot: `official`, and any featured / curated-list official join (`owner_kind = official` or `featured = true`).
- **Do consume** a slot: `user`, `community`, `club`, `friend`.
- **`abandoned`:** not a join kind in the engine (member status is `active` / `completed` / `left`). Rejoining the same challenge after leaving does **not** consume a second slot.
- Server trigger `enforce_reading_challenge_join_limit` plus `usage_counters` for consuming joins.

## Security

- Entitlements are not client-spoofable: mutations re-read `user_subscriptions`; SQL triggers block the 2nd custom shelf, 4th club membership (create or join), 26th favorite quote, and 4th consuming challenge join for Free.
- Quote graphics / challenge joins use race-safe `usage_counters` RPCs.
- Quote PDF export and graphics use the signed-in user’s own notes only.
- Public reader libraries use `shelf_visible_to_viewer` RLS plus client filtering. DNF defaults private.
- Affiliate URLs must be `https` and show disclosure. No hardcoded partner IDs.

## Plus product decisions (2026-09-06)

Recorded after the open-question pass. Do not reverse without a new product call.

1. **Custom shelves on Plus:** unlimited. `ENTITLEMENTS.plus.customShelves = Infinity`. No second cap.
2. **Reread Likelihood:** shared 5-star half-star (`stars_5_half`), persisted as a 0.5-step numeric. Not a 1–10 scale.
3. **Character ratings:** optional 5-star half-star scores + user-entered names. Not required to publish a review. No invented character DB.
4. **Club polls:** multi-select allowed when the creator opts in (`allow_multiple`). Default remains single-select. `vote_club_poll` enforces the chosen mode.
5. **Club Analytics roles:** owner/host only via `canViewDetailedStats`. No new admin role.
6. **Advanced Goals simultaneous cap:** none. `ADVANCED_GOAL_SIMULTANEOUS_LIMIT = null`.
7. **Fair-use copy:** yes. Quote Graphics and upgrade Plus copy show that “unlimited” still has abuse/rate protection. No invented Plus monthly graphic cap.
8. **Reading time vs listening time:** keep separate. Do not combine into “Total Reading Time.”

## Home product decisions still open

See `HOME_PRODUCT_DECISIONS` in `packages/utils/homeEligibility.ts` (18 questions). Architecture uses feature flags, event_access prices, coarseness modes, and video_provider — product fills values later.

## Downgrade

Preserve all user data (including DNA history, meetup/event attendance, profile, feature requests, support tickets). Block additional creation only. Do not delete over-limit items. Losing Home disables Reader Map discoverability automatically.

See also `FEATURE_GATING_MATRIX.md`, `SUBSCRIPTION_ARCHITECTURE.md`, `BOOK_MAP.md`, `READER_MAP.md`, `HOME_EXPERIENCES.md`, `READING_DNA_HOME.md`, `CONCIERGE.md`.
