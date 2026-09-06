/** Standard in-app notification events. Reading activity stays on Feed. */

export const NOTIFIABLE_SOCIAL_EVENTS = [
  "message",
  "follow",
  "post_like",
  "post_comment",
  "post_comment_reply",
  "post_published",
] as const;

export type NotifiableSocialEvent = (typeof NOTIFIABLE_SOCIAL_EVENTS)[number];

export const NON_NOTIFIABLE_ACTIVITY_EVENTS = [
  "review_created",
  "review_updated",
  "review_added",
  "review_reaction",
  "review_reply",
  "book_added",
  "shelf_updated",
  "book_finished",
  "reading_finished",
  "reading_started",
  "progress_updated",
  "progress",
  "mention",
  "post_comment_reaction",
] as const;

export type NonNotifiableActivityEvent = (typeof NON_NOTIFIABLE_ACTIVITY_EVENTS)[number];

export function isNotifiableSocialEvent(
  kind: string | null | undefined
): kind is NotifiableSocialEvent {
  return Boolean(kind && (NOTIFIABLE_SOCIAL_EVENTS as readonly string[]).includes(kind));
}

export function resolveNotificationKind(
  type: string,
  metadataKind?: string | null
): string {
  if (type === "message" || type === "follow") return type;
  if (metadataKind?.trim()) return metadataKind.trim();
  return type;
}

export function shouldCreateStandardNotification(input: {
  type: string;
  notificationKind?: string | null;
}): boolean {
  if (input.type === "club") return true;
  const kind = resolveNotificationKind(input.type, input.notificationKind);
  return isNotifiableSocialEvent(kind);
}
