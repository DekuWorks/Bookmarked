/** Static-safe author page URL for GitHub Pages (query param, trailing slash for export). */
export function authorPagePath(name: string): string {
  return `/author/?name=${encodeURIComponent(name)}`;
}
