import { withOriginQuery } from "../../../../packages/utils/navigationOrigin";

export function libraryShelfPath(slug: string, origin: string | null = "library_shelf"): string {
  return withOriginQuery(`/library/${slug}`, { origin });
}

export function customShelfPath(slug: string): `/library/custom?slug=${string}` {
  return `/library/custom?slug=${encodeURIComponent(slug)}`;
}
