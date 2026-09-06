export const CLUB_REPLY_SORTS = ["newest", "oldest"] as const;
export type ClubReplySort = (typeof CLUB_REPLY_SORTS)[number];

export const CLUB_REPLY_SORT_STORAGE_KEY = "bookmarked.clubReplySort";

export type ClubReplySortable = {
  id: string;
  created_at: string;
};

export function parseClubReplySort(value: unknown): ClubReplySort {
  return value === "oldest" ? "oldest" : "newest";
}

export function sortClubReplies<T extends ClubReplySortable>(
  replies: T[],
  sort: ClubReplySort
): T[] {
  const next = [...replies];
  next.sort((a, b) => {
    const aTime = Date.parse(a.created_at);
    const bTime = Date.parse(b.created_at);
    const safeA = Number.isFinite(aTime) ? aTime : 0;
    const safeB = Number.isFinite(bTime) ? bTime : 0;
    return sort === "oldest" ? safeA - safeB : safeB - safeA;
  });
  return next;
}

/** Merge by reply id. Incoming rows replace stale copies. Sort is applied after. */
export function mergeClubReplies<T extends ClubReplySortable>(
  existing: T[],
  incoming: T | T[],
  sort: ClubReplySort
): T[] {
  const map = new Map<string, T>();
  for (const row of existing) map.set(row.id, row);
  const rows = Array.isArray(incoming) ? incoming : [incoming];
  for (const row of rows) {
    if (!row?.id) continue;
    map.set(row.id, row);
  }
  return sortClubReplies([...map.values()], sort);
}

export function removeClubReply<T extends ClubReplySortable>(existing: T[], replyId: string): T[] {
  return existing.filter((row) => row.id !== replyId);
}
