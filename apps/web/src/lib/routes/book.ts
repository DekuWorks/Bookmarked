/** Static-safe book details URL for GitHub Pages (query param, not dynamic segment). */
export function bookDetailsPath(bookId: string): string {
  return `/book?id=${encodeURIComponent(bookId)}`;
}
