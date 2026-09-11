import type { BookClubMemberRole } from "../types";
import { canModerateDiscussions } from "./clubPermissions";

/** Shared pluralization for discussion reply counts. */
export function formatReplyCount(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (safe === 1) return "1 Reply";
  return `${safe} Replies`;
}

/** Ownership is immutable user id only — never role-based. */
export function canEditDiscussion(
  userId: string | null | undefined,
  creatorId: string | null | undefined
): boolean {
  return Boolean(userId && creatorId && userId === creatorId);
}

export type DiscussionEditFields = {
  created_at: string;
  updated_at: string;
  edited_at?: string | null;
};

/**
 * Prefer `edited_at` when the column is present (including null).
 * Reply triggers bump `updated_at`, so null edited_at must not show Edited.
 * Legacy fallback only when `edited_at` is omitted from the row.
 */
export function isDiscussionEdited(discussion: DiscussionEditFields): boolean {
  if (discussion.edited_at !== undefined) {
    if (discussion.edited_at == null || discussion.edited_at === "") return false;
    return new Date(discussion.edited_at).getTime() > new Date(discussion.created_at).getTime();
  }
  return new Date(discussion.updated_at).getTime() > new Date(discussion.created_at).getTime();
}

export function validateDiscussionFields(
  title: string,
  body: string
): { title: string; body: string } | { error: string } {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  if (!trimmedTitle) return { error: "Title is required." };
  if (trimmedTitle.length > 120) return { error: "Title must be 120 characters or fewer." };
  if (!trimmedBody) return { error: "Body is required." };
  return { title: trimmedTitle, body: trimmedBody };
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

export type ClubDiscussionActionPermissions = ClubReplyActionPermissions;

/**
 * Discussion ••• matrix (same ownership rules as replies):
 * - Creator: Edit YES, Delete YES; no Report/Block
 * - Host/mod other: Edit NO, Delete YES
 * - Other members: Edit NO, Delete NO; Report/Block YES
 */
export function getClubDiscussionActionPermissions(input: {
  viewerId: string;
  creatorId: string;
  viewerRole: BookClubMemberRole | null | undefined;
}): ClubDiscussionActionPermissions {
  const canEdit = canEditDiscussion(input.viewerId, input.creatorId);
  const canModerate = canModerateDiscussions(input.viewerRole);
  return {
    canEdit,
    canDelete: canEdit || canModerate,
    canReport: !canEdit,
    canBlock: !canEdit,
  };
}

/** Patch discussion fields into a list without reordering by edit. */
export function patchDiscussionContent<T extends { id: string }>(
  existing: T[],
  incoming: Pick<T, "id"> & Partial<Omit<T, "id">>
): T[] {
  return existing.map((row) => {
    if (row.id !== incoming.id) return row;
    return { ...row, ...incoming };
  });
}
