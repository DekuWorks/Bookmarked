export type ReadingDnaInput = {
  books?: ReadonlyArray<{
    subjects?: readonly string[] | null;
    rating?: number | null;
    completion_tags?: readonly string[] | null;
    shelf_status?: string | null;
  }>;
  reviews?: ReadonlyArray<{
    feelings?: readonly string[] | null;
    rating?: number | null;
    review_body?: string | null;
  }>;
  shelves?: ReadonlyArray<{ name?: string | null; genre?: string | null }>;
  tags?: readonly string[] | null;
};

export type ReadingDnaTraitCategory = "genre" | "vibe" | "emotion" | "trope" | "habit";

export type ReadingDnaTrait = {
  category: ReadingDnaTraitCategory;
  label: string;
  score: number;
};

export type ReadingDna = {
  topTraits: ReadingDnaTrait[];
  traits: ReadingDnaTrait[];
  summary: string;
};

const VIBE_KEYWORDS = ["cozy", "dark", "hopeful", "wistful", "funny", "fast-paced", "atmospheric"];
const TROPE_KEYWORDS = [
  "found family",
  "enemies to lovers",
  "slow burn",
  "chosen one",
  "second chance",
  "coming of age",
];
const HABIT_LABELS: Record<string, string> = {
  currently_reading: "In-the-moment reader",
  read: "Finisher",
  want_to_read: "Intentional TBR builder",
  dnf: "Selective reader",
};

function addTerms(
  scores: Map<string, number>,
  category: ReadingDnaTraitCategory,
  terms: readonly (string | null | undefined)[],
  weight: number
): void {
  for (const term of terms) {
    const label = term?.trim();
    if (!label) continue;
    const key = `${category}:${label.toLocaleLowerCase()}`;
    scores.set(key, (scores.get(key) ?? 0) + weight);
  }
}

function addMatchingKeywords(
  scores: Map<string, number>,
  category: "vibe" | "trope",
  text: string,
  keywords: readonly string[]
): void {
  const normalized = text.toLocaleLowerCase();
  for (const keyword of keywords) {
    if (normalized.includes(keyword)) addTerms(scores, category, [keyword], 1);
  }
}

/**
 * Builds deterministic Reading DNA traits from local reader data.
 * AI-generated explanations can be layered on top without changing the scores.
 */
export function computeReadingDna(input: ReadingDnaInput): ReadingDna {
  const scores = new Map<string, number>();

  for (const book of input.books ?? []) {
    addTerms(scores, "genre", book.subjects ?? [], book.rating && book.rating >= 4 ? 2 : 1);
    addTerms(scores, "trope", book.completion_tags ?? [], 1);
    if (book.shelf_status) addTerms(scores, "habit", [HABIT_LABELS[book.shelf_status]], 1);
  }

  for (const review of input.reviews ?? []) {
    addTerms(scores, "emotion", review.feelings ?? [], review.rating && review.rating >= 4 ? 2 : 1);
    if (review.review_body) {
      addMatchingKeywords(scores, "vibe", review.review_body, VIBE_KEYWORDS);
      addMatchingKeywords(scores, "trope", review.review_body, TROPE_KEYWORDS);
    }
  }

  for (const shelf of input.shelves ?? []) {
    addTerms(scores, "genre", [shelf.genre], 2);
    addMatchingKeywords(scores, "vibe", shelf.name ?? "", VIBE_KEYWORDS);
    addMatchingKeywords(scores, "trope", shelf.name ?? "", TROPE_KEYWORDS);
  }

  addTerms(scores, "trope", input.tags ?? [], 1);

  const traits = [...scores.entries()]
    .map(([key, score]) => {
      const [category, label] = key.split(":", 2) as [ReadingDnaTraitCategory, string];
      return { category, label, score };
    })
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  const topTraits = traits.slice(0, 3);

  return {
    topTraits,
    traits,
    summary: topTraits.length
      ? `Your reading DNA leans ${topTraits.map((trait) => trait.label).join(", ")}.`
      : "Add books, ratings, reviews, shelves, or tags to begin shaping your Reading DNA.",
  };
}

export function readingDnaMatchPercent(a: ReadingDna, b: ReadingDna): number {
  const aTraits = new Set(a.traits.map((trait) => `${trait.category}:${trait.label}`));
  const bTraits = new Set(b.traits.map((trait) => `${trait.category}:${trait.label}`));
  const union = new Set([...aTraits, ...bTraits]);
  if (!union.size) return 0;
  const intersection = [...aTraits].filter((trait) => bTraits.has(trait)).length;
  return Math.round((intersection / union.size) * 100);
}
