/**
 * Shared brand theme constants (mirrors apps/web globals.css tokens).
 *
 * Web reference:
 *   --color-background: #FAF8FC   (we use a slightly more visible lavender tint)
 *   --color-surface:    #FCFAFE
 *   --color-primary:    #B89DBB
 *   .feed-header-gradient: primary→background, top-to-bottom
 */

/** App-wide light lavender tint applied to every screen background. */
export const BACKGROUND_TINT = "#F4EEFA";

/** Card / elevated surface color (kept lighter than the tint for contrast). */
export const SURFACE = "#FCFAFE";

export const BRAND = {
  primary: "#B89DBB",
  puceRed: "#642F37",
  rust: "#C0350F",
  royalOrange: "#F3904B",
  orangeYellow: "#F7C767",
} as const;

/**
 * Branded top-header gradient: vivid lavender → soft peach fading into the page
 * tint at the bottom so the header blends seamlessly into the page (no seam),
 * matching IMG_5360. The final stop equals BACKGROUND_TINT for a clean blend.
 */
/**
 * Top-of-screen gradient "wash": vivid lavender → soft peach fading gradually
 * into the page tint. Rendered as an absolutely-positioned background behind
 * the top content of each screen (header wordmark + bell, and on Feed the
 * segmented tabs), reaching ~25% down the screen before fully resolving to the
 * tint. The final two stops are exactly BACKGROUND_TINT so there is no visible
 * band/seam where the wash meets the page.
 */
export const HEADER_GRADIENT = [
  "#D8C7EC",
  "#F1D3C8",
  BACKGROUND_TINT,
  BACKGROUND_TINT,
] as const;
export const HEADER_GRADIENT_LOCATIONS = [0, 0.35, 0.85, 1] as const;

/** Fraction of the screen height the gradient wash spans before it is all tint. */
export const HEADER_WASH_HEIGHT_RATIO = 0.25;

/**
 * High-contrast serif display face used for the brand wordmark so the text
 * matches the ornate serif "B" of the logo mark. Loaded in app/_layout.tsx.
 */
export const SERIF_DISPLAY_FONT = "PlayfairDisplay_800ExtraBold";

/**
 * Wordmark color — the exact dusty purple of the "B" glyph in
 * assets/brand/logo-mark.png (sampled: srgb(113,91,138)), so the logo-as-B and
 * the "OOKMARKED" text read as one consistent color.
 */
export const BRAND_WORDMARK = "#715B8A";
