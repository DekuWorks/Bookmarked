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

export function libraryGridColumnCount(width: number, grid: boolean): number {
  if (!grid) return 1;
  return width >= LIBRARY_TABLET_MIN_WIDTH ? 4 : 3;
}
