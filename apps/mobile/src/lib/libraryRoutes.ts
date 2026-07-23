export function libraryShelfPath(slug: string): `/library/${string}` {
  return `/library/${slug}`;
}

export function customShelfPath(slug: string): `/library/custom?slug=${string}` {
  return `/library/custom?slug=${encodeURIComponent(slug)}`;
}
