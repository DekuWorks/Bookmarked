export function readerLibraryPath(username: string): string {
  return `/reader-library/?username=${encodeURIComponent(username)}`;
}
