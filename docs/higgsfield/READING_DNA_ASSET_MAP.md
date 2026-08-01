# Reading DNA asset map

Runtime copies live in both clients. Charts stay live UI; these files are decorative atmosphere / design direction.

| Filename | Purpose | Web path | Mobile path | Wired |
|---|---|---|---|---|
| `dna-hero-bg.png` | DNA page hero atmosphere | `apps/web/public/assets/reading-dna/dna-hero-bg.png` | `apps/mobile/assets/reading-dna/dna-hero-bg.png` | Yes — header bg (web + iOS) |
| `dna-trait-icons.png` | Trait icon set direction sheet | same folder | same folder | Design ref (not sliced into chips yet) |
| `dna-locked-plus-preview.png` | Locked Plus preview treatment | same folder | same folder | Design ref for paywall/blur treatment |
| `dna-share-card.png` | Share-card template | same folder | same folder | Ready for share export overlay |

## Cursor workspace originals

Generated under:

- `/Users/marcusbrown/.cursor/projects/Users-marcusbrown-Bookmarked/assets/dna-hero-bg.png`
- `…/dna-trait-icons.png`
- `…/dna-locked-plus-preview.png`
- `…/dna-share-card.png`

## Mobile require map

`apps/mobile/src/constants/readingDnaAssets.ts` → `READING_DNA_ASSETS.heroBg` (etc.)

## Web URL map

- `/assets/reading-dna/dna-hero-bg.png`
- `/assets/reading-dna/dna-trait-icons.png`
- `/assets/reading-dna/dna-locked-plus-preview.png`
- `/assets/reading-dna/dna-share-card.png`

## Prompts

See [`READING_DNA_PROMPTS.md`](./READING_DNA_PROMPTS.md).

## Status

| Item | Status |
|---|---|
| Runtime assets on disk | Complete |
| Hero wired in UI | Complete |
| Higgsfield MCP generation | Blocked — session expires after `mcp_auth` (see `BLOCKER.md`) |
| Trait icon slicing into individual chips | Follow-up |
| Share export using `dna-share-card.png` | Follow-up |
