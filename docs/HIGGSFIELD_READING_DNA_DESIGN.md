# Higgsfield Reading DNA Design

Visual system for Reading DNA / Monthly Wrapped assets. Brand-led, not neon cyberpunk medical DNA.

## Brand palette

| Token | Hex | Use |
|---|---|---|
| Puce red | `#642F37` | Primary text, deep accents |
| Lilac | `#B89DBB` | Soft fills, secondary accents |
| Orange | `#F3904B` | Highlights, CTAs, spark moments |
| Soft off-white | warm paper-like base | Backgrounds, cards-as-atmosphere |

Avoid: neon purple cyberpunk, clinical DNA helix clichés, generic Inter/Roboto stacks in marketing frames.

## Reference mockup

- Cursor asset: project assets `Image_8-1-26_at_12.58_PM-*.png`
- Web copy: `apps/web/public/brand/reading-dna-wrapped-reference.png`

Hierarchy to match: hero persona → category donuts → habits → gated AI / matches.

## Higgsfield workflow

1. Prefer model **`nano_banana_pro`** (confirm via `models_explore` when auth works).
2. Generate DNA / Wrapped frames; store prompts + asset map under `docs/higgsfield/`.
3. Re-auth MCP if `generate_image` fails after session expiry.

## Asset map (planned filenames)

See [`higgsfield/READING_DNA_ASSET_MAP.md`](./higgsfield/READING_DNA_ASSET_MAP.md).

| Asset | Purpose | Status |
|---|---|---|
| `dna-hero-bg.png` | Profile DNA hero atmosphere | On disk · wired (web + iOS) |
| `dna-trait-icons.png` | Trait icon direction sheet | On disk · design ref |
| `dna-locked-plus-preview.png` | Locked Plus treatment | On disk · design ref |
| `dna-share-card.png` | Share card template | On disk · export follow-up |
| `wrapped-cover-YYYY-MM.png` | Monthly Wrapped cover | Not generated yet |
| `dna-empty-state.png` | Sparse library empty state | Not generated yet |

## Prompt principles

- Soft paper / lilac wash / puce ink / orange ember accents.
- Literary, warm, editorial — books and light, not sci-fi HUD.
- No overloaded badges or floating promo stickers on hero frames.
- Leave clear negative space for trait labels in-app.

## Integration

- Feature-flag unfinished premium surfaces until assets + UI land.
- Free users never see full Wrapped export; Plus unlocks Wrapped + full DNA chrome.
