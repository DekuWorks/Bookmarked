# Reading DNA — generation prompts

Brand palette: lilac `#B89DBB`, puce-red `#642F37`, royal-orange `#F3904B`, soft off-white.

Reference hierarchy (not pixel copy): project asset  
`Image_8-1-26_at_12.58_PM-9f5681c0-f91c-4504-87ad-83c0a30175f4.png`

Preferred Higgsfield model: **`nano_banana_pro`** (`resolution: "1k"` or `"2k"`, lowercase).

Avoid: neon cyberpunk, medical DNA lab helix diagrams, dense fake UI copy.

---

## 1. Hero / background — `dna-hero-bg.png`

**Aspect:** `16:9`

```
Soft atmospheric hero background for a literary reading app. Dreamy soft night sky with gentle lilac clouds (#B89DBB), deep puce-red (#642F37) velvet shadows, warm royal-orange (#F3904B) starlight accents, soft off-white paper grain at edges. Elegant warm premium book-club aesthetic. Subtle abstract ribbon helix suggestion only — NOT medical DNA, NOT neon cyberpunk, NOT lab science. Empty composition suitable as mobile/web UI header background. No text, no logos, no people, no charts.
```

## 2. Trait icon direction — `dna-trait-icons.png`

**Aspect:** `1:1`

```
UI icon direction sheet for a literary Reading DNA feature. Soft off-white paper background. Grid of 6 rounded-square icon badges with thin-line minimalist illustrations in brand colors puce-red (#642F37), lilac (#B89DBB), royal-orange (#F3904B): teacup (cozy reader), dragon silhouette (fantasy lover), heart (emotional explorer), feather (hopeful heart), three figures (community reader), open book. Warm premium journal aesthetic, consistent stroke weight, generous corner radius. NOT neon, NOT medical DNA helix science. No dense text. Design system concept art.
```

## 3. Locked Plus preview — `dna-locked-plus-preview.png`

**Aspect:** `9:16`

```
Mobile app locked Plus preview treatment for Reading DNA. Soft off-white literary UI with rounded cards showing blurred donut charts and trait pills in lilac (#B89DBB) and puce (#642F37) with orange (#F3904B) accents. Frosted glass overlay with subtle lock motif, warm premium book-club feel. Soft blur on lower chart cards suggesting locked content. Elegant empty heading space. NOT neon cyberpunk, NOT medical lab DNA. Vertical phone UI concept.
```

## 4. Share-card template — `dna-share-card.png`

**Aspect:** `9:16`

```
Shareable Reading DNA card template for Instagram story. Vertical 9:16. Soft off-white paper with dreamy lilac (#B89DBB) and puce-red (#642F37) gradient panel, royal-orange (#F3904B) accent sparkles. Elegant empty space for profile photo circle and title. Warm literary premium aesthetic like a personal reading journal cover. Subtle abstract ribbon motif. NO readable brand logos, NO fake usernames, NO neon, NO medical DNA helix diagrams. Template frame ready for overlay text.
```

---

## Generation notes (Aug 1, 2026)

- Higgsfield MCP `mcp_auth` reported success, but `generate_image` / `media_upload` / `balance` returned **session expired** immediately after (see `BLOCKER.md`).
- Runtime PNGs were produced with Cursor image generation using the same prompts + mockup reference, then copied into app asset folders.
- When Higgsfield session is stable: re-run with `nano_banana_pro` + optional `medias: [{ role: "reference_image", value: <media_id> }]` after uploading the mockup via `media_upload` / widget.
