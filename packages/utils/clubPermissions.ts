import type { BookClubMemberRole, BookClubVisibility } from "../types";

export const CLUB_MANAGE_ROLES: BookClubMemberRole[] = ["owner", "host"];
export const CLUB_MODERATE_ROLES: BookClubMemberRole[] = [
  "owner",
  "host",
  "moderator",
];

export function hasClubRole(
  role: BookClubMemberRole | null | undefined,
  allowed: BookClubMemberRole[]
): boolean {
  return Boolean(role && allowed.includes(role));
}

export function canEditClub(role: BookClubMemberRole | null | undefined): boolean {
  return role === "owner";
}

export function canManageMembers(role: BookClubMemberRole | null | undefined): boolean {
  return hasClubRole(role, CLUB_MANAGE_ROLES);
}

export function canManageBookshelf(role: BookClubMemberRole | null | undefined): boolean {
  return hasClubRole(role, CLUB_MANAGE_ROLES);
}

export function canManageEvents(role: BookClubMemberRole | null | undefined): boolean {
  return hasClubRole(role, CLUB_MANAGE_ROLES);
}

export function canCreateAnnouncements(
  role: BookClubMemberRole | null | undefined
): boolean {
  return hasClubRole(role, CLUB_MANAGE_ROLES);
}

export function canModerateDiscussions(
  role: BookClubMemberRole | null | undefined
): boolean {
  return hasClubRole(role, CLUB_MODERATE_ROLES);
}

export function canPinDiscussions(role: BookClubMemberRole | null | undefined): boolean {
  return hasClubRole(role, CLUB_MANAGE_ROLES);
}

export function canViewDetailedStats(
  role: BookClubMemberRole | null | undefined
): boolean {
  return hasClubRole(role, CLUB_MANAGE_ROLES);
}

export function canShareClubToFeed(visibility: BookClubVisibility): boolean {
  return visibility === "public";
}

export function canSelfJoin(input: {
  visibility: BookClubVisibility;
  joinPolicy: string;
}): boolean {
  return input.visibility === "public" && input.joinPolicy === "open";
}

export function requiresJoinRequest(input: {
  joinPolicy: string;
}): boolean {
  return input.joinPolicy === "request_approval";
}

export function isInviteOnlyClub(input: {
  visibility: BookClubVisibility;
  joinPolicy: string;
}): boolean {
  return (
    input.visibility === "invite_only" || input.joinPolicy === "invitation_only"
  );
}

export function roleLabel(role: BookClubMemberRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "host":
      return "Host";
    case "moderator":
      return "Moderator";
    default:
      return "Member";
  }
}

export function visibilityLabel(visibility: BookClubVisibility): string {
  switch (visibility) {
    case "public":
      return "Public";
    case "private":
      return "Private";
    case "invite_only":
      return "Invite only";
    default:
      return "Club";
  }
}

export const CLUB_GENRE_OPTIONS = [
  "Fantasy",
  "Romance",
  "Mystery",
  "Thriller",
  "Literary",
  "Sci-Fi",
  "Nonfiction",
  "Memoir",
  "Horror",
  "YA",
  "Classics",
  "Contemporary",
] as const;

export const MEETING_PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  microsoft_teams: "Microsoft Teams",
  other: "Other",
};

export function detectMeetingPlatform(
  url: string | null | undefined
): "zoom" | "google_meet" | "microsoft_teams" | "other" | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("zoom.us")) return "zoom";
  if (lower.includes("meet.google.com")) return "google_meet";
  if (lower.includes("teams.microsoft.com") || lower.includes("teams.live.com")) {
    return "microsoft_teams";
  }
  return "other";
}

export function isSafeHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
