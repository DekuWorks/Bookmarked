# Reading DNA (Home)

Reuse existing deterministic DNA (`packages/utils/readingDna.ts`, `upsert_reading_dna`). Do not rebuild.

- Free: top 3. Plus: full. Home: `readingDNAAccess: "advanced"` + `reading_dna_match`.
- **Personality:** `deriveReadingPersonality` from existing persona labels + an explanation of the scored traits. Official names are an open product decision.
- **Cache:** persist via existing fingerprint/debounce. Recalc window is `reading_dna_recalc_hours` (default 24; cadence is open).
- **Share card:** existing DNA share assets; Reader Map personality filter only if the member opts in (`share_personality`).
- **Match %:** `readingDnaMatchPercent` already exists.
