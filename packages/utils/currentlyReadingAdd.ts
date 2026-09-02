/** Navigation context for Home → Overview → Currently Reading → Add Book. */

export const HOME_OVERVIEW_CURRENTLY_READING_ORIGIN = "home_overview_currently_reading";

export const CURRENTLY_READING_ADD_SHELF = "currently_reading" as const;

export const TBR_PICKER_SEARCH_THRESHOLD = 8;

export const CURRENTLY_READING_ADD_EVENTS = {
  opened: "currently_reading_add_opened",
  fromTbr: "currently_reading_add_from_tbr",
  fromSearch: "currently_reading_add_from_search",
  canceled: "currently_reading_add_canceled",
} as const;

export type CurrentlyReadingAddEvent =
  (typeof CURRENTLY_READING_ADD_EVENTS)[keyof typeof CURRENTLY_READING_ADD_EVENTS];

export type CurrentlyReadingAddSearchParams = {
  origin?: string | null;
  shelf?: string | null;
};

export function isCurrentlyReadingAddFromOverview(
  params: CurrentlyReadingAddSearchParams
): boolean {
  return params.origin === HOME_OVERVIEW_CURRENTLY_READING_ORIGIN;
}

export function currentlyReadingAddSearchQuery(): string {
  const params = new URLSearchParams({
    origin: HOME_OVERVIEW_CURRENTLY_READING_ORIGIN,
    shelf: CURRENTLY_READING_ADD_SHELF,
  });
  return params.toString();
}

/** Web Search route (trailing slash). */
export function currentlyReadingAddSearchHref(): string {
  return `/search/?${currentlyReadingAddSearchQuery()}`;
}

/** Native Search route. */
export function currentlyReadingAddSearchPath(): string {
  return `/search?${currentlyReadingAddSearchQuery()}`;
}

/**
 * Bare Search path (no origin/shelf). Use this to drop Overview Add Book mode
 * from the Search tab so a later visit is normal Search.
 */
export function currentlyReadingAddSearchClearPath(): string {
  return "/search";
}

/** Home tab — Overview lives here on mobile. */
export function currentlyReadingAddMobileReturnPath(): string {
  return "/";
}

export function currentlyReadingAddClearedSearchParams(): CurrentlyReadingAddSearchParams {
  return { origin: undefined, shelf: undefined };
}

export function currentlyReadingAddReturnHref(): string {
  return "/reading-room/";
}

type LeaveOverviewAddSearchRouter = {
  setParams: (params: Record<string, undefined | string | number | (string | number)[]>) => void;
  replace: (href: string, options?: object) => void;
};

/**
 * Leave Overview-origin Search: clear origin/shelf on the Search route, then
 * return Home/Overview for this session only. Does not change web (callers
 * that already `replace` the Reading Room should keep doing that).
 */
export function leaveCurrentlyReadingAddSearch(router: LeaveOverviewAddSearchRouter): void {
  router.setParams({
    origin: undefined,
    shelf: undefined,
  });
  router.replace(currentlyReadingAddMobileReturnPath());
}

let overviewSearchAddInFlight = false;

/** Prevents a second Overview add-from-search before the first one finishes. */
export function tryBeginCurrentlyReadingAddFromSearch(): boolean {
  if (overviewSearchAddInFlight) return false;
  overviewSearchAddInFlight = true;
  return true;
}

export function endCurrentlyReadingAddFromSearch(): void {
  overviewSearchAddInFlight = false;
}

export function selectWantToReadBooks<T extends { shelf_status: string }>(books: T[]): T[] {
  return books.filter((book) => book.shelf_status === "want_to_read");
}

export function filterTbrBooksByQuery<
  T extends { books?: { title?: string | null; author?: string | null } | null },
>(books: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return books;
  return books.filter((row) => {
    const title = row.books?.title?.toLowerCase() ?? "";
    const author = row.books?.author?.toLowerCase() ?? "";
    return title.includes(needle) || author.includes(needle);
  });
}
