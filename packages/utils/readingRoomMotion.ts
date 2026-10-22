/**
 * Shared Reading Room motion spec.
 * Web uses CSS. iOS uses Reanimated. Durations and decisions stay the same.
 * Adapted from the idea of a sliding pill and a short progress fill.
 * No 21st.dev source is copied into this file.
 */

export const READING_ROOM_MOTION = {
  carouselMs: 280,
  progressMs: 280,
  shelfHoverMs: 220,
  shelfHoverLiftPx: 6,
  shelfHoverScale: 1.03,
  shelfPlaceMs: 240,
  tabIndicatorMs: 220,
  tabContentMs: 200,
  tabContentShiftPx: 6,
  milestoneMs: 900,
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/** Overview column. max-w-5xl was 64rem; max-w-7xl is 80rem (+25%). */
export const READING_ROOM_DASHBOARD_CLASS = "mx-auto w-full max-w-7xl space-y-6";

export const GOAL_MILESTONES = [25, 50, 75, 100] as const;

export type GoalMilestone = (typeof GOAL_MILESTONES)[number];

export function motionDuration(ms: number, reducedMotion: boolean): number {
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return reducedMotion ? 0 : ms;
}

/** Visual bar only. Values above the target still report their real percent elsewhere. */
export function goalBarFillPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

/** Uncapped ratio. Completion (`met`) stays on the existing goal helper. */
export function readingGoalRealPercent(completed: number, target: number | null): number | null {
  if (target == null || !Number.isFinite(target) || target <= 0) return null;
  const finished = Number.isFinite(completed) ? Math.max(0, completed) : 0;
  return Math.round((finished / target) * 1000) / 10;
}

export function highestMilestoneCrossed(
  previous: number | null,
  next: number
): GoalMilestone | null {
  if (previous == null || !Number.isFinite(previous) || !Number.isFinite(next)) return null;
  let highest: GoalMilestone | null = null;
  for (const mark of GOAL_MILESTONES) {
    if (previous < mark && next >= mark) highest = mark;
  }
  return highest;
}

export type GoalObserveState = {
  settled: boolean;
  baseline: number | null;
};

/**
 * First settled reading (open, refresh, hydration, cache restore) never celebrates.
 * A later change celebrates only the highest milestone newly crossed.
 */
export function observeGoalProgress(
  state: GoalObserveState,
  next: number | null,
  dataSettled: boolean
): { state: GoalObserveState; milestone: GoalMilestone | null } {
  if (!dataSettled || next == null || !Number.isFinite(next)) {
    return { state, milestone: null };
  }
  if (!state.settled) {
    return { state: { settled: true, baseline: next }, milestone: null };
  }
  const milestone = highestMilestoneCrossed(state.baseline, next);
  return { state: { settled: true, baseline: next }, milestone };
}

export function progressMotion(input: {
  previous: number | null;
  next: number;
  reducedMotion: boolean;
}): { fill: number; displayPercent: number; animate: boolean } {
  const displayPercent = Number.isFinite(input.next) ? input.next : 0;
  const fill = goalBarFillPercent(displayPercent) / 100;
  const changed =
    input.previous != null &&
    Number.isFinite(input.previous) &&
    input.previous !== displayPercent;
  return {
    fill,
    displayPercent,
    animate: changed && !input.reducedMotion,
  };
}

export function carouselIndexAfterMove(current: number, delta: number, count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  const base = Number.isFinite(current) ? current : 0;
  const step = Number.isFinite(delta) ? delta : 0;
  return Math.max(0, Math.min(count - 1, base + step));
}

/** Applies every click to the committed index. Later clicks replace the target; they do not stack animations. */
export function carouselIndexAfterMoves(
  start: number,
  deltas: readonly number[],
  count: number
): number {
  return deltas.reduce((index, delta) => carouselIndexAfterMove(index, delta, count), start);
}

/** Null previous means the first paint. Those covers do not animate. */
export function shelfEnterIds(
  previous: readonly string[] | null,
  next: readonly string[]
): string[] {
  if (previous == null) return [];
  const seen = new Set(previous);
  return next.filter((id) => !seen.has(id));
}

export function shelfExitIds(
  previous: readonly string[] | null,
  next: readonly string[]
): string[] {
  if (previous == null) return [];
  const seen = new Set(next);
  return previous.filter((id) => !seen.has(id));
}

export function sameUserBookIds(left: readonly { id: string }[], right: readonly { id: string }[]): boolean {
  if (left.length !== right.length) return false;
  const ids = new Set(left.map((item) => item.id));
  return right.every((item) => ids.has(item.id));
}

export function relocateOverviewBook<
  T extends { id: string },
  S extends { status: string; items: readonly T[] },
>(input: {
  currentlyReading: readonly T[];
  shelves: readonly S[];
  book: T;
  toStatus: string;
}): { currentlyReading: T[]; shelves: S[] } {
  const nextBook = { ...input.book, shelf_status: input.toStatus } as T;
  const shelves = input.shelves.map((shelf) => {
    const items = shelf.items.filter((item) => item.id !== input.book.id);
    if (shelf.status !== input.toStatus) {
      return { ...shelf, items };
    }
    return { ...shelf, items: [nextBook, ...items] };
  });
  const rest = input.currentlyReading.filter((item) => item.id !== input.book.id);
  const currentlyReading =
    input.toStatus === "currently_reading" ? [nextBook, ...rest] : rest;
  return { currentlyReading, shelves };
}

export function relocateLibraryBook<T extends { id: string; shelf_status: string }>(
  books: readonly T[],
  bookId: string,
  toStatus: T["shelf_status"]
): T[] {
  const current = books.find((book) => book.id === bookId);
  if (!current) return books.slice();
  const next = { ...current, shelf_status: toStatus };
  return [next, ...books.filter((book) => book.id !== bookId)];
}

/** Stats cards and calendar months share the tab-content timing. First paint can still run. */
export function statsCardMotion(reducedMotion: boolean): {
  durationMs: number;
  shiftPx: number;
  delayMs: (index: number) => number;
} {
  const durationMs = motionDuration(READING_ROOM_MOTION.tabContentMs, reducedMotion);
  return {
    durationMs,
    shiftPx: reducedMotion ? 0 : READING_ROOM_MOTION.tabContentShiftPx,
    delayMs: (index) => (reducedMotion ? 0 : Math.max(0, Math.floor(index)) * 40),
  };
}

export function calendarMonthMotion(reducedMotion: boolean): {
  durationMs: number;
  shiftPx: number;
} {
  return {
    durationMs: motionDuration(READING_ROOM_MOTION.tabContentMs, reducedMotion),
    shiftPx: reducedMotion ? 0 : READING_ROOM_MOTION.tabContentShiftPx,
  };
}

/** Previous desktop cover was 128px wide. Phone stays 96. */
export function currentlyReadingCoverSize(
  width: number,
  platform: "web" | "ios"
): { width: number; height: number } {
  const safe = Number.isFinite(width) ? width : 0;
  if (platform === "ios") {
    if (safe >= 1024) return { width: 168, height: 252 };
    if (safe >= 768) return { width: 148, height: 222 };
    return { width: 96, height: 144 };
  }
  if (safe >= 1024) return { width: 176, height: 264 };
  if (safe >= 768) return { width: 160, height: 240 };
  return { width: 96, height: 144 };
}
