export function readerLibraryPath(username: string): string {
  return `/reader-library/?username=${encodeURIComponent(username)}`;
}

export function readerLibraryShelfPath(username: string, shelfSlug: string): string {
  const params = new URLSearchParams({
    username,
    shelf: shelfSlug,
  });
  return `/reader-library/shelf/?${params.toString()}`;
}
