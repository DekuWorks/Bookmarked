/**
 * Canonical mobile path for a public reader profile.
 * Prefer this helper over hardcoding `/reader/${username}` in screens.
 */
export function readerProfilePath(username: string): `/reader/${string}` {
  return `/reader/${encodeURIComponent(username.trim())}`;
}
