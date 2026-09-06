import { READING_DNA_FRIEND_MIN_MATCH_PERCENT } from "./readingDnaConfig";
import {
  canonicalizeTrope,
  canonicalizeVibe,
  classifyMoodTag,
  normalizeDnaTag,
  titleCaseDnaLabel,
  type ReadingDna,
  type ReadingDnaMatchVector,
} from "./readingDna";
import { cosineReadingDnaMatch } from "./readingDnaMatch";

export type ReadingDnaBookCandidate = {
  id: string;
  title: string;
  subjects?: readonly string[] | null;
  vibeTags?: readonly string[] | null;
  tropeTags?: readonly string[] | null;
  emotionTags?: readonly string[] | null;
};

export type ReadingDnaBookMatch = {
  id: string;
  title: string;
  percent: number;
  explanation: string;
};

export function bookSignalToMatchVector(book: ReadingDnaBookCandidate): ReadingDnaMatchVector {
  const genre: Record<string, number> = {};
  const subjects = [...new Set((book.subjects ?? []).map((subject) => normalizeDnaTag(subject)).filter(Boolean))];
  const share = subjects.length ? 1 / subjects.length : 0;
  for (const subject of subjects) genre[subject] = share;

  const vibe: Record<string, number> = {};
  for (const tag of book.vibeTags ?? []) {
    const vibeId = canonicalizeVibe(tag);
    if (vibeId) vibe[vibeId] = (vibe[vibeId] ?? 0) + 1;
  }
  const trope: Record<string, number> = {};
  for (const tag of book.tropeTags ?? []) {
    const tropeId = canonicalizeTrope(tag);
    if (tropeId) trope[tropeId] = (trope[tropeId] ?? 0) + 1;
  }
  const emotion: Record<string, number> = {};
  for (const tag of book.emotionTags ?? []) {
    if (classifyMoodTag(tag) === "emotion") {
      const key = normalizeDnaTag(tag);
      emotion[key] = (emotion[key] ?? 0) + 1;
    }
  }
  const normalize = (map: Record<string, number>) => {
    const total = Object.values(map).reduce((sum, value) => sum + value, 0);
    if (total <= 0) return {};
    return Object.fromEntries(Object.entries(map).map(([key, value]) => [key, value / total]));
  };

  return {
    version: "book",
    genre,
    vibe: normalize(vibe),
    emotion: normalize(emotion),
    trope: normalize(trope),
    habit: {},
  };
}

export function scoreBookDnaMatches(
  dna: ReadingDna,
  books: readonly ReadingDnaBookCandidate[]
): ReadingDnaBookMatch[] {
  if (dna.forming) return [];
  return books
    .map((book) => {
      const vector = bookSignalToMatchVector(book);
      const percent = cosineReadingDnaMatch(dna.matchVector, vector);
      const overlap = [
        ...Object.keys(vector.genre).filter((label) => dna.matchVector.genre[label]),
        ...Object.keys(vector.vibe).filter((label) => dna.matchVector.vibe[label]),
        ...Object.keys(vector.trope).filter((label) => dna.matchVector.trope[label]),
      ]
        .slice(0, 3)
        .map(titleCaseDnaLabel);
      return {
        id: book.id,
        title: book.title,
        percent,
        explanation: overlap.length
          ? `Matches your ${overlap.join(", ")} DNA.`
          : "Nearby to your Reading DNA.",
      };
    })
    .sort((a, b) => b.percent - a.percent || a.title.localeCompare(b.title));
}

export type ReadingDnaClubCandidate = {
  id: string;
  name: string;
  genres?: readonly string[] | null;
  tropes?: readonly string[] | null;
};

export function scoreClubDnaMatches(
  dna: ReadingDna,
  clubs: readonly ReadingDnaClubCandidate[]
): Array<{ id: string; name: string; percent: number; explanation: string }> {
  return scoreBookDnaMatches(
    dna,
    clubs.map((club) => ({
      id: club.id,
      title: club.name,
      subjects: club.genres,
      tropeTags: club.tropes,
    }))
  ).map((row) => ({
    id: row.id,
    name: row.title,
    percent: row.percent,
    explanation: row.explanation,
  }));
}

export type ReadingDnaFriendCandidate = {
  userId: string;
  matchPercent: number;
  mutualFollows?: number;
  sharedClubs?: number;
  sameCity?: boolean;
};

/**
 * DNA is the major signal. Mutual follows / clubs / city are extensible extras.
 * Weights here are provisional.
 */
export function scoreFriendSuggestions(
  candidates: readonly ReadingDnaFriendCandidate[]
): Array<ReadingDnaFriendCandidate & { score: number }> {
  return candidates
    .filter((candidate) => candidate.matchPercent >= READING_DNA_FRIEND_MIN_MATCH_PERCENT)
    .map((candidate) => {
      const social =
        (candidate.mutualFollows ?? 0) * 4 +
        (candidate.sharedClubs ?? 0) * 6 +
        (candidate.sameCity ? 8 : 0);
      return { ...candidate, score: candidate.matchPercent + social };
    })
    .sort((a, b) => b.score - a.score || a.userId.localeCompare(b.userId));
}
