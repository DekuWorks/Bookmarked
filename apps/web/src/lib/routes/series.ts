/** Static-safe series page URL for GitHub Pages (query param, trailing slash for export). */
export function seriesPagePath(name: string): string {
  return `/series/?name=${encodeURIComponent(name)}`;
}
