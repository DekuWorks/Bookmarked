# Reading DNA Data Audit

## Compute

- Shared: `packages/utils/readingDna.ts` → `computeReadingDna`
- UI: `ReadingDnaSection` on web + iOS (profile)
- Persistence tables ready: `reading_dna_profiles`, `reading_dna_traits`, `reading_dna_snapshots`

## Inputs

| Source | Used |
|---|---|
| Book subjects | Genre |
| Completion tags / review body keywords | Tropes / vibes |
| Review feelings | Emotion |
| Shelf status / audiobook format | Habits |
| Custom shelf genres/names | Genre / vibe / trope hints |

## Tier presentation

| Tier | Access |
|---|---|
| Free | Top 3 traits + soft-locked strands |
| Plus | Full categories, habits, AI/matches CTAs |
| Home | Plus + advanced DNA Match messaging |

## Persistence writer

- RPC `upsert_reading_dna` (`20260801210000_upsert_reading_dna_rpc.sql`) — authenticated, security definer
- Clients: `persistReadingDnaSnapshot` (web + iOS) with fingerprint debounce (8s)
- Triggered from profile DNA teaser + dedicated DNA pages
- Also soft-fired from `completeReadingSession` success (web + iOS); never blocks finish UX

## Gaps

1. Session timestamps → richer habits (morning/night) incomplete.
2. Higgsfield assets blocked — see `docs/higgsfield/BLOCKER.md`.
