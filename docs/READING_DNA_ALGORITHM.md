# Reading DNA Algorithm

Authoritative description of `computeReadingDna` in [`packages/utils/readingDna.ts`](../packages/utils/readingDna.ts).

Weights and thresholds live in [`packages/utils/readingDnaConfig.ts`](../packages/utils/readingDnaConfig.ts) and are **provisional**.

See [`reading-dna.md`](./reading-dna.md) for the product contract.

## Rules

1. Genre / Vibe / Emotion / Trope each **normalize to 100%** with largest remainder.
2. Habits are **labels + evidence**, never mixed into those pies.
3. Free **top 3** via the balanced selector; Plus/Home show 5.
4. Below `READING_DNA_MIN_DATA_POINTS`, show forming copy — do not invent traits.
5. No vibe/trope inference from review blurbs.
6. Match is cosine on cached vectors. Snapshots are immutable.

## Persistence

Migration `20260908020000_reading_dna_engine.sql` extends:

- `reading_dna_profiles` — visibility, match_enabled, stale_at, match_vector, data_points_count, dna_version
- `reading_dna_traits` — public SELECT only when visibility is public and approved
- `reading_dna_snapshots` — `(user_id, period_type, period_key)` unique; insert-only

RPCs: `upsert_reading_dna`, `mark_reading_dna_stale`, `update_reading_dna_privacy`, `list_reading_dna_match_candidates`.
