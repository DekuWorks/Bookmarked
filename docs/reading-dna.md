# Reading DNA™

Reader identity for Bookmarked. Book Map is where you read. Reader Map is who is nearby. Reading DNA is **why** you read.

Shared engine: [`packages/utils/readingDna.ts`](../packages/utils/readingDna.ts)  
Config (all weights / thresholds): [`packages/utils/readingDnaConfig.ts`](../packages/utils/readingDnaConfig.ts)

Defaults in that config are **provisional / pending product approval**. Do not scatter magic numbers.

## Tiers

Use `getReadingDnaAccess` / `canAccessFeature`. Do not write `if (isPremium)`.

| Access | Surfaces |
|---|---|
| Free `top_three` | Top 3 traits on Profile only. No full dashboard. |
| Plus `full` | Genre / vibe / emotion / trope pies, habits, AI explanation of scored DNA, book matches, YoY |
| Home `advanced` | Plus + monthly snapshots / MoM (above threshold), DNA Match %, similar readers, Reader Map DNA filter (explicit consent), exclusive badge *architecture* |

Subscribe only on iOS.

## Pipeline

User data → normalised signals → scoring engine → category scores → **largest-remainder 100%** → top traits → personality / match / recs.

1. **Genre** — catalog subjects, split multi-genre proportionally. Finished / rating / favorite / reread / DNF / recency live in `READING_DNA_GENRE_WEIGHTS`. DNF is a soft negative. Reread is strong but capped. One 1-star cannot erase a genre.
2. **Vibe** — user-applied Mood / VIBE tags + canonical Bookmarked tags only. No blurb inference.
3. **Emotion** — existing mood / feeling tags (`BUILTIN_MOOD_TAGS` + review feelings). Empty copy: “Keep tagging how books make you feel…”. Never fabricate %.
4. **Trope** — canonical IDs, case-normalised. Completion tags like Finished are ignored.
5. **Habits** — labels with evidence floors, not a 100% pie. 1 audiobook ≠ Audiobook Lover. Contradictory pairs (morning/night, fast/slow) keep the stronger side unless config allows both.
6. **Top traits** — balanced selector (1 genre + 1 vibe + 1 emotion + 1 trope + 1 habit). Free shows 3. Plus/Home show 5.
7. **Faith / Christian Fiction** — normal catalog genre data. No religion inference.

AI may explain the scored vector. AI must not invent percentages, Match %, or habit labels.

## Match (Home)

Formula: **cosine similarity** on category-weighted percent vectors (`READING_DNA_MATCH_CATEGORY_WEIGHTS`). Symmetric. Habits are 0/1 presence.

1. Drop private / Match-disabled DNA.
2. Narrow to candidates who share at least one stored genre key.
3. Score cosine. Cap candidate list (40).
4. Explain WHY using only **visible** traits.

RPC: `list_reading_dna_match_candidates`.

## Recs

Plus/Home score TBR / currently-reading books against the user’s DNA vector. Free trending is unchanged. Club and friend suggestions reuse the same overlap + optional social extras (`scoreFriendSuggestions`).

## Cache, stale, snapshots

- Profile loads **cached** `reading_dna_profiles` + traits. Full library scan only when `stale_at` is set or cache is missing.
- Triggers on `user_books`, `reviews`, and `reading_sessions` call `mark_reading_dna_stale`.
- `upsert_reading_dna` writes the live profile and **inserts** monthly (`YYYY-MM`) and yearly (`YYYY`) snapshots. Existing snapshot rows are not rewritten.
- `dna_version` is stored so algorithm changes do not mutate history.
- Home MoM only lists category shifts ≥ `READING_DNA_MOM_CHANGE_THRESHOLD` (5 pts, provisional). Plus+Home YoY uses yearly snapshots.

## Privacy

Visibility: `public` / `followers` / `private` (default **followers** — FLAG #6).

| State | Public Top 3 | Match | Reader Map DNA |
|---|---|---|---|
| Private | no | no | no |
| Followers | followers only | if Match allowed | only with `share_personality_on_reader_map` |
| Public | if `public_top_traits_approved` | if Match allowed | only with explicit DNA + Reader Map consent |

Home subscription is **not** DNA consent. FLAG #9: `match_enabled` can turn Match off while DNA stays public; default follows visibility.

Share cards are opt-in. Private DNA share previews resolve as unavailable.

## Personality and badges

`deriveReadingPersonality` reuses existing persona labels. Official names are open (FLAG #4).

Home badges: placeholder IDs in `READING_DNA_HOME_BADGE_DEFS`. Measurable criteria only. No official names or art.

## AI companion

Pass `readingDnaStructuredSummary(dna)` only. Do not dump the library.

## Open product decisions

See `READING_DNA_PRODUCT_FLAGS` in config (questions 1–12). Do not invent answers in UI copy.

## Tests

[`packages/utils/readingDna.test.ts`](../packages/utils/readingDna.test.ts) — 10-book fixture, 100% pies, DNF/reread, tag normalise, habit floors, tier gates, A/B vs A/C match, privacy leak, snapshot immutability.
