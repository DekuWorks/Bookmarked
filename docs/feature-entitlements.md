# Feature entitlements (Free / Plus / Home)

Canonical Free-tier product contract. Limits live in `ENTITLEMENTS` (`packages/utils/subscription.ts`). UI uses structured helpers (`check*Limit` → `{ allowed, reason, currentUsage, limit }`). Server triggers / RPCs re-check `user_has_paid_entitlement`.

Subscribe **only on iOS**. Web never starts Stripe Checkout. After IAP writes `user_subscriptions`, bookmarked.online unlocks automatically.

## Plan names

| DB / code | User-facing |
|---|---|
| `free` | Free |
| `plus` | Plus |
| `home` | Home |

Do not hardcode prices in Free/Plus UX. App Store localizes IAP prices.

## Free allowances

| Surface | Free | Plus / Home | Enforcement |
|---|---|---|---|
| Built-in shelves (TBR / Currently Reading / Finished / DNF) | unlimited | unlimited | — |
| Custom shelves | 1 | unlimited | `checkCustomShelfLimit` + `enforce_custom_shelf_limit` |
| Custom shelf icons + privacy | yes | yes | `icon_key` + RLS |
| Audiobook tracking (HH:MM) | yes | yes | `listeningTime` |
| Progress / Trail / Notes | yes | yes | Notes stay Free. Quote title field stays removed on web. |
| Favorite quotes | 25 | unlimited | `checkSavedQuoteLimit` + `enforce_saved_quote_limit` |
| Quote graphics | 3 / UTC month | unlimited | `usage_counters` + `try_increment_usage_counter` (consume only after success) |
| Book clubs (create or join) | 3 active memberships | unlimited | `checkBookClubJoinLimit` + `enforce_book_club_join_limit` (owner + member) |
| Create club | consumes a join slot | allowed | `clubMembershipConsumesJoinSlot("create_owner")` is `true` |
| Join challenges | 3 / UTC year for user / community / club / friend | unlimited | Official / featured are free extras. `checkReadingChallengeJoinLimit` + yearly counter + `enforce_reading_challenge_join_limit` |
| Create challenge | no | yes | `canCreateReadingChallenge` + `user_has_paid_entitlement` |
| Yearly books-read goal | yes | yes | `yearly_reading_goals` unique `(user_id, year)` |
| Yearly Wrapped recap | yes | yes | Accurate activity dates only |
| Monthly Wrapped | no | yes | Plus FeatureKey `monthly_wrapped` — not built in this sprint |
| Reviews (half-star, feelings, spoilers, categories) | yes | yes | `advanced_reviews` is Plus extras only; Free is not gated off reviews |
| Reading calendar | yes | yes | Qualifying session/progress dates |
| Feed / follow / public profiles | yes | yes | Private shelves/notes stay private |
| Reading DNA | top 3 | full / advanced | existing DNA gates |

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

## Downgrade

Preserve all user data. Block additional creation only.

See also `FEATURE_GATING_MATRIX.md` and `SUBSCRIPTION_ARCHITECTURE.md`.
