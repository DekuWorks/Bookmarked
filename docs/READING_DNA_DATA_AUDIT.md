# Reading DNA Data Audit

## Compute

- Shared: `packages/utils/readingDna.ts` → `computeReadingDna`
- Config: `packages/utils/readingDnaConfig.ts` (provisional weights)
- UI: `ReadingDnaSection` on web + iOS; full dashboard on `/reading-dna`
- Persistence: `reading_dna_profiles`, `reading_dna_traits`, `reading_dna_snapshots`

## Inputs

| Source | Used |
|---|---|
| Book subjects | Genre (split proportionally) |
| Rating / favorite / reread / DNF / recency | Genre weights |
| User-applied mood / vibe tags + session mood | Vibe or emotion via existing mood map |
| Review feelings | Emotion (and vibe if the tag is classified that way) |
| Canonical trope tags | Trope (completion tags like Finished ignored) |
| Sessions | Habits (morning/night, weekend, pace) |
| Format | Audiobook Lover / Physical Collector |
| Book Map visits | Library Lover / Bookstore Explorer only if visit rows are passed |

Review bodies are **not** mined for vibes or tropes.

## Persistence writer

- RPC `upsert_reading_dna` — authenticated, security definer; snapshots are insert-only
- Clients: `persistReadingDnaSnapshot` (web + iOS) with fingerprint debounce
- Profile loads cache unless `stale_at` is set
- Triggers mark stale on finish / rating / favorite / tags / reviews / sessions
