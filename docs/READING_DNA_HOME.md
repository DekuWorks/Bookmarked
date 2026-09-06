# Reading DNA (Home)

Reuse the shared engine (`packages/utils/readingDna.ts`, `upsert_reading_dna`). Do not rebuild.

- Free: top 3. Plus: full. Home: `readingDNAAccess: "advanced"` + `reading_dna_match`.
- **Personality:** `deriveReadingPersonality` from existing persona labels. Official names are open.
- **Cache:** profile loads cached DNA. Recalc when `stale_at` is set. Cadence flag `reading_dna_recalc_hours` remains open.
- **Share card:** opt-in only. Private DNA cannot be shared.
- **Match %:** cosine (`cosineReadingDnaMatch`). Candidate-narrow then score. Private DNA cannot leak.
- **Reader Map DNA:** `share_personality` **and** DNA visibility ≠ private. Home is not consent.
- **Badges:** placeholder IDs only (`READING_DNA_HOME_BADGE_DEFS`).
