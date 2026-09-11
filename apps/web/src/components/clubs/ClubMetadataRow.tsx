"use client";

import { cn } from "@/lib/utils/cn";
import { roleLabel, visibilityLabel } from "@bookmarked/utils/clubPermissions";
import type { BookClubMemberRole, BookClubVisibility } from "@/types";

type Props = {
  memberCount: number;
  visibility: BookClubVisibility;
  viewerRole?: BookClubMemberRole | null;
  /** When banner text needs contrast over dark imagery. */
  onDark?: boolean;
  className?: string;
};

export function ClubMetadataRow({
  memberCount,
  visibility,
  viewerRole,
  onDark,
  className,
}: Props) {
  const memberLabel = `${memberCount} member${memberCount === 1 ? "" : "s"}`;
  const chip = onDark
    ? "rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
    : "rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted";
  const roleChip = onDark
    ? "rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
    : "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-puce-red";
  const text = onDark ? "text-sm text-white/90" : "text-sm text-text-muted";

  return (
    <div className={cn("mt-1 flex flex-wrap items-center gap-2", className)}>
      <span className={text}>{memberLabel}</span>
      <span className={chip}>{visibilityLabel(visibility)}</span>
      {viewerRole ? <span className={roleChip}>{roleLabel(viewerRole)}</span> : null}
    </div>
  );
}
