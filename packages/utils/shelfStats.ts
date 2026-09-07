import type { ShelfStatus } from "../types";

/** Built-in shelves plus custom collections. */
export type ShelfStatKind = ShelfStatus | "custom";

export type ShelfStatsInputItem = {
  progress_percent?: number | null;
  progress_pages?: number | null;
  rating?: number | null;
  finished_at?: string | null;
};

export type ShelfStats = {
  totalBooks: number;
  averageProgress: number;
  averageRating: number | null;
  pagesRead: number;
  finishedThisMonth: number;
};

export type ShelfStatCard = {
  label: string;
  value: string | number;
};

/** Fixed card width so 2/3/4 cards stay the same size. */
export const SHELF_STAT_CARD_WIDTH_PX = 176;

export function computeShelfStatsFromItems(
  items: ReadonlyArray<ShelfStatsInputItem | object>,
  kind: ShelfStatKind,
  now: Date = new Date()
): ShelfStats {
  const rows = items as ShelfStatsInputItem[];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const withProgress = rows.filter((item) => Number(item.progress_percent) > 0);
  const averageProgress =
    withProgress.length > 0
      ? withProgress.reduce((sum, item) => sum + Number(item.progress_percent), 0) /
        withProgress.length
      : 0;

  const rated = rows.filter((item) => item.rating != null);
  const averageRating =
    rated.length > 0
      ? rated.reduce((sum, item) => sum + Number(item.rating), 0) / rated.length
      : null;

  const pagesRead = rows.reduce((sum, item) => sum + (Number(item.progress_pages) || 0), 0);

  const finishedThisMonth =
    kind === "read"
      ? rows.filter((item) => item.finished_at && new Date(item.finished_at) >= monthStart).length
      : 0;

  return {
    totalBooks: rows.length,
    averageProgress,
    averageRating,
    pagesRead,
    finishedThisMonth,
  };
}

export function buildShelfStatCards(stats: ShelfStats, kind: ShelfStatKind): ShelfStatCard[] {
  return [
    { label: "Total books", value: stats.totalBooks },
    ...(kind === "currently_reading"
      ? [{ label: "Avg progress", value: `${Math.round(stats.averageProgress)}%` }]
      : []),
    ...(kind === "read"
      ? [
          { label: "Finished this month", value: stats.finishedThisMonth },
          {
            label: "Avg rating",
            value: stats.averageRating != null ? stats.averageRating.toFixed(1) : "—",
          },
        ]
      : []),
    { label: "Pages logged", value: stats.pagesRead.toLocaleString() },
  ];
}
