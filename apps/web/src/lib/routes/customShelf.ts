export function customShelfPath(slug: string): string {
  return `/library/custom/?slug=${encodeURIComponent(slug)}`;
}
