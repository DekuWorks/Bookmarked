/** Static-safe book details URL for GitHub Pages (query param, trailing slash for export). */
export function bookDetailsPath(bookId: string): string {
  return `/book/?id=${encodeURIComponent(bookId)}`;
}

/** Book details with reviews section focused (scroll target on book page). */
export function bookDetailsReviewsPath(bookId: string): string {
  return `/book/?id=${encodeURIComponent(bookId)}&section=reviews`;
}

/** Book details with reading trail focused (scroll target on book page). */
export function bookDetailsTrailPath(bookId: string): string {
  return `/book/?id=${encodeURIComponent(bookId)}&section=trail`;
}

/** @deprecated Use bookDetailsTrailPath — kept for legacy links. */
export function bookDetailsJournalPath(bookId: string): string {
  return bookDetailsTrailPath(bookId);
}

/** Book details with reading notes focused (scroll target on book page). */
export function bookDetailsNotesPath(bookId: string): string {
  return `/book/?id=${encodeURIComponent(bookId)}&section=notes`;
}
