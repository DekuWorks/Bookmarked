/** Static-safe book details URL for GitHub Pages (query param, trailing slash for export). */
export function bookDetailsPath(bookId: string): string {
  return `/book/?id=${encodeURIComponent(bookId)}`;
}

/** Book details with reviews section focused (scroll target on book page). */
export function bookDetailsReviewsPath(bookId: string): string {
  return `/book/?id=${encodeURIComponent(bookId)}&section=reviews`;
}
