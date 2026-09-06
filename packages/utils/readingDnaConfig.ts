/**
 * Central Reading DNA config.
 *
 * Every weight, threshold, and composition rule lives here. Defaults are
 * **provisional / pending product approval**. Do not invent a second copy of
 * these numbers in UI or SQL.
 *
 * Open product questions this file encodes (do not treat as final):
 * 1. Exact scoring weights
 * 2. Min data points before DNA is visible
 * 3. Top trait composition
 * 4. Official personality names (reuse existing personas only)
 * 5. Exact habit thresholds
 * 6. Free Top 3 default visibility vs profile privacy
 * 7. Exact Match category weights
 * 8. Min match % for friend suggestions
 * 9. Disable Match while DNA is public
 * 10. Exclusive Home badge names (placeholder IDs only)
 * 11. Monthly snapshot: calendar month vs rolling 30d
 * 12. Faith / Christian Fiction genres are normal catalog data only
 */

export const READING_DNA_VERSION = "2026.09.1";

export const READING_DNA_CONFIG_STATUS = "provisional / pending product approval" as const;

export type ReadingDnaVisibility = "public" | "followers" | "private";

export type ReadingDnaPeriodType = "monthly" | "yearly";

/** FLAG #11 — calendar month is the default. Rolling 30d is not implemented. */
export const READING_DNA_MONTHLY_PERIOD: "calendar_month" | "rolling_30d" =
  "calendar_month";

/** FLAG #2 — min distinct data points before traits are shown (not just forming copy). */
export const READING_DNA_MIN_DATA_POINTS = 8;

export const READING_DNA_SAMPLE_FOR_MEDIUM = 8;
export const READING_DNA_SAMPLE_FOR_HIGH = 24;

/** FLAG #6 — Free Top 3 follows DNA visibility. Default is followers, not public. */
export const READING_DNA_DEFAULT_VISIBILITY: ReadingDnaVisibility = "followers";

/**
 * FLAG #9 — when false, Match follows DNA visibility (private blocks Match).
 * Column exists so product can later allow “DNA public, Match off”.
 */
export const READING_DNA_MATCH_FOLLOWS_VISIBILITY_BY_DEFAULT = true;

/** Home MoM: hide category shifts below this percent-point delta. */
export const READING_DNA_MOM_CHANGE_THRESHOLD = 5;

/** Recalc debounce on the client after a stale mark. */
export const READING_DNA_RECALC_DEBOUNCE_MS = 8_000;

/**
 * FLAG #1 — genre event weights.
 * DNF is a soft negative. Reread is strong but capped. One 1-star must not
 * wipe a genre that already has positive evidence.
 */
export const READING_DNA_GENRE_WEIGHTS = {
  finished: 1.2,
  currentlyReading: 0.45,
  wantToRead: 0.2,
  dnf: -0.35,
  favorite: 0.8,
  reread: 0.9,
  rereadCap: 1.8,
  rating1: -0.15,
  rating2: 0.1,
  rating3: 0.35,
  rating4: 0.7,
  rating5: 1.0,
  /** Extra boost when rated ≥ 4 on a finished book (already counted via ratingN). */
  highRatingFinished: 0,
  recencyHalfLifeDays: 365,
  recencyFloor: 0.45,
  /** After all events, a genre with prior positive score cannot fall below this share of its pre-DNF total. */
  dnfFloorRatio: 0.35,
} as const;

/** Tag / feeling event weights (vibe, emotion, trope). */
export const READING_DNA_TAG_WEIGHTS = {
  applied: 1,
  highRating: 0.5,
  favorite: 0.4,
} as const;

/**
 * Existing Bookmarked mood tags classified for DNA.
 * Emotion reuses the same tagging system — no duplicate vocabulary.
 */
export const READING_DNA_MOOD_TO_CATEGORY = {
  cozy: "vibe",
  dark: "vibe",
  funny: "vibe",
  suspenseful: "vibe",
  romantic: "vibe",
  adventurous: "vibe",
  heartwarming: "vibe",
  happy: "emotion",
  emotional: "emotion",
  melancholy: "emotion",
  inspiring: "emotion",
  "thought-provoking": "emotion",
  hopeful: "emotion",
  comforted: "emotion",
  heartbroken: "emotion",
  "mind blown": "emotion",
  excited: "emotion",
  scared: "emotion",
  inspired: "emotion",
} as const satisfies Record<string, "vibe" | "emotion">;

/** Canonical vibe IDs (user-applied tags only). */
export const READING_DNA_CANONICAL_VIBES = [
  "cozy",
  "dark",
  "funny",
  "suspenseful",
  "romantic",
  "adventurous",
  "heartwarming",
  "magical",
  "whimsical",
  "atmospheric",
  "wistful",
] as const;

/** Canonical trope IDs — case-normalised at ingest. */
export const READING_DNA_CANONICAL_TROPES = [
  "found family",
  "enemies to lovers",
  "slow burn",
  "chosen one",
  "second chance",
  "morally grey",
  "small town",
  "coming of age",
] as const;

export type ReadingDnaHabitId =
  | "morning_reader"
  | "night_owl"
  | "weekend_binger"
  | "audiobook_lover"
  | "physical_collector"
  | "fast_reader"
  | "slow_savorer"
  | "library_lover"
  | "bookstore_explorer";

/**
 * FLAG #5 — habit evidence floors.
 * 1 audiobook ≠ Audiobook Lover. Contradictory pairs need both sides to clear
 * their floors *and* `allowBoth` before both can appear.
 */
export const READING_DNA_HABIT_THRESHOLDS = {
  morningHourEnd: 11,
  nightHourStart: 21,
  morningMinSessions: 6,
  nightMinSessions: 6,
  weekendMinSessions: 5,
  weekendShare: 0.45,
  audiobookMinCount: 4,
  audiobookShare: 0.4,
  physicalMinCount: 6,
  physicalShare: 0.55,
  fastPagesPerSession: 40,
  slowPagesPerSession: 18,
  paceMinSessions: 6,
  libraryMinVisits: 4,
  bookstoreMinVisits: 4,
  allowBothMorningNight: false,
  allowBothFastSlow: false,
} as const;

export const READING_DNA_HABIT_LABELS: Record<ReadingDnaHabitId, string> = {
  morning_reader: "Morning Reader",
  night_owl: "Night Owl",
  weekend_binger: "Weekend Binger",
  audiobook_lover: "Audiobook Lover",
  physical_collector: "Physical Collector",
  fast_reader: "Fast Reader",
  slow_savorer: "Slow Savorer",
  library_lover: "Library Lover",
  bookstore_explorer: "Bookstore Explorer",
};

/**
 * FLAG #3 — balanced top-trait selector.
 * Free shows the first 3 filled slots. Plus/Home show all filled slots (max 5).
 */
export const READING_DNA_TOP_TRAIT_COMPOSITION = [
  "genre",
  "vibe",
  "emotion",
  "trope",
  "habit",
] as const;

export const READING_DNA_FREE_TRAIT_COUNT = 3;
export const READING_DNA_PLUS_TRAIT_COUNT = 5;

/**
 * FLAG #7 — Match category weights for cosine similarity.
 * Formula is cosine on the concatenated, category-weighted percent vectors.
 */
export const READING_DNA_MATCH_CATEGORY_WEIGHTS = {
  genre: 0.35,
  vibe: 0.2,
  emotion: 0.15,
  trope: 0.2,
  habit: 0.1,
} as const;

/** FLAG #8 — friend suggestions hide matches below this percent. */
export const READING_DNA_FRIEND_MIN_MATCH_PERCENT = 55;

/** Candidate-narrow: require at least this many shared top-genre keys before scoring. */
export const READING_DNA_MATCH_NARROW_SHARED_GENRES = 1;

export const READING_DNA_MATCH_CANDIDATE_LIMIT = 40;

export const READING_DNA_FORMING_COPY = "Your Reading DNA is still forming.";

export const READING_DNA_EMPTY_EMOTION_COPY =
  "Keep tagging how books make you feel…";

export const READING_DNA_EMPTY_VIBE_COPY =
  "Tag the mood or vibe of a finish to shape this strand.";

export const READING_DNA_EMPTY_TROPE_COPY =
  "Add story tropes when you finish a book to shape this strand.";

export const READING_DNA_EMPTY_GENRE_COPY =
  "Finish and rate a few books to shape your Genre DNA.";

export const READING_DNA_EMPTY_HABIT_COPY =
  "Log a handful of sessions before habit labels appear.";

/**
 * FLAG #4 — existing persona labels only. Official taxonomy is open.
 */
export const READING_DNA_PERSONA_DICTIONARY = {
  cozy: { persona: "Cozy Reader", token: "cozy" },
  fantasy: { persona: "Fantasy Lover", token: "fantasy" },
  emotional: { persona: "Emotional Explorer", token: "emotional" },
  heartbroken: { persona: "Emotional Explorer", token: "heartbroken" },
  hopeful: { persona: "Hopeful Heart", token: "hopeful" },
  "found family": { persona: "Community Reader", token: "found-family" },
  romance: { persona: "Romance Softie", token: "romance" },
  "audiobook lover": { persona: "Audiobook Explorer", token: "audiobook" },
  "weekend binger": { persona: "Weekend Binger", token: "weekend" },
  dark: { persona: "Dark Academia", token: "dark" },
  "slow burn": { persona: "Slow Burn Devotee", token: "slow-burn" },
  mystery: { persona: "Mystery Solver", token: "mystery" },
  magical: { persona: "Magic Seeker", token: "magical" },
} as const;

/**
 * FLAG #10 — Home exclusive badge architecture. Placeholder IDs only.
 * No official names or art.
 */
export const READING_DNA_HOME_BADGE_DEFS = [
  {
    id: "home_dna_badge_placeholder_01",
    criterion: "Home member with a published monthly snapshot",
    minMonthlySnapshots: 1,
  },
  {
    id: "home_dna_badge_placeholder_02",
    criterion: "Home member with DNA Match enabled and ≥ 1 visible match ≥ 70",
    minVisibleMatchPercent: 70,
  },
  {
    id: "home_dna_badge_placeholder_03",
    criterion: "Home member with high-confidence DNA (data_points ≥ 24)",
    minDataPoints: 24,
  },
] as const;

export const READING_DNA_PRODUCT_FLAGS = {
  1: "Exact scoring weights — provisional in READING_DNA_GENRE_WEIGHTS / TAG_WEIGHTS",
  2: "Min data points before DNA visible — READING_DNA_MIN_DATA_POINTS = 8",
  3: "Top trait composition — 1 genre + 1 vibe + 1 emotion + 1 trope + 1 habit",
  4: "Official personality names — reuse READING_DNA_PERSONA_DICTIONARY only",
  5: "Exact habit thresholds — READING_DNA_HABIT_THRESHOLDS",
  6: "Free Top 3 default visibility — followers (not public)",
  7: "Exact Match category weights — READING_DNA_MATCH_CATEGORY_WEIGHTS (cosine)",
  8: "Min match % for friend suggestions — 55",
  9: "Disable Match while DNA public — match_enabled column; default follows visibility",
  10: "Exclusive Home badge names — placeholder IDs only",
  11: "Monthly snapshot period — calendar month (YYYY-MM)",
  12: "Faith / Christian Fiction — normal catalog genre data; no religion inference",
} as const;
