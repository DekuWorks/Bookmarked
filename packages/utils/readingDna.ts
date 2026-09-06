export type ReadingDnaInput = {
  books?: ReadonlyArray<{
    subjects?: readonly string[] | null;
    rating?: number | null;
    completion_tags?: readonly string[] | null;
    shelf_status?: string | null;
    format?: string | null;
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

export type ReadingDnaConfidence = "none" | "low" | "medium" | "high";

export type ReadingDnaTrait = {
  category: ReadingDnaTraitCategory;
  label: string;
  score: number;
  /** Share of its category (0–100). Habits use relative strength, not a 100% pie with genres. */
  percent: number;
  emoji: string;
  persona?: string;
  /** 0–1 confidence that this trait is supported by enough evidence. */
  confidence: number;
};

export type ReadingDnaCategoryBreakdown = {
  category: Exclude<ReadingDnaTraitCategory, "habit">;
  title: string;
  subtitle: string;
  traits: ReadingDnaTrait[];
};

export type ReadingDna = {
  /** Free tier: top 3 strongest traits (only when confidence allows). */
  topTraits: ReadingDnaTrait[];
  /** Plus/Home: top 5 persona chips for the hero row. */
  personaTraits: ReadingDnaTrait[];
  traits: ReadingDnaTrait[];
  categories: ReadingDnaCategoryBreakdown[];
  habits: ReadingDnaTrait[];
  summary: string;
  insight: string;
  confidence: ReadingDnaConfidence;
  confidenceScore: number;
  sampleSize: number;
};

export const FREE_READING_DNA_TRAIT_COUNT = 3;

/** Minimum distinct signal hits before inventing a trait label. */
const MIN_TRAIT_SCORE = 2;
/** Minimum library/review sample before medium confidence. */
const MIN_SAMPLE_FOR_MEDIUM = 8;
const MIN_SAMPLE_FOR_HIGH = 24;

const VIBE_KEYWORDS = [
  "cozy",
  "magical",
  "heartwarming",
  "dark",
  "funny",
  "adventurous",
  "whimsical",
  "hopeful",
  "wistful",
  "atmospheric",
] as const;

const TROPE_KEYWORDS = [
  "found family",
  "enemies to lovers",
  "slow burn",
  "chosen one",
  "second chance",
  "morally grey",
  "small town",
  "coming of age",
] as const;

/** Canonical top-trait dictionary (stable labels for DNA + Higgsfield prompts). */
export const TOP_TRAITS_DICTIONARY = {
  cozy: { persona: "Cozy Reader", emoji: "☕" },
  fantasy: { persona: "Fantasy Lover", emoji: "🐉" },
  emotional: { persona: "Emotional Explorer", emoji: "💗" },
  heartbroken: { persona: "Emotional Explorer", emoji: "💔" },
  hopeful: { persona: "Hopeful Heart", emoji: "🤍" },
  "found family": { persona: "Community Reader", emoji: "🫶" },
  romance: { persona: "Romance Softie", emoji: "💌" },
  "audiobook lover": { persona: "Audiobook Explorer", emoji: "🎧" },
  "weekend binger": { persona: "Weekend Binger", emoji: "📚" },
  dark: { persona: "Dark Academia", emoji: "🌙" },
  "slow burn": { persona: "Slow Burn Devotee", emoji: "🔥" },
  mystery: { persona: "Mystery Solver", emoji: "🕵" },
  magical: { persona: "Magic Seeker", emoji: "✨" },
} as const;

const CATEGORY_META: Record<
  Exclude<ReadingDnaTraitCategory, "habit">,
  { title: string; subtitle: string }
> = {
  genre: { title: "Genre DNA", subtitle: "What genres define you" },
  vibe: { title: "Vibe DNA", subtitle: "How your books feel" },
  emotion: { title: "Emotion DNA", subtitle: "How books make you feel" },
  trope: { title: "Trope DNA", subtitle: "Stories you gravitate toward" },
};

const HABIT_LABELS: Record<string, string> = {
  currently_reading: "Weekend Binger",
  read: "Finisher",
  want_to_read: "Physical Collector",
  dnf: "Selective Reader",
  audiobook: "Audiobook Lover",
};

const TRAIT_EMOJI: Record<string, string> = {
  fantasy: "🐉",
  mystery: "🕵",
  thriller: "😱",
  romance: "💌",
  "christian fiction": "🤍",
  "historical fiction": "🕰",
  "literary fiction": "📚",
  cozy: "☕",
  magical: "✨",
  heartwarming: "🤍",
  dark: "🌙",
  funny: "😂",
  adventurous: "🗺",
  whimsical: "🦋",
  inspired: "✨",
  comforted: "🧡",
  heartbroken: "💔",
  hopeful: "🤍",
  "mind blown": "🤯",
  excited: "⚡",
  scared: "😨",
  "found family": "🫶",
  "slow burn": "🔥",
  "chosen one": "👑",
  "enemies to lovers": "🗡",
  "morally grey": "🌑",
  "small town": "🏡",
  "second chance": "💫",
  "weekend binger": "📚",
  "audiobook lover": "🎧",
  "physical collector": "📖",
  "morning reader": "☀",
  "night owl": "🌙",
  "fast reader": "⚡",
  "slow savorer": "☕",
  finisher: "🏁",
  "selective reader": "🎯",
};

function titleCase(label: string): string {
  return label
    .split(" ")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function emojiFor(label: string): string {
  const key = label.toLocaleLowerCase();
  const fromDict = TOP_TRAITS_DICTIONARY[key as keyof typeof TOP_TRAITS_DICTIONARY];
  return fromDict?.emoji ?? TRAIT_EMOJI[key] ?? "📖";
}

function personaFor(label: string): string {
  const key = label.toLocaleLowerCase();
  const fromDict = TOP_TRAITS_DICTIONARY[key as keyof typeof TOP_TRAITS_DICTIONARY];
  return fromDict?.persona ?? `${titleCase(label)} Reader`;
}

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

function normalizePercents(rows: ReadingDnaTrait[]): ReadingDnaTrait[] {
  if (!rows.length) return rows;
  const total = rows.reduce((sum, row) => sum + row.score, 0) || 1;
  let assigned = 0;
  return rows.map((row, index) => {
    const percent =
      index === rows.length - 1
        ? Math.max(0, 100 - assigned)
        : Math.round((row.score / total) * 100);
    assigned += percent;
    return { ...row, percent };
  });
}

function toTraits(
  scores: Map<string, number>,
  category: ReadingDnaTraitCategory,
  sampleSize: number
): ReadingDnaTrait[] {
  const rows = [...scores.entries()]
    .filter(([key]) => key.startsWith(`${category}:`))
    .map(([key, score]) => {
      const label = key.slice(category.length + 1);
      const evidence = Math.min(1, score / Math.max(MIN_TRAIT_SCORE * 2, 4));
      const sampleBoost = Math.min(1, sampleSize / MIN_SAMPLE_FOR_MEDIUM);
      return {
        category,
        label,
        score,
        percent: 0,
        emoji: emojiFor(label),
        persona: personaFor(label),
        confidence: Number((evidence * 0.7 + sampleBoost * 0.3).toFixed(3)),
      } satisfies ReadingDnaTrait;
    })
    // Do not invent traits from a single weak hit.
    .filter((row) => row.score >= MIN_TRAIT_SCORE)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  if (category === "habit") {
    // Habits are labels with relative strength — not forced into the genre/vibe 100% pies.
    const max = rows[0]?.score ?? 1;
    return rows.map((row) => ({
      ...row,
      percent: Math.round((row.score / max) * 100),
    }));
  }

  return normalizePercents(rows);
}

function resolveConfidence(
  sampleSize: number,
  categoryCoverage: number
): { confidence: ReadingDnaConfidence; confidenceScore: number } {
  if (sampleSize <= 0 || categoryCoverage === 0) {
    return { confidence: "none", confidenceScore: 0 };
  }
  const score = Math.min(
    1,
    sampleSize / MIN_SAMPLE_FOR_HIGH * 0.65 + (categoryCoverage / 4) * 0.35
  );
  if (sampleSize < 3 || categoryCoverage < 1) {
    return { confidence: "low", confidenceScore: Number(score.toFixed(3)) };
  }
  if (sampleSize < MIN_SAMPLE_FOR_MEDIUM || categoryCoverage < 2) {
    return { confidence: "low", confidenceScore: Number(score.toFixed(3)) };
  }
  if (sampleSize < MIN_SAMPLE_FOR_HIGH || categoryCoverage < 3) {
    return { confidence: "medium", confidenceScore: Number(score.toFixed(3)) };
  }
  return { confidence: "high", confidenceScore: Number(score.toFixed(3)) };
}

/**
 * Builds deterministic Reading DNA traits from local reader data.
 * Genre / Vibe / Emotion / Trope each normalize to 100% independently.
 * Habits are separate labels with confidence — never mixed into those pies.
 * Weak/tiny libraries do not invent traits.
 */
export function computeReadingDna(input: ReadingDnaInput): ReadingDna {
  const scores = new Map<string, number>();
  const books = input.books ?? [];
  const reviews = input.reviews ?? [];
  const shelves = input.shelves ?? [];
  const sampleSize = books.length + reviews.length + shelves.length;

  for (const book of books) {
    addTerms(scores, "genre", book.subjects ?? [], book.rating && book.rating >= 4 ? 2 : 1);
    addTerms(scores, "trope", book.completion_tags ?? [], 1);
    if (book.shelf_status) addTerms(scores, "habit", [HABIT_LABELS[book.shelf_status]], 1);
    if (book.format === "audiobook") addTerms(scores, "habit", ["Audiobook Lover"], 2);
  }

  for (const review of reviews) {
    addTerms(scores, "emotion", review.feelings ?? [], review.rating && review.rating >= 4 ? 2 : 1);
    if (review.review_body) {
      addMatchingKeywords(scores, "vibe", review.review_body, VIBE_KEYWORDS);
      addMatchingKeywords(scores, "trope", review.review_body, TROPE_KEYWORDS);
      if (/morning|sunrise|coffee/i.test(review.review_body)) {
        addTerms(scores, "habit", ["Morning Reader"], 1);
      }
      if (/night|late|midnight/i.test(review.review_body)) {
        addTerms(scores, "habit", ["Night Owl"], 1);
      }
    }
  }

  for (const shelf of shelves) {
    addTerms(scores, "genre", [shelf.genre], 2);
    addMatchingKeywords(scores, "vibe", shelf.name ?? "", VIBE_KEYWORDS);
    addMatchingKeywords(scores, "trope", shelf.name ?? "", TROPE_KEYWORDS);
  }

  addTerms(scores, "trope", input.tags ?? [], 1);

  const genre = toTraits(scores, "genre", sampleSize);
  const vibe = toTraits(scores, "vibe", sampleSize);
  const emotion = toTraits(scores, "emotion", sampleSize);
  const trope = toTraits(scores, "trope", sampleSize);
  const habits = toTraits(scores, "habit", sampleSize);

  const categoryCoverage = [genre, vibe, emotion, trope].filter((rows) => rows.length > 0).length;
  const { confidence, confidenceScore } = resolveConfidence(sampleSize, categoryCoverage);

  const traits = [...genre, ...vibe, ...emotion, ...trope, ...habits].sort(
    (a, b) => b.score - a.score || a.label.localeCompare(b.label)
  );

  // Free top traits: only surface when we have enough confidence to avoid inventing identity.
  const rankedNonHabit = traits.filter((trait) => trait.category !== "habit");
  const topTraits =
    confidence === "none"
      ? []
      : rankedNonHabit.slice(0, FREE_READING_DNA_TRAIT_COUNT);
  const personaTraits =
    confidence === "none" || confidence === "low"
      ? topTraits
      : rankedNonHabit.slice(0, 5);

  const lead = topTraits.map((trait) => trait.persona ?? titleCase(trait.label));
  const summary =
    confidence === "none"
      ? "Add books, ratings, reviews, shelves, or tags to begin shaping your Reading DNA."
      : confidence === "low"
        ? "Early signals are forming — keep logging reads for a clearer DNA portrait."
        : lead.length
          ? `You read with feeling, get lost in ${lead[0] ? lead[0].toLocaleLowerCase() : "stories"}, and love books that leave a lasting impact.`
          : "Keep tagging finishes and feelings to sharpen your Reading DNA.";

  const topHabit = habits[0];
  const insight =
    confidence === "none" || confidence === "low"
      ? "Habit insights unlock as you log more sessions and tags."
      : topHabit
        ? `You're most likely a ${topHabit.persona ?? titleCase(topHabit.label)} — lean into that rhythm.`
        : "Keep logging sessions and tags to unlock habit insights.";

  return {
    topTraits,
    personaTraits,
    traits,
    categories: (["genre", "vibe", "emotion", "trope"] as const).map((category) => ({
      category,
      title: CATEGORY_META[category].title,
      subtitle: CATEGORY_META[category].subtitle,
      traits:
        category === "genre"
          ? genre
          : category === "vibe"
            ? vibe
            : category === "emotion"
              ? emotion
              : trope,
    })),
    habits,
    summary,
    insight,
    confidence,
    confidenceScore,
    sampleSize,
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

export function titleCaseDnaLabel(label: string): string {
  return titleCase(label);
}

/**
 * Deterministic Home personality from scored traits.
 * Official taxonomy names are an open product decision — reuse existing persona labels.
 */
export type ReadingPersonality = {
  label: string;
  explanation: string;
  sourceTraits: string[];
};

export function deriveReadingPersonality(dna: ReadingDna): ReadingPersonality | null {
  const lead = dna.personaTraits[0] ?? dna.topTraits[0] ?? dna.traits[0];
  if (!lead || dna.confidence === "none") return null;
  const label = lead.persona ?? `${titleCase(lead.label)} Reader`;
  const sources = (dna.personaTraits.length ? dna.personaTraits : dna.topTraits)
    .slice(0, 3)
    .map((trait) => trait.persona ?? titleCase(trait.label));
  const explanation = sources.length
    ? `Scored from your logged books, tags, and reviews — strongest signals: ${sources.join(", ")}.`
    : "Scored from your logged books, tags, and reviews.";
  return { label, explanation, sourceTraits: sources };
}
