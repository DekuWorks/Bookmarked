/** Full-page redirect — reliable on GitHub Pages static export. */
export function staticRedirect(path: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(path);
}
