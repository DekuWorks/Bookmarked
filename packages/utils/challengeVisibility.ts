import type { ChallengeVisibility } from "./challengeTypes";

export type ChallengeVisibilityContext = {
  visibility: ChallengeVisibility;
  createdBy: string | null;
  viewerId: string | null;
  isMember: boolean;
  isInvited: boolean;
  viewerFollowsCreator: boolean;
  isActive: boolean;
};

export function challengeVisibleToViewer(ctx: ChallengeVisibilityContext): boolean {
  if (!ctx.viewerId) {
    return ctx.visibility === "public" && ctx.isActive;
  }
  if (ctx.createdBy && ctx.createdBy === ctx.viewerId) return true;
  if (ctx.isMember) return true;

  switch (ctx.visibility) {
    case "public":
      return ctx.isActive;
    case "followers":
      return ctx.viewerFollowsCreator;
    case "friend":
      return ctx.isInvited;
    case "private":
      return false;
    default:
      return false;
  }
}

export function challengeMembersVisibleToViewer(ctx: ChallengeVisibilityContext): boolean {
  if (!challengeVisibleToViewer(ctx)) return false;
  if (ctx.visibility === "private" || ctx.visibility === "friend") {
    return Boolean(ctx.viewerId && (ctx.isMember || ctx.createdBy === ctx.viewerId));
  }
  return true;
}

/** Private / friend challenges must never appear on the public Feed. */
export function challengeCanShareToFeed(visibility: ChallengeVisibility): boolean {
  return visibility === "public" || visibility === "followers";
}

export function friendCompareTone(label: string): string {
  return label.replace(/loser|last place|winning|beating/gi, "").trim();
}
