export function readerProfilePath(username: string): string {
  return `/reader/?username=${encodeURIComponent(username)}`;
}
