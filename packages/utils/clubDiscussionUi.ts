import type { BookClubMemberRole } from "../types";
import { canModerateDiscussions } from "./clubPermissions";

/** Shared pluralization for discussion reply counts. */
export function formatReplyCount(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (safe === 1) return "1 Reply";
  return `${safe} Replies`;
}

export type DiscussionCountFields = {
  id: string;
  reply_count: number;
  latest_activity_at: string;
};

/**
 * Apply an authoritative discussion row (or partial count fields) into a list.
 * Dedupes by discussion id.
 */
export function upsertDiscussionCounts<T extends DiscussionCountFields>(
  existing: T[],
  incoming: Pick<T, "id" | "reply_count" | "latest_activity_at"> & Partial<T>
): T[] {
  let found = false;
  const next = existing.map((row) => {
    if (row.id !== incoming.id) return row;
    found = true;
    return {
      ...row,
      ...incoming,
      reply_count: incoming.reply_count,
      latest_activity_at: incoming.latest_activity_at,
    };
  });
  if (found) return next;
  return existing;
}

/** Optimistic local bump when a reply is created/deleted before discussion UPDATE arrives. */
export function adjustDiscussionReplyCount<T extends DiscussionCountFields>(
  existing: T[],
  discussionId: string,
  delta: 1 | -1,
  activityAt?: string
): T[] {
  return existing.map((row) => {
    if (row.id !== discussionId) return row;
    const reply_count = Math.max(0, row.reply_count + delta);
    return {
      ...row,
      reply_count,
      latest_activity_at: activityAt ?? row.latest_activity_at,
    };
  });
}

export type ClubReplyActionPermissions = {
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
  canBlock: boolean;
};

/**
 * Exact matrix:
 * - Author own: Edit YES, Delete YES; no Report/Block
 * - Author other: Edit NO, Delete NO
 * - Host/mod other: Edit NO, Delete YES
 * - Host/mod own: Edit YES, Delete YES
 * - Other members: Edit NO, Delete NO
 */
export function getClubReplyActionPermissions(input: {
  viewerId: string;
  replyAuthorId: string;
  viewerRole: BookClubMemberRole | null | undefined;
}): ClubReplyActionPermissions {
  const isOwn = input.viewerId === input.replyAuthorId;
  const canModerate = canModerateDiscussions(input.viewerRole);
  return {
    canEdit: isOwn,
    canDelete: isOwn || canModerate,
    canReport: !isOwn,
    canBlock: !isOwn,
  };
}
