/**
 * Plus club analytics — aggregates only, never private reading spy data.
 * Roles are owner/host only via `canViewDetailedStats`. No separate admin role.
 */

import { canViewDetailedStats } from "./clubPermissions";
import type { BookClubMemberRole } from "../types";

export const CLUB_ANALYTICS_ROLES: BookClubMemberRole[] = ["owner", "host"];

export function canViewClubAnalytics(input: {
  hasPlus: boolean;
  role: BookClubMemberRole | null | undefined;
}): boolean {
  return input.hasPlus && canViewDetailedStats(input.role);
}

export type ClubAnalyticsSnapshot = {
  memberCount: number;
  activeMembers: number;
  discussions: number;
  replies: number;
  events: number;
  rsvpsGoing: number;
  booksCompleted: number;
  growth30d: number;
  pollCount: number;
  pollVotes: number;
};

export function emptyClubAnalytics(): ClubAnalyticsSnapshot {
  return {
    memberCount: 0,
    activeMembers: 0,
    discussions: 0,
    replies: 0,
    events: 0,
    rsvpsGoing: 0,
    booksCompleted: 0,
    growth30d: 0,
    pollCount: 0,
    pollVotes: 0,
  };
}
