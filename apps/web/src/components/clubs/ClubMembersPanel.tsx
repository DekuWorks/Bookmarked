"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { removeMember } from "@/lib/services/bookClubs";
import { readerProfilePath } from "@/lib/routes/reader";
import type { BookClubMemberWithProfile } from "@/types";

type Props = {
  clubId: string;
  members: BookClubMemberWithProfile[];
  viewerId: string;
  viewerIsOwner: boolean;
  onChanged?: () => void;
};

function memberLabel(member: BookClubMemberWithProfile): string {
  return (
    member.profile.display_name?.trim() || member.profile.username?.trim() || "Reader"
  );
}

export function ClubMembersPanel({ clubId, members, viewerId, viewerIsOwner, onChanged }: Props) {
  const toast = useToast();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(memberUserId: string) {
    setRemovingId(memberUserId);
    const result = await removeMember(clubId, memberUserId);
    setRemovingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Member removed.");
    onChanged?.();
  }

  return (
    <ul className="space-y-2">
      {members.map((member) => {
        const label = memberLabel(member);
        const href = member.profile.username ? readerProfilePath(member.profile.username) : null;
        const canRemove = viewerIsOwner && member.role !== "owner" && member.user_id !== viewerId;

        return (
          <li
            key={member.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
          >
            {href ? (
              <Link href={href} className="shrink-0">
                <ProfileAvatar profile={member.profile} size="sm" />
              </Link>
            ) : (
              <ProfileAvatar profile={member.profile} size="sm" className="shrink-0" />
            )}

            <div className="min-w-0 flex-1">
              {href ? (
                <Link href={href} className="block truncate font-medium text-text hover:text-primary">
                  {label}
                </Link>
              ) : (
                <span className="block truncate font-medium text-text">{label}</span>
              )}
              {member.profile.username ? (
                <p className="truncate text-xs text-text-muted">@{member.profile.username}</p>
              ) : null}
            </div>

            {member.role === "owner" ? (
              <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-puce-red">
                Owner
              </span>
            ) : null}

            {canRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={removingId === member.user_id}
                onClick={() => void handleRemove(member.user_id)}
              >
                Remove
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
