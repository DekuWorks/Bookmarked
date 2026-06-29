/** Static-safe post deep link for GitHub Pages export. */
export function postFeedPath(postId: string): string {
  return `/feed/?post=${encodeURIComponent(postId)}`;
}
