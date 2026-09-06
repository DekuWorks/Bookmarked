import {
  READING_DNA_FRIEND_MIN_MATCH_PERCENT,
  READING_DNA_MATCH_CATEGORY_WEIGHTS,
  READING_DNA_MATCH_NARROW_SHARED_GENRES,
  READING_DNA_MATCH_FOLLOWS_VISIBILITY_BY_DEFAULT,
  type ReadingDnaVisibility,
} from "./readingDnaConfig";
import type { ReadingDna, ReadingDnaMatchVector, ReadingDnaTrait } from "./readingDna";
import { titleCaseDnaLabel } from "./readingDna";

export type ReadingDnaMatchExplanation = {
  percent: number;
  reasons: string[];
};

export type ReadingDnaMatchPrivacy = {
  visibility: ReadingDnaVisibility;
  matchEnabled?: boolean | null;
  viewerFollowsTarget?: boolean;
};

/**
 * Cosine similarity on category-weighted percent vectors.
 * Symmetric. Habits are 0/1 presence. Documented in docs/reading-dna.md.
 */
export function cosineReadingDnaMatch(
  a: ReadingDnaMatchVector,
  b: ReadingDnaMatchVector
): number {
  const keys = new Set<string>();
  const left = new Map<string, number>();
  const right = new Map<string, number>();

  const ingest = (
    side: Map<string, number>,
    category: keyof typeof READING_DNA_MATCH_CATEGORY_WEIGHTS,
    values: Record<string, number>
  ) => {
    const weight = READING_DNA_MATCH_CATEGORY_WEIGHTS[category];
    for (const [label, value] of Object.entries(values)) {
      const key = `${category}:${label}`;
      keys.add(key);
      side.set(key, (side.get(key) ?? 0) + value * weight);
    }
  };

  ingest(left, "genre", a.genre);
  ingest(left, "vibe", a.vibe);
  ingest(left, "emotion", a.emotion);
  ingest(left, "trope", a.trope);
  ingest(left, "habit", a.habit);
  ingest(right, "genre", b.genre);
  ingest(right, "vibe", b.vibe);
  ingest(right, "emotion", b.emotion);
  ingest(right, "trope", b.trope);
  ingest(right, "habit", b.habit);

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const key of keys) {
    const av = left.get(key) ?? 0;
    const bv = right.get(key) ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return Math.round((dot / (Math.sqrt(normA) * Math.sqrt(normB))) * 100);
}

export function canExposeReadingDna(privacy: ReadingDnaMatchPrivacy): boolean {
  if (privacy.visibility === "private") return false;
  if (privacy.visibility === "public") return true;
  return Boolean(privacy.viewerFollowsTarget);
}

export function canMatchReadingDna(privacy: ReadingDnaMatchPrivacy): boolean {
  if (privacy.visibility === "private") return false;
  if (privacy.matchEnabled === false) return false;
  if (READING_DNA_MATCH_FOLLOWS_VISIBILITY_BY_DEFAULT && privacy.visibility === "followers") {
    return Boolean(privacy.viewerFollowsTarget);
  }
  return true;
}

export function visibleTraitsForMatch(
  traits: readonly ReadingDnaTrait[],
  privacy: ReadingDnaMatchPrivacy
): ReadingDnaTrait[] {
  if (!canExposeReadingDna(privacy)) return [];
  return [...traits];
}

export function explainReadingDnaMatch(
  self: ReadingDna,
  other: ReadingDna,
  otherPrivacy: ReadingDnaMatchPrivacy
): ReadingDnaMatchExplanation {
  if (!canMatchReadingDna(otherPrivacy) || !canExposeReadingDna(otherPrivacy)) {
    return { percent: 0, reasons: [] };
  }
  const percent = cosineReadingDnaMatch(self.matchVector, other.matchVector);
  const visible = visibleTraitsForMatch(other.topTraits.length ? other.topTraits : other.personaTraits, otherPrivacy);
  const selfKeys = new Set(
    (self.topTraits.length ? self.topTraits : self.personaTraits).map(
      (trait) => `${trait.category}:${trait.label}`
    )
  );
  const reasons = visible
    .filter((trait) => selfKeys.has(`${trait.category}:${trait.label}`))
    .slice(0, 4)
    .map((trait) => `You both lean ${titleCaseDnaLabel(trait.label)} (${trait.category})`);
  return { percent, reasons };
}

export function readingDnaMatchPercent(a: ReadingDna, b: ReadingDna): number {
  return cosineReadingDnaMatch(a.matchVector, b.matchVector);
}

export function sharesEnoughGenres(
  a: ReadingDnaMatchVector,
  b: ReadingDnaMatchVector,
  minShared = READING_DNA_MATCH_NARROW_SHARED_GENRES
): boolean {
  const aTop = Object.entries(a.genre)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([label]) => label);
  const bSet = new Set(Object.keys(b.genre));
  const shared = aTop.filter((label) => bSet.has(label)).length;
  return shared >= minShared;
}

export type ReadingDnaMatchCandidate = {
  userId: string;
  vector: ReadingDnaMatchVector;
  privacy: ReadingDnaMatchPrivacy;
  visibleTraits?: ReadingDnaTrait[];
};

/**
 * Narrow by shared top genres, then score. Never N×N all users.
 * Private DNA is dropped before scoring.
 */
export function scoreReadingDnaCandidates(
  self: ReadingDna,
  candidates: readonly ReadingDnaMatchCandidate[]
): Array<{ userId: string; percent: number; reasons: string[] }> {
  const narrowed = candidates.filter(
    (candidate) =>
      canMatchReadingDna(candidate.privacy) &&
      canExposeReadingDna(candidate.privacy) &&
      sharesEnoughGenres(self.matchVector, candidate.vector)
  );
  return narrowed
    .map((candidate) => {
      const percent = cosineReadingDnaMatch(self.matchVector, candidate.vector);
      const reasons = (candidate.visibleTraits ?? [])
        .filter((trait) =>
          self.topTraits.some((own) => own.category === trait.category && own.label === trait.label)
        )
        .slice(0, 3)
        .map((trait) => `Shared ${titleCaseDnaLabel(trait.label)}`);
      return { userId: candidate.userId, percent, reasons };
    })
    .sort((a, b) => b.percent - a.percent || a.userId.localeCompare(b.userId));
}

export function friendSuggestionEligible(percent: number): boolean {
  return percent >= READING_DNA_FRIEND_MIN_MATCH_PERCENT;
}
