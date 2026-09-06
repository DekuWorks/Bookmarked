/** Library All Books / shelf filter order used on web + iOS. */

export const LIBRARY_FILTER_ORDER = [
  "tbr",
  "currently_reading",
  "finished",
  "dnf",
  "all",
] as const;

export type LibraryFilterId = (typeof LIBRARY_FILTER_ORDER)[number];

export const LIBRARY_FILTER_OPTIONS: { id: LibraryFilterId; label: string }[] = [
  { id: "tbr", label: "TBR" },
  { id: "currently_reading", label: "Currently Reading" },
  { id: "finished", label: "Finished" },
  { id: "dnf", label: "DNF" },
  { id: "all", label: "All" },
];

export function parseLibraryFilter(value: string | null | undefined): LibraryFilterId {
  return LIBRARY_FILTER_ORDER.includes(value as LibraryFilterId)
    ? (value as LibraryFilterId)
    : "all";
}

/** iPad / tablet breakpoint for library grids. iPhone stays 3-across. */
export const LIBRARY_TABLET_MIN_WIDTH = 768;

/** Even gap between library grid tiles (px). */
export const LIBRARY_GRID_GAP = 12;

export function libraryGridColumnCount(width: number, grid: boolean): number {
  if (!grid) return 1;
  return width >= LIBRARY_TABLET_MIN_WIDTH ? 4 : 3;
}

export type LibraryGridLayout = {
  columns: number;
  tileWidth: number;
  gap: number;
};

export type LibraryGridLayoutOptions = {
  gap?: number;
  /**
   * Width used for the 3-vs-4 breakpoint. Use the scene / pane width
   * (Split View shrinks this; a padded card on a full iPad should not).
   */
  columnWidth?: number;
};

/**
 * Equal-width tiles from the grid row. Column count uses `columnWidth`
 * when provided (scene/pane), otherwise `contentWidth`.
 * Full iPad scene ≥ 768 → 4. Phone or phone-like Split View → 3.
 */
export function libraryGridLayout(
  contentWidth: number,
  grid: boolean,
  gapOrOptions: number | LibraryGridLayoutOptions = LIBRARY_GRID_GAP
): LibraryGridLayout {
  const options: LibraryGridLayoutOptions =
    typeof gapOrOptions === "number" ? { gap: gapOrOptions } : gapOrOptions;
  const gap = options.gap ?? LIBRARY_GRID_GAP;
  const columns = libraryGridColumnCount(options.columnWidth ?? contentWidth, grid);
  if (contentWidth <= 0 || columns <= 0) {
    return { columns, tileWidth: 0, gap };
  }
  const totalGap = gap * Math.max(0, columns - 1);
  const tileWidth = Math.max(0, Math.floor((contentWidth - totalGap) / columns));
  return { columns, tileWidth, gap };
}
