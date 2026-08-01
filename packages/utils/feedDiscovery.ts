/** Markers for injecting discovery carousels into a chronological feed. */

export type FeedDiscoverySectionId = "trending" | "shelved" | "reviewed";

export type FeedDiscoveryMarker = {
  kind: "discovery";
  id: FeedDiscoverySectionId;
  afterIndex: number;
};

/**
 * Place discovery carousels after the Nth social item so readers scroll
 * through posts naturally instead of a permanent sidebar.
 */
export function buildFeedDiscoveryMarkers(
  itemCount: number,
  sectionIds: readonly FeedDiscoverySectionId[] = ["trending", "shelved", "reviewed"]
): FeedDiscoveryMarker[] {
  if (itemCount <= 0) {
    return sectionIds.map((id, index) => ({
      kind: "discovery" as const,
      id,
      afterIndex: -1 - index,
    }));
  }

  const gap = Math.max(2, Math.floor(itemCount / (sectionIds.length + 1)));
  return sectionIds.map((id, index) => ({
    kind: "discovery" as const,
    id,
    afterIndex: Math.min(itemCount - 1, gap * (index + 1) - 1),
  }));
}

export function interleaveFeedWithDiscovery<T>(
  items: T[],
  sectionIds: readonly FeedDiscoverySectionId[] = ["trending", "shelved", "reviewed"]
): Array<{ kind: "item"; item: T } | FeedDiscoveryMarker> {
  const markers = buildFeedDiscoveryMarkers(items.length, sectionIds);
  const byAfter = new Map<number, FeedDiscoveryMarker[]>();
  for (const marker of markers) {
    const list = byAfter.get(marker.afterIndex) ?? [];
    list.push(marker);
    byAfter.set(marker.afterIndex, list);
  }

  const result: Array<{ kind: "item"; item: T } | FeedDiscoveryMarker> = [];
  for (const early of byAfter.get(-1) ?? []) {
    result.push(early);
  }
  for (let i = 0; i < items.length; i++) {
    result.push({ kind: "item", item: items[i]! });
    for (const marker of byAfter.get(i) ?? []) {
      result.push(marker);
    }
  }
  return result;
}
