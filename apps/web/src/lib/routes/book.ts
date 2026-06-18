/** Static-safe book details URL for GitHub Pages (query param, trailing slash for export). */
export function bookDetailsPath(bookId: string): string {
  return `/book/?id=${encodeURIComponent(bookId)}`;
}
