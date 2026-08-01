# Reading DNA Algorithm

Authoritative description of `computeReadingDna` in [`packages/utils/readingDna.ts`](../packages/utils/readingDna.ts).

## Goals

1. Genre / Vibe / Emotion / Trope each **normalize to 100%** independently.
2. Habits are **separate labels + confidence** (relative bars, not mixed into category pies).
3. Free **top 3 traits**; Plus **full dashboard** from one compute.
4. **Do not invent traits** from tiny data (`MIN_TRAIT_SCORE = 2`).
5. Expose overall `confidence`: `none | low | medium | high`.

## Canonical dictionary

`TOP_TRAITS_DICTIONARY` stabilizes persona labels (Cozy Reader, Fantasy Lover, …) for UI + future Higgsfield prompts.

## Confidence

| Level | Rule of thumb |
|---|---|
| `none` | No sample / no category coverage |
| `low` | Sparse library (&lt; 8 signals or &lt; 2 categories) |
| `medium` | Enough sample + 2–3 categories |
| `high` | ≥ 24 signals and broad category coverage |

Free top traits hide entirely when confidence is `none`.

## Persistence

Migration `20260801200000_reading_dna_and_free_limits.sql`:

- `reading_dna_profiles` — summary, confidence, public top-trait approval
- `reading_dna_traits` — trait rows; public SELECT only when `is_public_approved` + `is_top_trait`
- `reading_dna_snapshots` — period payloads (own SELECT only)

Client compute remains source of truth until a server snapshot job writes these tables.

## Tests

[`packages/utils/readingDna.test.ts`](../packages/utils/readingDna.test.ts)
