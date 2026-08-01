/**
 * Soft colored backgrounds for reading-note category pills.
 * Hex tokens work on native; web maps the same keys to Tailwind classes.
 */

export type ReadingNoteTagTone = {
  /** Solid / translucent pill background */
  background: string;
  /** Border color */
  border: string;
  /** Label text */
  text: string;
};

const BUILTIN_TONES: Record<string, ReadingNoteTagTone> = {
  favorite_quote: {
    background: "#FEF3C7",
    border: "#FCD34D",
    text: "#78350F",
  },
  character_development: {
    background: "#DBEAFE",
    border: "#93C5FD",
    text: "#1E3A8A",
  },
  important_plot_point: {
    background: "#FEE2E2",
    border: "#FCA5A5",
    text: "#7F1D1D",
  },
  theory: {
    background: "#EDE9FE",
    border: "#C4B5FD",
    text: "#4C1D95",
  },
  favorite_scene: {
    background: "#DCFCE7",
    border: "#86EFAC",
    text: "#14532D",
  },
  emotional_moment: {
    background: "#FFEDD5",
    border: "#FDBA74",
    text: "#7C2D12",
  },
  general_note: {
    background: "#E8E0F0",
    border: "#B89DBB",
    text: "#642F37",
  },
};

/** Rotating palette for custom categories (brand-adjacent + soft accents). */
const CUSTOM_TONES: ReadingNoteTagTone[] = [
  { background: "#E8D5E8", border: "#B89DBB", text: "#642F37" },
  { background: "#DDD6FE", border: "#A78BFA", text: "#4C1D95" },
  { background: "#FBCFE8", border: "#F9A8D4", text: "#831843" },
  { background: "#CFFAFE", border: "#67E8F9", text: "#164E63" },
  { background: "#FDE68A", border: "#FBBF24", text: "#78350F" },
  { background: "#BBF7D0", border: "#4ADE80", text: "#14532D" },
  { background: "#FED7AA", border: "#FB923C", text: "#7C2D12" },
  { background: "#BFDBFE", border: "#60A5FA", text: "#1E3A8A" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function readingNoteTagTone(
  category: string,
  customId?: string | null
): ReadingNoteTagTone {
  if (category.startsWith("custom:")) {
    const seed = customId ?? category;
    return CUSTOM_TONES[hashString(seed) % CUSTOM_TONES.length]!;
  }
  return BUILTIN_TONES[category] ?? BUILTIN_TONES.general_note!;
}
