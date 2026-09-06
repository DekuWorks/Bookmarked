/**
 * Video for Home experiences. Do not build a conferencing stack.
 * Do not pick Zoom as the production default — attach an external meeting.
 */

export type VideoProviderId = "external" | "unset";

export type VideoJoinConfig = {
  provider: VideoProviderId;
  joinUrl: string | null;
  label: string | null;
};

export type VideoEventProvider = {
  id: VideoProviderId;
  attachExternalMeeting: (input: { url: string; label?: string | null }) => VideoJoinConfig;
  authorizeJoin: (input: {
    authorized: boolean;
    config: VideoJoinConfig;
  }) => VideoJoinConfig | null;
};

export const EXTERNAL_VIDEO_EVENT_PROVIDER: VideoEventProvider = {
  id: "external",
  attachExternalMeeting(input) {
    return {
      provider: "external",
      joinUrl: input.url,
      label: input.label ?? "External meeting",
    };
  },
  authorizeJoin(input) {
    if (!input.authorized) return null;
    return input.config;
  },
};

export function hideJoinUrlUntilAuthorized<T extends { join_url?: string | null }>(
  row: T,
  authorized: boolean
): Omit<T, "join_url"> & { join_url: string | null } {
  return {
    ...row,
    join_url: authorized ? row.join_url ?? null : null,
  };
}

export function isAuthorizedVideoJoin(input: {
  hasHome: boolean;
  rsvpGoing?: boolean;
  ticketed?: boolean;
  ticketPaid?: boolean;
  staff?: boolean;
}): boolean {
  if (input.staff) return true;
  if (input.ticketed) return Boolean(input.ticketPaid);
  return input.hasHome && (input.rsvpGoing !== false);
}
