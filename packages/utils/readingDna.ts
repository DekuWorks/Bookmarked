import {
  READING_DNA_CANONICAL_TROPES,
  READING_DNA_CANONICAL_VIBES,
  READING_DNA_EMPTY_EMOTION_COPY,
  READING_DNA_EMPTY_GENRE_COPY,
  READING_DNA_EMPTY_HABIT_COPY,
  READING_DNA_EMPTY_TROPE_COPY,
  READING_DNA_EMPTY_VIBE_COPY,
  READING_DNA_FORMING_COPY,
  READING_DNA_FREE_TRAIT_COUNT,
  READING_DNA_GENRE_WEIGHTS,
  READING_DNA_HABIT_LABELS,
  READING_DNA_HABIT_THRESHOLDS,
  READING_DNA_MIN_DATA_POINTS,
  READING_DNA_MOOD_TO_CATEGORY,
  READING_DNA_PERSONA_DICTIONARY,
  READING_DNA_PLUS_TRAIT_COUNT,
  READING_DNA_SAMPLE_FOR_HIGH,
  READING_DNA_SAMPLE_FOR_MEDIUM,
  READING_DNA_TAG_WEIGHTS,
  READING_DNA_TOP_TRAIT_COMPOSITION,
  READING_DNA_VERSION,
  type ReadingDnaHabitId,
} from "./readingDnaConfig";

export type ReadingDnaBookSignal = {
  subjects?: readonly string[] | null;
  rating?: number | null;
  isFavorite?: boolean;
  dnf?: boolean;
  reread?: boolean;
  readCount?: number | null;
  shelfStatus?: string | null;
  /** @deprecated use shelfStatus */
  shelf_status?: string | null;
  format?: string | null;
  finishedAt?: string | null;
  startedAt?: string | null;
  vibeTags?: readonly string[] | null;
  emotionTags?: readonly string[] | null;
  tropeTags?: readonly string[] | null;
  /** Legacy field — only canonical tropes are kept. Completion tags like Finished are ignored. */
  completion_tags?: readonly string[] | null;
};

export type ReadingDnaReviewSignal = {
  feelings?: readonly string[] | null;
  rating?: number | null;
  /** Ignored for vibe/trope inference. Kept so old callers compile. */
  review_body?: string | null;
};

export type ReadingDnaSessionSignal = {
  sessionDate?: string | null;
  createdAt?: string | null;
  pagesRead?: number | null;
  listeningSeconds?: number | null;
  mood?: string | null;
  sessionFormat?: string | null;
};

export type ReadingDnaPlaceVisit = {
  category?: "bookstore" | "library" | "reading_cafe" | string | null;
};

export type ReadingDnaInput = {
  books?: readonly ReadingDnaBookSignal[];
  reviews?: readonly ReadingDnaReviewSignal[];
  shelves?: ReadonlyArray<{ name?: string | null; genre?: string | null }>;
  tags?: readonly string[] | null;
  sessions?: readonly ReadingDnaSessionSignal[];
  placeVisits?: readonly ReadingDnaPlaceVisit[];
  now?: Date | string;
};

export type ReadingDnaTraitCategory = "genre" | "vibe" | "emotion" | "trope" | "habit";

export type ReadingDnaConfidence = "none" | "low" | "medium" | "high";

export type ReadingDnaTrait = {
  category: ReadingDnaTraitCategory;
  label: string;
  score: number;
  /** Share of its category (0–100). Habits use relative evidence, not a pie. */
  percent: number;
  emoji: string;
  persona?: string;
  confidence: number;
};

export type ReadingDnaCategoryBreakdown = {
  category: Exclude<ReadingDnaTraitCategory, "habit">;
  title: string;
  subtitle: string;
  emptyCopy: string;
  traits: ReadingDnaTrait[];
};

export type ReadingDnaHabit = ReadingDnaTrait & {
  habitId: ReadingDnaHabitId;
  evidenceCount: number;
};

export type ReadingDna = {
  dnaVersion: string;
  topTraits: ReadingDnaTrait[];
  personaTraits: ReadingDnaTrait[];
  traits: ReadingDnaTrait[];
  categories: ReadingDnaCategoryBreakdown[];
  habits: ReadingDnaHabit[];
  summary: string;
  insight: string;
  confidence: ReadingDnaConfidence;
  confidenceScore: number;
  sampleSize: number;
  dataPointsCount: number;
  forming: boolean;
  matchVector: ReadingDnaMatchVector;
};

export type ReadingDnaMatchVector = {
  version: string;
  genre: Record<string, number>;
  vibe: Record<string, number>;
  emotion: Record<string, number>;
  trope: Record<string, number>;
  habit: Record<string, number>;
};

export const FREE_READING_DNA_TRAIT_COUNT = READING_DNA_FREE_TRAIT_COUNT;

/** @deprecated Use READING_DNA_PERSONA_DICTIONARY — kept for existing imports. */
export const TOP_TRAITS_DICTIONARY = Object.fromEntries(
  Object.entries(READING_DNA_PERSONA_DICTIONARY).map(([key, value]) => [
    key,
    { persona: value.persona, emoji: "📖" },
  ])
) as Record<string, { persona: string; emoji: string }>;

const CATEGORY_META: Record<
  Exclude<ReadingDnaTraitCategory, "habit">,
  { title: string; subtitle: string; emptyCopy: string }
> = {
  genre: {
    title: "Genre DNA",
    subtitle: "What genres define you",
    emptyCopy: READING_DNA_EMPTY_GENRE_COPY,
  },
  vibe: {
    title: "Vibe DNA",
    subtitle: "How your books feel",
    emptyCopy: READING_DNA_EMPTY_VIBE_COPY,
  },
  emotion: {
    title: "Emotion DNA",
    subtitle: "How books make you feel",
    emptyCopy: READING_DNA_EMPTY_EMOTION_COPY,
  },
  trope: {
    title: "Trope DNA",
    subtitle: "Stories you gravitate toward",
    emptyCopy: READING_DNA_EMPTY_TROPE_COPY,
  },
};

const CANONICAL_VIBE_SET = new Set<string>(READING_DNA_CANONICAL_VIBES);
const CANONICAL_TROPE_SET = new Set<string>(READING_DNA_CANONICAL_TROPES);

export function normalizeDnaTag(value: string | null | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function titleCaseDnaLabel(label: string): string {
  return label
    .split(" ")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function classifyMoodTag(tag: string): "vibe" | "emotion" | null {
  const key = normalizeDnaTag(tag);
  if (!key) return null;
  if (key in READING_DNA_MOOD_TO_CATEGORY) {
    return READING_DNA_MOOD_TO_CATEGORY[key as keyof typeof READING_DNA_MOOD_TO_CATEGORY];
  }
  if (CANONICAL_VIBE_SET.has(key)) return "vibe";
  return null;
}

export function canonicalizeTrope(tag: string): string | null {
  const key = normalizeDnaTag(tag);
  return CANONICAL_TROPE_SET.has(key) ? key : null;
}

export function canonicalizeVibe(tag: string): string | null {
  const key = normalizeDnaTag(tag);
  if (CANONICAL_VIBE_SET.has(key)) return key;
  return classifyMoodTag(key) === "vibe" ? key : null;
}

function personaFor(label: string): string {
  const key = normalizeDnaTag(label);
  const fromDict = READING_DNA_PERSONA_DICTIONARY[key as keyof typeof READING_DNA_PERSONA_DICTIONARY];
  return fromDict?.persona ?? `${titleCaseDnaLabel(label)} Reader`;
}

function resolveNow(now?: Date | string): Date {
  if (!now) return new Date();
  return typeof now === "string" ? new Date(now) : now;
}

function daysBetween(later: Date, earlier: Date): number {
  return Math.max(0, (later.getTime() - earlier.getTime()) / 86_400_000);
}

function recencyMultiplier(finishedAt: string | null | undefined, now: Date): number {
  if (!finishedAt) return 1;
  const finished = new Date(finishedAt);
  if (!Number.isFinite(finished.getTime())) return 1;
  const days = daysBetween(now, finished);
  const half = READING_DNA_GENRE_WEIGHTS.recencyHalfLifeDays;
  const decay = Math.pow(0.5, days / half);
  return Math.max(READING_DNA_GENRE_WEIGHTS.recencyFloor, decay);
}

function ratingWeight(rating: number | null | undefined): number {
  if (rating == null || !Number.isFinite(rating)) return 0;
  if (rating <= 1.5) return READING_DNA_GENRE_WEIGHTS.rating1;
  if (rating <= 2.5) return READING_DNA_GENRE_WEIGHTS.rating2;
  if (rating <= 3.5) return READING_DNA_GENRE_WEIGHTS.rating3;
  if (rating <= 4.5) return READING_DNA_GENRE_WEIGHTS.rating4;
  return READING_DNA_GENRE_WEIGHTS.rating5;
}

function shelfStatusOf(book: ReadingDnaBookSignal): string {
  return book.shelfStatus ?? book.shelf_status ?? "";
}

function isAudiobookFormat(format: string | null | undefined): boolean {
  return (format ?? "").toLocaleLowerCase() === "audiobook";
}

function isPhysicalFormat(format: string | null | undefined): boolean {
  const key = (format ?? "").toLocaleLowerCase();
  return key === "book" || key === "hardcover" || key === "paperback" || key === "physical";
}

export function largestRemainderPercents(scores: readonly number[]): number[] {
  if (!scores.length) return [];
  const total = scores.reduce((sum, score) => sum + Math.max(0, score), 0);
  if (total <= 0) return scores.map(() => 0);
  const exact = scores.map((score) => (Math.max(0, score) / total) * 100);
  const floors = exact.map((value) => Math.floor(value));
  let remainder = 100 - floors.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  const out = [...floors];
  for (let i = 0; i < remainder; i += 1) {
    const slot = order[i % order.length];
    if (slot) out[slot.index] += 1;
  }
  return out;
}

function addScore(map: Map<string, number>, label: string, delta: number): void {
  const key = normalizeDnaTag(label);
  if (!key || delta === 0) return;
  map.set(key, (map.get(key) ?? 0) + delta);
}

function splitSubjects(subjects: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const subject of subjects ?? []) {
    const key = normalizeDnaTag(subject);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function bookGenreWeight(book: ReadingDnaBookSignal, now: Date): number {
  const status = shelfStatusOf(book);
  const dnf = Boolean(book.dnf || status === "dnf");
  let weight = 0;
  if (dnf) {
    weight += READING_DNA_GENRE_WEIGHTS.dnf;
  } else if (status === "read") {
    weight += READING_DNA_GENRE_WEIGHTS.finished;
  } else if (status === "currently_reading") {
    weight += READING_DNA_GENRE_WEIGHTS.currentlyReading;
  } else if (status === "want_to_read") {
    weight += READING_DNA_GENRE_WEIGHTS.wantToRead;
  } else {
    weight += 0.3;
  }
  weight += ratingWeight(book.rating);
  if (book.isFavorite) weight += READING_DNA_GENRE_WEIGHTS.favorite;
  const extraReads = Math.max(0, (book.readCount ?? (book.reread ? 2 : 1)) - 1);
  if (book.reread || extraReads > 0) {
    weight += Math.min(
      READING_DNA_GENRE_WEIGHTS.rereadCap,
      READING_DNA_GENRE_WEIGHTS.reread * extraReads || READING_DNA_GENRE_WEIGHTS.reread
    );
  }
  weight *= recencyMultiplier(book.finishedAt, now);
  return weight;
}

function toCategoryTraits(
  scores: Map<string, number>,
  category: Exclude<ReadingDnaTraitCategory, "habit">,
  sampleSize: number
): ReadingDnaTrait[] {
  const rows = [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const percents = largestRemainderPercents(rows.map(([, score]) => score));
  return rows.map(([label, score], index) => {
    const evidence = Math.min(1, score / 4);
    const sampleBoost = Math.min(1, sampleSize / READING_DNA_SAMPLE_FOR_MEDIUM);
    return {
      category,
      label,
      score: Number(score.toFixed(4)),
      percent: percents[index] ?? 0,
      emoji: "📖",
      persona: personaFor(label),
      confidence: Number((evidence * 0.7 + sampleBoost * 0.3).toFixed(3)),
    } satisfies ReadingDnaTrait;
  });
}

function sessionHour(session: ReadingDnaSessionSignal): number | null {
  const raw = session.createdAt;
  if (!raw) return null;
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return null;
  return date.getUTCHours();
}

function isWeekend(session: ReadingDnaSessionSignal): boolean {
  const raw = session.sessionDate ?? session.createdAt;
  if (!raw) return false;
  const date = new Date(raw.includes("T") ? raw : `${raw}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) return false;
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function classifyHabits(input: ReadingDnaInput): ReadingDnaHabit[] {
  const books = input.books ?? [];
  const sessions = input.sessions ?? [];
  const visits = input.placeVisits ?? [];
  const t = READING_DNA_HABIT_THRESHOLDS;
  const evidence = new Map<ReadingDnaHabitId, number>();

  let morning = 0;
  let night = 0;
  let weekend = 0;
  let sessionPages: number[] = [];
  for (const session of sessions) {
    const hour = sessionHour(session);
    if (hour != null && hour < t.morningHourEnd) morning += 1;
    if (hour != null && hour >= t.nightHourStart) night += 1;
    if (isWeekend(session)) weekend += 1;
    if ((session.pagesRead ?? 0) > 0) sessionPages.push(session.pagesRead ?? 0);
  }
  if (morning >= t.morningMinSessions) evidence.set("morning_reader", morning);
  if (night >= t.nightMinSessions) evidence.set("night_owl", night);
  const weekendShare = sessions.length ? weekend / sessions.length : 0;
  if (weekend >= t.weekendMinSessions && weekendShare >= t.weekendShare) {
    evidence.set("weekend_binger", weekend);
  }

  const finishedOrLogged = books.filter((book) => {
    const status = shelfStatusOf(book);
    return status === "read" || status === "currently_reading" || status === "dnf" || book.dnf;
  });
  const audiobooks = books.filter((book) => isAudiobookFormat(book.format)).length;
  const physical = books.filter((book) => isPhysicalFormat(book.format)).length;
  const formatDenom = Math.max(finishedOrLogged.length, books.length, 1);
  if (audiobooks >= t.audiobookMinCount && audiobooks / formatDenom >= t.audiobookShare) {
    evidence.set("audiobook_lover", audiobooks);
  }
  if (physical >= t.physicalMinCount && physical / formatDenom >= t.physicalShare) {
    evidence.set("physical_collector", physical);
  }

  if (sessionPages.length >= t.paceMinSessions) {
    const avg = sessionPages.reduce((sum, n) => sum + n, 0) / sessionPages.length;
    if (avg >= t.fastPagesPerSession) evidence.set("fast_reader", sessionPages.length);
    if (avg <= t.slowPagesPerSession) evidence.set("slow_savorer", sessionPages.length);
  }

  const libraryVisits = visits.filter((visit) => visit.category === "library").length;
  const bookstoreVisits = visits.filter((visit) => visit.category === "bookstore").length;
  if (libraryVisits >= t.libraryMinVisits) evidence.set("library_lover", libraryVisits);
  if (bookstoreVisits >= t.bookstoreMinVisits) {
    evidence.set("bookstore_explorer", bookstoreVisits);
  }

  if (!t.allowBothMorningNight && evidence.has("morning_reader") && evidence.has("night_owl")) {
    const drop =
      (evidence.get("morning_reader") ?? 0) >= (evidence.get("night_owl") ?? 0)
        ? "night_owl"
        : "morning_reader";
    evidence.delete(drop);
  }
  if (!t.allowBothFastSlow && evidence.has("fast_reader") && evidence.has("slow_savorer")) {
    const drop =
      (evidence.get("fast_reader") ?? 0) >= (evidence.get("slow_savorer") ?? 0)
        ? "slow_savorer"
        : "fast_reader";
    evidence.delete(drop);
  }

  const rows = [...evidence.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
  const max = rows[0]?.[1] ?? 1;
  return rows.map(([habitId, count]) => {
    const label = READING_DNA_HABIT_LABELS[habitId];
    return {
      category: "habit" as const,
      habitId,
      label,
      score: count,
      percent: Math.round((count / max) * 100),
      emoji: "📖",
      persona: personaFor(label),
      confidence: Number(Math.min(1, count / 8).toFixed(3)),
      evidenceCount: count,
    };
  });
}

function selectBalancedTraits(
  genre: ReadingDnaTrait[],
  vibe: ReadingDnaTrait[],
  emotion: ReadingDnaTrait[],
  trope: ReadingDnaTrait[],
  habits: ReadingDnaHabit[],
  count: number
): ReadingDnaTrait[] {
  const byCategory: Record<string, ReadingDnaTrait[]> = {
    genre,
    vibe,
    emotion,
    trope,
    habit: habits,
  };
  const selected: ReadingDnaTrait[] = [];
  for (const category of READING_DNA_TOP_TRAIT_COMPOSITION) {
    const lead = byCategory[category]?.[0];
    if (lead) selected.push(lead);
    if (selected.length >= count) break;
  }
  if (selected.length < count) {
    const used = new Set(selected.map((trait) => `${trait.category}:${trait.label}`));
    const rest = [...genre, ...vibe, ...emotion, ...trope, ...habits]
      .filter((trait) => !used.has(`${trait.category}:${trait.label}`))
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
    for (const trait of rest) {
      selected.push(trait);
      if (selected.length >= count) break;
    }
  }
  return selected.slice(0, count);
}

function countDataPoints(input: ReadingDnaInput): number {
  const books = input.books ?? [];
  const reviews = input.reviews ?? [];
  const sessions = input.sessions ?? [];
  let points = 0;
  for (const book of books) {
    if (splitSubjects(book.subjects).length) points += 1;
    if (book.rating != null) points += 1;
    if (book.isFavorite) points += 1;
    if ((book.vibeTags ?? []).length || (book.emotionTags ?? []).length || (book.tropeTags ?? []).length) {
      points += 1;
    }
    if (book.reread || (book.readCount ?? 1) > 1) points += 1;
  }
  for (const review of reviews) {
    if ((review.feelings ?? []).length) points += 1;
    if (review.rating != null) points += 1;
  }
  points += sessions.filter((session) => (session.pagesRead ?? 0) > 0 || (session.listeningSeconds ?? 0) > 0)
    .length;
  points += (input.tags ?? []).length ? 1 : 0;
  points += (input.shelves ?? []).filter((shelf) => shelf.genre).length;
  return points;
}

function resolveConfidence(
  dataPoints: number,
  categoryCoverage: number
): { confidence: ReadingDnaConfidence; confidenceScore: number } {
  if (dataPoints <= 0 || categoryCoverage === 0) {
    return { confidence: "none", confidenceScore: 0 };
  }
  const score = Math.min(
    1,
    (dataPoints / READING_DNA_SAMPLE_FOR_HIGH) * 0.65 + (categoryCoverage / 4) * 0.35
  );
  if (dataPoints < 3 || categoryCoverage < 1) {
    return { confidence: "low", confidenceScore: Number(score.toFixed(3)) };
  }
  if (dataPoints < READING_DNA_SAMPLE_FOR_MEDIUM || categoryCoverage < 2) {
    return { confidence: "low", confidenceScore: Number(score.toFixed(3)) };
  }
  if (dataPoints < READING_DNA_SAMPLE_FOR_HIGH || categoryCoverage < 3) {
    return { confidence: "medium", confidenceScore: Number(score.toFixed(3)) };
  }
  return { confidence: "high", confidenceScore: Number(score.toFixed(3)) };
}

function vectorFromTraits(
  traits: ReadingDnaTrait[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const trait of traits) {
    out[trait.label] = trait.percent / 100;
  }
  return out;
}

/**
 * Deterministic Reading DNA from local reader data.
 * AI must not invent these percentages. Genre / vibe / emotion / trope each
 * sum to 100% via largest remainder. Habits are labels, not a pie.
 */
export function computeReadingDna(input: ReadingDnaInput): ReadingDna {
  const now = resolveNow(input.now);
  const books = input.books ?? [];
  const reviews = input.reviews ?? [];
  const shelves = input.shelves ?? [];
  const genreScores = new Map<string, number>();
  const vibeScores = new Map<string, number>();
  const emotionScores = new Map<string, number>();
  const tropeScores = new Map<string, number>();
  const genrePositive = new Map<string, number>();

  for (const book of books) {
    const subjects = splitSubjects(book.subjects);
    const weight = bookGenreWeight(book, now);
    if (subjects.length && weight !== 0) {
      const share = weight / subjects.length;
      for (const subject of subjects) {
        addScore(genreScores, subject, share);
        if (share > 0) addScore(genrePositive, subject, share);
      }
    }
    const tagBoost =
      READING_DNA_TAG_WEIGHTS.applied +
      ((book.rating ?? 0) >= 4 ? READING_DNA_TAG_WEIGHTS.highRating : 0) +
      (book.isFavorite ? READING_DNA_TAG_WEIGHTS.favorite : 0);
    for (const tag of book.vibeTags ?? []) {
      const vibe = canonicalizeVibe(tag);
      if (vibe) addScore(vibeScores, vibe, tagBoost);
    }
    for (const tag of book.emotionTags ?? []) {
      const classified = classifyMoodTag(tag);
      if (classified === "emotion") addScore(emotionScores, normalizeDnaTag(tag), tagBoost);
    }
    const tropeSources = [...(book.tropeTags ?? []), ...(book.completion_tags ?? [])];
    for (const tag of tropeSources) {
      const trope = canonicalizeTrope(tag);
      if (trope) addScore(tropeScores, trope, tagBoost);
    }
  }

  for (const [label, score] of genreScores) {
    if (score >= 0) continue;
    const floor = (genrePositive.get(label) ?? 0) * READING_DNA_GENRE_WEIGHTS.dnfFloorRatio;
    genreScores.set(label, Math.max(score, floor));
  }

  for (const review of reviews) {
    const boost =
      READING_DNA_TAG_WEIGHTS.applied +
      ((review.rating ?? 0) >= 4 ? READING_DNA_TAG_WEIGHTS.highRating : 0);
    for (const feeling of review.feelings ?? []) {
      const classified = classifyMoodTag(feeling);
      const key = normalizeDnaTag(feeling);
      if (!key) continue;
      if (classified === "vibe") addScore(vibeScores, key, boost);
      else addScore(emotionScores, key, boost);
    }
  }

  for (const session of input.sessions ?? []) {
    if (!session.mood) continue;
    const classified = classifyMoodTag(session.mood);
    const key = normalizeDnaTag(session.mood);
    if (!key) continue;
    if (classified === "vibe") addScore(vibeScores, key, READING_DNA_TAG_WEIGHTS.applied);
    else if (classified === "emotion") addScore(emotionScores, key, READING_DNA_TAG_WEIGHTS.applied);
  }

  for (const shelf of shelves) {
    if (shelf.genre) addScore(genreScores, shelf.genre, 0.6);
  }

  for (const tag of input.tags ?? []) {
    const trope = canonicalizeTrope(tag);
    if (trope) addScore(tropeScores, trope, READING_DNA_TAG_WEIGHTS.applied);
    const vibe = canonicalizeVibe(tag);
    if (vibe) addScore(vibeScores, vibe, READING_DNA_TAG_WEIGHTS.applied);
  }

  const dataPointsCount = countDataPoints(input);
  const sampleSize = books.length + reviews.length + (input.sessions ?? []).length;
  const forming = dataPointsCount < READING_DNA_MIN_DATA_POINTS;

  const genre = forming ? [] : toCategoryTraits(genreScores, "genre", sampleSize);
  const vibe = forming ? [] : toCategoryTraits(vibeScores, "vibe", sampleSize);
  const emotion = forming ? [] : toCategoryTraits(emotionScores, "emotion", sampleSize);
  const trope = forming ? [] : toCategoryTraits(tropeScores, "trope", sampleSize);
  const habits = forming ? [] : classifyHabits(input);

  const categoryCoverage = [genre, vibe, emotion, trope].filter((rows) => rows.length > 0).length;
  const { confidence, confidenceScore } = forming
    ? { confidence: "low" as const, confidenceScore: Number((dataPointsCount / READING_DNA_MIN_DATA_POINTS).toFixed(3)) }
    : resolveConfidence(dataPointsCount, categoryCoverage);

  const topTraits = forming
    ? []
    : selectBalancedTraits(genre, vibe, emotion, trope, habits, READING_DNA_FREE_TRAIT_COUNT);
  const personaTraits = forming
    ? []
    : selectBalancedTraits(genre, vibe, emotion, trope, habits, READING_DNA_PLUS_TRAIT_COUNT);

  const traits = [...genre, ...vibe, ...emotion, ...trope, ...habits].sort(
    (a, b) => b.score - a.score || a.label.localeCompare(b.label)
  );

  const lead = topTraits.map((trait) => trait.persona ?? titleCaseDnaLabel(trait.label));
  const summary = forming
    ? READING_DNA_FORMING_COPY
    : confidence === "none"
      ? "Add books, ratings, tags, or sessions to begin shaping your Reading DNA."
      : lead.length
        ? `You read with ${lead[0] ? lead[0].toLocaleLowerCase() : "feeling"} — scored from your logged books, tags, and sessions.`
        : "Keep tagging finishes and feelings to sharpen your Reading DNA.";

  const topHabit = habits[0];
  const insight = forming
    ? READING_DNA_EMPTY_HABIT_COPY
    : topHabit
      ? `Strongest habit signal: ${topHabit.persona ?? titleCaseDnaLabel(topHabit.label)}.`
      : READING_DNA_EMPTY_HABIT_COPY;

  const matchVector: ReadingDnaMatchVector = {
    version: READING_DNA_VERSION,
    genre: vectorFromTraits(genre),
    vibe: vectorFromTraits(vibe),
    emotion: vectorFromTraits(emotion),
    trope: vectorFromTraits(trope),
    habit: Object.fromEntries(habits.map((habit) => [habit.habitId, 1])),
  };

  return {
    dnaVersion: READING_DNA_VERSION,
    topTraits,
    personaTraits,
    traits,
    categories: (["genre", "vibe", "emotion", "trope"] as const).map((category) => ({
      category,
      title: CATEGORY_META[category].title,
      subtitle: CATEGORY_META[category].subtitle,
      emptyCopy: CATEGORY_META[category].emptyCopy,
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
    confidence: forming && dataPointsCount === 0 ? "none" : confidence,
    confidenceScore,
    sampleSize,
    dataPointsCount,
    forming,
    matchVector,
  };
}

export type ReadingPersonality = {
  label: string;
  explanation: string;
  sourceTraits: string[];
};

export function deriveReadingPersonality(dna: ReadingDna): ReadingPersonality | null {
  const lead = dna.personaTraits[0] ?? dna.topTraits[0] ?? dna.traits[0];
  if (!lead || dna.forming || dna.confidence === "none") return null;
  const label = lead.persona ?? `${titleCaseDnaLabel(lead.label)} Reader`;
  const sources = (dna.personaTraits.length ? dna.personaTraits : dna.topTraits)
    .slice(0, 3)
    .map((trait) => trait.persona ?? titleCaseDnaLabel(trait.label));
  const explanation = sources.length
    ? `Scored from your logged books, tags, and sessions — strongest signals: ${sources.join(", ")}.`
    : "Scored from your logged books, tags, and sessions.";
  return { label, explanation, sourceTraits: sources };
}

export function readingDnaStructuredSummary(dna: ReadingDna): {
  version: string;
  forming: boolean;
  confidence: ReadingDnaConfidence;
  dataPointsCount: number;
  topTraits: Array<{ category: string; label: string; percent: number }>;
  habits: string[];
  personality: string | null;
} {
  const personality = deriveReadingPersonality(dna);
  return {
    version: dna.dnaVersion,
    forming: dna.forming,
    confidence: dna.confidence,
    dataPointsCount: dna.dataPointsCount,
    topTraits: dna.personaTraits.map((trait) => ({
      category: trait.category,
      label: trait.label,
      percent: trait.percent,
    })),
    habits: dna.habits.map((habit) => habit.label),
    personality: personality?.label ?? null,
  };
}
