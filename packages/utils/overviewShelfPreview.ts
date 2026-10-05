/** Overview shelf previews: TBR, Finished, DNF. Full counts, capped covers. */

export const SHELF_PREVIEW_LIMIT = 5;

export const OVERVIEW_PREVIEW_SHELVES = [
  { status: "want_to_read", title: "TBR", slug: "want-to-read" },
  { status: "read", title: "Finished", slug: "read" },
  { status: "dnf", title: "DNF", slug: "dnf" },
] as const;

export type OverviewPreviewShelfStatus = (typeof OVERVIEW_PREVIEW_SHELVES)[number]["status"];

export const SHELF_PREVIEW_COVER = {
  widthPx: 44,
  heightPx: 66,
  tabletWidthPx: 56,
  tabletHeightPx: 84,
  fit: "contain",
} as const;

export function bookCountLabel(count: number): string {
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return total === 1 ? "1 book" : `${total} books`;
}

export function readingGoalSummary(completed: number, target: number | null): string {
  const finished = Number.isFinite(completed) ? Math.max(0, Math.floor(completed)) : 0;
  if (target == null || target <= 0) {
    return finished === 1 ? "1 book finished this year" : `${finished} books finished this year`;
  }
  return `${finished} out of ${target} books`;
}

export function readingGoalPercentLabel(percent: number | null): string | null {
  if (percent == null || !Number.isFinite(percent)) return null;
  return `${Math.round(percent)}%`;
}

export function previewShelfItems<T>(items: readonly T[], limit = SHELF_PREVIEW_LIMIT): T[] {
  return items.slice(0, limit);
}

export type ReadingProgressInput = {
  progressPages?: number | null;
  totalPages?: number | null;
  pageCount?: number | null;
  progressPercent?: number | null;
};

export function currentlyReadingProgressLabel(input: ReadingProgressInput): {
  value: string;
  percent: number;
} {
  const total = input.totalPages ?? input.pageCount ?? null;
  const current = input.progressPages;
  if (total != null && total > 0 && current != null && Number.isFinite(current)) {
    const percent = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
    return { value: `${Math.max(0, Math.round(current))} / ${Math.round(total)}`, percent };
  }
  const percent = Math.min(100, Math.max(0, Math.round(Number(input.progressPercent) || 0)));
  return { value: `${percent}%`, percent };
}
