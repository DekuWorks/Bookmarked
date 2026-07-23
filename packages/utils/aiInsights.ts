import type { ShelfStatus } from "../types";

export type AiInsightItem = {
  id: string;
  title: string;
  body: string;
  emoji?: string;
};

export type AiInsightsResult = {
  highlights: AiInsightItem[];
  patterns: AiInsightItem[];
  prompts: AiInsightItem[];
  /** True when the user has enough reading history to show insights. */
  hasData: boolean;
};

export type AiInsightsSessionInput = {
  id: string;
  user_book_id: string;
  created_at: string;
  pages_read: number;
  note: string | null;
  mood: string | null;
  read_number: number;
  bookTitle: string | null;
  bookId: string | null;
};

export type AiInsightsBookInput = {
  id: string;
  shelf_status: ShelfStatus;
  progress_pages: number;
  progress_percent: number;
  is_favorite: boolean;
  dnf: boolean;
  finished_at: string | null;
  rating: number | null;
  bookTitle: string | null;
  subjects: string[] | null;
};

export type AiInsightsReviewInput = {
  bookTitle: string | null;
  rating: number | null;
  review_body: string | null;
  feelings: string[];
  created_at: string;
};

export type GenerateAiInsightsInput = {
  sessions: AiInsightsSessionInput[];
  books: AiInsightsBookInput[];
  reviews: AiInsightsReviewInput[];
  favoriteGenres: string[] | null;
  streakTimestamps: string[];
  now?: Date;
};

const MS_PER_DAY = 86_400_000;

function toUtcDateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addUtcDaysKey(dateKey: string, delta: number): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function daysBetweenUtc(a: string, b: string): number {
  const ms =
    new Date(`${b}T12:00:00.000Z`).getTime() - new Date(`${a}T12:00:00.000Z`).getTime();
  return Math.round(ms / MS_PER_DAY);
}

function normalizeLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function sessionsInRange(
  sessions: AiInsightsSessionInput[],
  start: Date,
  end: Date
): AiInsightsSessionInput[] {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return sessions.filter((session) => {
    const t = new Date(session.created_at).getTime();
    return t >= startMs && t < endMs;
  });
}

function sumPages(sessions: AiInsightsSessionInput[]): number {
  return sessions.reduce((sum, session) => sum + Math.max(0, session.pages_read), 0);
}

function countSessions(sessions: AiInsightsSessionInput[]): number {
  return sessions.length;
}

function activeDaysInRange(timestamps: string[], start: Date, end: Date): number {
  const startKey = toUtcDateKey(start.toISOString());
  const endKey = toUtcDateKey(addUtcDays(end, -1).toISOString());
  const keys = new Set(timestamps.map(toUtcDateKey));
  let count = 0;
  for (const key of keys) {
    if (key >= startKey && key <= endKey) count += 1;
  }
  return count;
}

function computeStreak(timestamps: string[], now: Date): { current: number; longest: number } {
  const dateKeys = new Set(timestamps.map(toUtcDateKey));
  if (dateKeys.size === 0) return { current: 0, longest: 0 };

  const sorted = Array.from(dateKeys).sort();
  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetweenUtc(sorted[i - 1]!, sorted[i]!);
    if (gap === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (gap > 1) {
      run = 1;
    }
  }

  const today = toUtcDateKey(now.toISOString());
  const yesterday = addUtcDaysKey(today, -1);

  let current = 0;
  if (dateKeys.has(today) || dateKeys.has(yesterday)) {
    let cursor = dateKeys.has(today) ? today : yesterday;
    while (dateKeys.has(cursor)) {
      current += 1;
      cursor = addUtcDaysKey(cursor, -1);
    }
  }

  return { current, longest };
}

function topMood(sessions: AiInsightsSessionInput[]): string | null {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const mood = session.mood?.trim();
    if (!mood) continue;
    const key = mood.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let top: string | null = null;
  let topCount = 0;
  for (const [key, count] of counts) {
    if (count > topCount) {
      topCount = count;
      top = normalizeLabel(key);
    }
  }
  return top;
}

function topGenreFromBooks(
  books: AiInsightsBookInput[],
  favoriteGenres: string[] | null
): { genre: string | null; source: "library" | "profile" | null } {
  const counts = new Map<string, number>();
  const labelByKey = new Map<string, string>();

  for (const book of books) {
    if (book.shelf_status !== "read") continue;
    const subjects = book.subjects ?? [];
    const seen = new Set<string>();
    for (const subject of subjects.slice(0, 5)) {
      const label = normalizeLabel(subject);
      if (!label) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      labelByKey.set(key, label);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  let topGenre: string | null = null;
  let topCount = 0;
  for (const [key, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topGenre = labelByKey.get(key) ?? null;
    }
  }

  if (topGenre) return { genre: topGenre, source: "library" };

  const profileGenre = favoriteGenres?.find((g) => g.trim())?.trim();
  if (profileGenre) {
    return { genre: normalizeLabel(profileGenre), source: "profile" };
  }

  return { genre: null, source: null };
}

function topBooksByPages(
  sessions: AiInsightsSessionInput[],
  limit = 3
): { title: string; pages: number }[] {
  const byBook = new Map<string, { title: string; pages: number }>();

  for (const session of sessions) {
    const title = session.bookTitle?.trim() || "Untitled";
    const key = session.user_book_id;
    const existing = byBook.get(key) ?? { title, pages: 0 };
    existing.pages += Math.max(0, session.pages_read);
    byBook.set(key, existing);
  }

  return [...byBook.values()]
    .sort((a, b) => b.pages - a.pages)
    .slice(0, limit);
}

function countRereads(sessions: AiInsightsSessionInput[]): number {
  const maxReadNumber = new Map<string, number>();
  for (const session of sessions) {
    const current = maxReadNumber.get(session.user_book_id) ?? 1;
    maxReadNumber.set(session.user_book_id, Math.max(current, session.read_number));
  }
  let rereads = 0;
  for (const readNumber of maxReadNumber.values()) {
    if (readNumber > 1) rereads += 1;
  }
  return rereads;
}

function computeFinishRate(books: AiInsightsBookInput[]): number | null {
  const started = books.filter(
    (book) =>
      book.shelf_status === "currently_reading" ||
      book.shelf_status === "read" ||
      book.dnf
  ).length;
  const finished = books.filter((book) => book.shelf_status === "read" && !book.dnf).length;
  if (started === 0) return null;
  return Math.round((finished / started) * 100);
}

function buildReflectionPrompts(
  sessions: AiInsightsSessionInput[],
  books: AiInsightsBookInput[],
  reviews: AiInsightsReviewInput[]
): AiInsightItem[] {
  const prompts: AiInsightItem[] = [];

  const notedSessions = sessions
    .filter((session) => session.note?.trim())
    .slice(0, 5);

  for (const session of notedSessions.slice(0, 2)) {
    const title = session.bookTitle?.trim() || "this book";
    const excerpt = session.note!.trim().slice(0, 80);
    prompts.push({
      id: `prompt-note-${session.id}`,
      title: `Reflect on ${title}`,
      body: `You wrote "${excerpt}${session.note!.trim().length > 80 ? "…" : ""}" — what stood out most when you put the book down?`,
      emoji: "✍️",
    });
  }

  const readingNow = books.find((book) => book.shelf_status === "currently_reading");
  if (readingNow?.bookTitle && prompts.length < 3) {
    prompts.push({
      id: `prompt-current-${readingNow.id}`,
      title: "Check in with your current read",
      body: `You're ${Math.round(readingNow.progress_percent)}% through ${readingNow.bookTitle}. What moment are you most curious to reach next?`,
      emoji: "📖",
    });
  }

  const highRatedNoReview = books.find(
    (book) =>
      book.rating != null &&
      book.rating >= 4 &&
      !reviews.some(
        (review) =>
          review.bookTitle === book.bookTitle && Boolean(review.review_body?.trim())
      )
  );
  if (highRatedNoReview?.bookTitle && prompts.length < 3) {
    prompts.push({
      id: `prompt-review-${highRatedNoReview.id}`,
      title: "Capture why it resonated",
      body: `You rated ${highRatedNoReview.bookTitle} highly — what would you tell a friend about it in one sentence?`,
      emoji: "💬",
    });
  }

  if (prompts.length === 0) {
    prompts.push({
      id: "prompt-start",
      title: "Start your reading journal",
      body: "Log a reading session and add a short note — insights get richer as your trail grows.",
      emoji: "🌱",
    });
  }

  return prompts.slice(0, 3);
}

function buildBecauseYouReadPattern(
  books: AiInsightsBookInput[],
  favoriteGenres: string[] | null
): AiInsightItem | null {
  const recentFinish = books
    .filter((book) => book.shelf_status === "read" && book.finished_at)
    .sort((a, b) => {
      const aTime = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const bTime = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return bTime - aTime;
    })[0];

  const { genre } = topGenreFromBooks(books, favoriteGenres);
  if (!recentFinish?.bookTitle || !genre) return null;

  return {
    id: "pattern-because-you-read",
    title: "Because you read…",
    body: `You recently finished ${recentFinish.bookTitle}. Readers who enjoy ${genre} often revisit favorites — any on your shelf worth a reread?`,
    emoji: "🔗",
  };
}

/**
 * Rule-based reading insights from sessions, library, and reviews.
 * No external API required.
 */
export function generateAiInsights(input: GenerateAiInsightsInput): AiInsightsResult {
  const now = input.now ?? new Date();
  const todayStart = startOfUtcDay(now);
  const weekStart = addUtcDays(todayStart, -7);
  const prevWeekStart = addUtcDays(weekStart, -7);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const allTimestamps = [
    ...input.streakTimestamps,
    ...input.sessions.map((session) => session.created_at),
  ];

  const thisWeekSessions = sessionsInRange(input.sessions, weekStart, addUtcDays(todayStart, 1));
  const lastWeekSessions = sessionsInRange(input.sessions, prevWeekStart, weekStart);
  const monthSessions = sessionsInRange(input.sessions, monthStart, nextMonthStart);

  const thisWeekPages = sumPages(thisWeekSessions);
  const lastWeekPages = sumPages(lastWeekSessions);
  const thisWeekSessionCount = countSessions(thisWeekSessions);
  const lastWeekSessionCount = countSessions(lastWeekSessions);

  const monthActiveDays = activeDaysInRange(allTimestamps, monthStart, nextMonthStart);
  const streak = computeStreak(allTimestamps, now);
  const finishRate = computeFinishRate(input.books);
  const topBooks = topBooksByPages(monthSessions.length > 0 ? monthSessions : input.sessions);
  const mood = topMood(input.sessions);
  const { genre, source: genreSource } = topGenreFromBooks(input.books, input.favoriteGenres);
  const rereadCount = countRereads(input.sessions);

  const hasData =
    input.sessions.length > 0 ||
    input.books.some((book) => book.shelf_status === "read") ||
    input.reviews.length > 0;

  const highlights: AiInsightItem[] = [];

  if (thisWeekPages > 0) {
    highlights.push({
      id: "highlight-week-pages",
      title: "Pages this week",
      body: `You've read ${thisWeekPages} page${thisWeekPages === 1 ? "" : "s"} across ${thisWeekSessionCount} session${thisWeekSessionCount === 1 ? "" : "s"} this week.`,
      emoji: "📄",
    });
  }

  if (monthActiveDays > 0) {
    highlights.push({
      id: "highlight-month-days",
      title: "Consistency this month",
      body: `You read on ${monthActiveDays} day${monthActiveDays === 1 ? "" : "s"} this month — ${monthActiveDays >= 12 ? "strong momentum" : "every session counts"}.`,
      emoji: "📅",
    });
  }

  if (streak.current > 0) {
    highlights.push({
      id: "highlight-streak",
      title: "Reading streak",
      body: `You're on a ${streak.current}-day streak${streak.longest > streak.current ? ` (best: ${streak.longest} days)` : ""}.`,
      emoji: "🔥",
    });
  }

  if (topBooks[0]) {
    const leader = topBooks[0];
    highlights.push({
      id: "highlight-top-book",
      title: "Most-read book lately",
      body: `${leader.title} leads with ${leader.pages} page${leader.pages === 1 ? "" : "s"} logged recently.`,
      emoji: "🏆",
    });
  }

  if (finishRate != null && input.books.length >= 3) {
    highlights.push({
      id: "highlight-finish-rate",
      title: "Finish rate",
      body: `You've finished ${finishRate}% of books you've started — ${finishRate >= 70 ? "impressive follow-through" : "room to close out more titles when you're ready"}.`,
      emoji: "✅",
    });
  }

  const patterns: AiInsightItem[] = [];

  if (thisWeekPages > 0 || lastWeekPages > 0) {
    const pageDelta = thisWeekPages - lastWeekPages;
    const sessionDelta = thisWeekSessionCount - lastWeekSessionCount;
    let paceBody: string;
    if (lastWeekPages === 0 && thisWeekPages > 0) {
      paceBody = `You logged ${thisWeekPages} pages this week — a fresh start compared to last week.`;
    } else if (pageDelta > 0) {
      paceBody = `Your pace is up ${pageDelta} page${pageDelta === 1 ? "" : "s"} vs last week (${thisWeekSessionCount} vs ${lastWeekSessionCount} sessions).`;
    } else if (pageDelta < 0) {
      paceBody = `You read ${Math.abs(pageDelta)} fewer pages than last week — a lighter week is still part of a healthy habit.`;
    } else {
      paceBody = `Your weekly page count held steady at ${thisWeekPages} pages.`;
    }
    patterns.push({
      id: "pattern-pace",
      title: "Reading pace",
      body: paceBody,
      emoji: "📈",
    });
  }

  if (mood) {
    patterns.push({
      id: "pattern-mood",
      title: "Session mood",
      body: `"${mood}" shows up most often in your reading sessions — notice what contexts bring that feeling.`,
      emoji: "🎭",
    });
  }

  if (genre) {
    patterns.push({
      id: "pattern-genre",
      title: "Genre pattern",
      body:
        genreSource === "library"
          ? `${genre} is your most-read subject among finished books.`
          : `Your profile lists ${genre} — your finished books may reveal more as your library grows.`,
      emoji: "🏷️",
    });
  }

  if (rereadCount > 0) {
    patterns.push({
      id: "pattern-reread",
      title: "Reread habit",
      body: `You've logged multiple reads for ${rereadCount} book${rereadCount === 1 ? "" : "s"} — comfort reads are part of your rhythm.`,
      emoji: "🔁",
    });
  }

  const becauseYouRead = buildBecauseYouReadPattern(input.books, input.favoriteGenres);
  if (becauseYouRead) patterns.push(becauseYouRead);

  const favoriteCount = input.books.filter((book) => book.is_favorite).length;
  if (favoriteCount > 0) {
    patterns.push({
      id: "pattern-favorites",
      title: "Shelf favorites",
      body: `You have ${favoriteCount} favorite${favoriteCount === 1 ? "" : "s"} on your shelf — they often signal what you'll reach for next.`,
      emoji: "⭐",
    });
  }

  const prompts = buildReflectionPrompts(input.sessions, input.books, input.reviews);

  return {
    highlights: highlights.slice(0, 5),
    patterns: patterns.slice(0, 5),
    prompts,
    hasData,
  };
}

/** Privacy-safe reading summary sent to the OpenAI edge function (no user ids or emails). */
export type AiInsightsContext = {
  stats: {
    pagesThisWeek: number;
    pagesLastWeek: number;
    sessionsThisWeek: number;
    sessionsLastWeek: number;
    monthActiveDays: number;
    currentStreak: number;
    longestStreak: number;
    finishRatePercent: number | null;
    booksRead: number;
    currentlyReading: number;
    favoritesCount: number;
    rereadCount: number;
  };
  topMood: string | null;
  topGenre: string | null;
  favoriteGenres: string[];
  topBooksByPages: { title: string; pages: number }[];
  recentFinished: { title: string; rating: number | null }[];
  currentlyReading: { title: string; progressPercent: number } | null;
  recentNoteExcerpts: { bookTitle: string; excerpt: string }[];
  reviewFeelings: string[];
  hasData: boolean;
};

/** Build a compact context object for OpenAI — stats and short excerpts only. */
export function buildAiInsightsContext(input: GenerateAiInsightsInput): AiInsightsContext {
  const now = input.now ?? new Date();
  const todayStart = startOfUtcDay(now);
  const weekStart = addUtcDays(todayStart, -7);
  const prevWeekStart = addUtcDays(weekStart, -7);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const allTimestamps = [
    ...input.streakTimestamps,
    ...input.sessions.map((session) => session.created_at),
  ];

  const thisWeekSessions = sessionsInRange(input.sessions, weekStart, addUtcDays(todayStart, 1));
  const lastWeekSessions = sessionsInRange(input.sessions, prevWeekStart, weekStart);
  const monthSessions = sessionsInRange(input.sessions, monthStart, nextMonthStart);

  const streak = computeStreak(allTimestamps, now);
  const { genre } = topGenreFromBooks(input.books, input.favoriteGenres);

  const booksRead = input.books.filter((book) => book.shelf_status === "read").length;
  const currentlyReadingCount = input.books.filter(
    (book) => book.shelf_status === "currently_reading"
  ).length;

  const recentFinished = input.books
    .filter((book) => book.shelf_status === "read" && book.bookTitle)
    .sort((a, b) => {
      const aTime = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const bTime = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3)
    .map((book) => ({ title: book.bookTitle!, rating: book.rating }));

  const readingNow = input.books.find(
    (book) => book.shelf_status === "currently_reading" && book.bookTitle
  );

  const recentNoteExcerpts = input.sessions
    .filter((session) => session.note?.trim() && session.bookTitle)
    .slice(0, 3)
    .map((session) => ({
      bookTitle: session.bookTitle!,
      excerpt: session.note!.trim().slice(0, 100),
    }));

  const feelingCounts = new Map<string, number>();
  for (const review of input.reviews) {
    for (const feeling of review.feelings ?? []) {
      const key = feeling.trim().toLowerCase();
      if (!key) continue;
      feelingCounts.set(key, (feelingCounts.get(key) ?? 0) + 1);
    }
  }
  const reviewFeelings = [...feelingCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([feeling]) => normalizeLabel(feeling));

  const hasData =
    input.sessions.length > 0 ||
    input.books.some((book) => book.shelf_status === "read") ||
    input.reviews.length > 0;

  return {
    stats: {
      pagesThisWeek: sumPages(thisWeekSessions),
      pagesLastWeek: sumPages(lastWeekSessions),
      sessionsThisWeek: countSessions(thisWeekSessions),
      sessionsLastWeek: countSessions(lastWeekSessions),
      monthActiveDays: activeDaysInRange(allTimestamps, monthStart, nextMonthStart),
      currentStreak: streak.current,
      longestStreak: streak.longest,
      finishRatePercent: computeFinishRate(input.books),
      booksRead,
      currentlyReading: currentlyReadingCount,
      favoritesCount: input.books.filter((book) => book.is_favorite).length,
      rereadCount: countRereads(input.sessions),
    },
    topMood: topMood(input.sessions),
    topGenre: genre,
    favoriteGenres: (input.favoriteGenres ?? []).filter((g) => g.trim()).slice(0, 5),
    topBooksByPages: topBooksByPages(
      monthSessions.length > 0 ? monthSessions : input.sessions,
      3
    ),
    recentFinished,
    currentlyReading: readingNow?.bookTitle
      ? { title: readingNow.bookTitle, progressPercent: Math.round(readingNow.progress_percent) }
      : null,
    recentNoteExcerpts,
    reviewFeelings,
    hasData,
  };
}

const MAX_INSIGHT_ITEMS = 5;
const MAX_PROMPT_ITEMS = 3;

function sanitizeInsightItem(raw: unknown, index: number, prefix: string): AiInsightItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const body = typeof item.body === "string" ? item.body.trim() : "";
  if (!title || !body) return null;

  const emoji = typeof item.emoji === "string" && item.emoji.trim() ? item.emoji.trim() : undefined;
  const id =
    typeof item.id === "string" && item.id.trim()
      ? item.id.trim()
      : `${prefix}-${index + 1}`;

  return { id, title, body, emoji };
}

function sanitizeInsightList(raw: unknown, prefix: string, max: number): AiInsightItem[] {
  if (!Array.isArray(raw)) return [];
  const items: AiInsightItem[] = [];
  for (let i = 0; i < raw.length && items.length < max; i++) {
    const item = sanitizeInsightItem(raw[i], i, prefix);
    if (item) items.push(item);
  }
  return items;
}

/** Validate and normalize structured JSON from OpenAI. */
export function parseOpenAiInsightsResponse(
  raw: unknown,
  hasData: boolean
): AiInsightsResult | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;

  const highlights = sanitizeInsightList(payload.highlights, "highlight", MAX_INSIGHT_ITEMS);
  const patterns = sanitizeInsightList(payload.patterns, "pattern", MAX_INSIGHT_ITEMS);
  const prompts = sanitizeInsightList(payload.prompts, "prompt", MAX_PROMPT_ITEMS);

  if (highlights.length === 0 && patterns.length === 0 && prompts.length === 0) {
    return null;
  }

  return { highlights, patterns, prompts, hasData };
}

/** @deprecated Prefer parseOpenAiInsightsResponse for full structured OpenAI output. */
export function mergeLlmSummary(
  insights: AiInsightsResult,
  summary: string | null | undefined
): AiInsightsResult {
  const trimmed = summary?.trim();
  if (!trimmed) return insights;

  const llmHighlight: AiInsightItem = {
    id: "highlight-llm-summary",
    title: "Personal summary",
    body: trimmed,
    emoji: "✨",
  };

  return {
    ...insights,
    highlights: [llmHighlight, ...insights.highlights].slice(0, 5),
  };
}
