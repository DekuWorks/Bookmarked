"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import {
  approveJoinRequest,
  banMember,
  cancelInvitation,
  declineJoinRequest,
  listClubPendingInvitations,
  listJoinRequests,
  removeMember,
  transferOwnership,
  updateMemberRole,
  type BookClubPendingInvitation,
} from "@/lib/services/bookClubs";
import { readerProfilePath } from "@/lib/routes/reader";
import {
  canManageMembers,
  roleLabel,
} from "@bookmarked/utils/clubPermissions";
import type {
  BookClubJoinRequestWithDetails,
  BookClubMemberRole,
  BookClubMemberWithProfile,
} from "@/types";

type Props = {
  clubId: string;
  members: BookClubMemberWithProfile[];
  viewerId: string;
  viewerRole: BookClubMemberRole | null;
  onInvite?: () => void;
  onChanged?: () => void;
};

type MemberFilter =
  | "all"
  | "owner"
  | "host"
  | "moderator"
  | "member"
  | "pending_invites"
  | "join_requests";

const FILTERS: Array<{ id: MemberFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "owner", label: "Owner" },
  { id: "host", label: "Hosts" },
  { id: "moderator", label: "Moderators" },
  { id: "member", label: "Members" },
  { id: "pending_invites", label: "Pending invites" },
  { id: "join_requests", label: "Join requests" },
];

function memberLabel(member: BookClubMemberWithProfile): string {
  return (
    member.profile.display_name?.trim() || member.profile.username?.trim() || "Reader"
  );
}

function requestLabel(request: BookClubJoinRequestWithDetails): string {
  return (
    request.requester.display_name?.trim() ||
    request.requester.username?.trim() ||
    "Reader"
  );
}

function inviteLabel(invite: BookClubPendingInvitation): string {
  return (
    invite.invitee.display_name?.trim() || invite.invitee.username?.trim() || "Reader"
  );
}

export function ClubMembersPanel({
  clubId,
  members,
  viewerId,
  viewerRole,
  onInvite,
  onChanged,
}: Props) {
  const toast = useToast();
  const canManage = canManageMembers(viewerRole);
  const isOwner = viewerRole === "owner";
  const [filter, setFilter] = useState<MemberFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [invites, setInvites] = useState<BookClubPendingInvitation[] | null>(null);
  const [requests, setRequests] = useState<BookClubJoinRequestWithDetails[] | null>(null);

  const loadExtras = useCallback(async () => {
    if (!canManage) {
      setInvites([]);
      setRequests([]);
      return;
    }
    const [inviteRows, requestRows] = await Promise.all([
      listClubPendingInvitations(clubId),
      listJoinRequests(clubId),
    ]);
    setInvites(inviteRows);
    setRequests(requestRows);
  }, [clubId, canManage]);

  useEffect(() => {
    void loadExtras().catch((err) => {
      console.error("[club-members] extras failed:", err);
      setInvites([]);
      setRequests([]);
    });
  }, [loadExtras]);

  const filteredMembers = useMemo(() => {
    if (filter === "all") return members;
    if (filter === "owner" || filter === "host" || filter === "moderator" || filter === "member") {
      return members.filter((member) => member.role === filter);
    }
    return [];
  }, [members, filter]);

  async function runAction(id: string, action: () => Promise<{ error?: string }>, success: string) {
    setPendingId(id);
    const result = await action();
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(success);
    onChanged?.();
    void loadExtras();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-puce-red">Members</h2>
        {canManage && onInvite ? (
          <Button type="button" variant="primary" size="sm" onClick={onInvite}>
            Invite
          </Button>
        ) : null}
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Member filters"
      >
        {FILTERS.map((item) => {
          if (
            (item.id === "pending_invites" || item.id === "join_requests") &&
            !canManage
          ) {
            return null;
          }
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
                filter === item.id
                  ? "bg-puce-red text-white"
                  : "bg-surface text-text-muted hover:text-primary"
              }`}
            >
              {item.label}
              {item.id === "pending_invites" && invites?.length
                ? ` (${invites.length})`
                : null}
              {item.id === "join_requests" && requests?.length
                ? ` (${requests.length})`
                : null}
            </button>
          );
        })}
      </div>

      {filter === "pending_invites" ? (
        invites === null ? (
          <LoadingState message="Loading invites…" />
        ) : invites.length === 0 ? (
          <p className="text-sm text-text-muted">No pending invitations.</p>
        ) : (
          <ul className="space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
              >
                <ProfileAvatar profile={invite.invitee} size="sm" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{inviteLabel(invite)}</p>
                  <p className="text-xs text-text-muted">Pending invitation</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={pendingId === invite.id}
                  onClick={() =>
                    void runAction(invite.id, () => cancelInvitation(invite.id), "Invitation canceled.")
                  }
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {filter === "join_requests" ? (
        requests === null ? (
          <LoadingState message="Loading requests…" />
        ) : requests.length === 0 ? (
          <p className="text-sm text-text-muted">No pending join requests.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
              >
                <ProfileAvatar profile={request.requester} size="sm" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{requestLabel(request)}</p>
                  {request.message ? (
                    <p className="truncate text-xs text-text-muted">{request.message}</p>
                  ) : (
                    <p className="text-xs text-text-muted">Wants to join</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={pendingId === `${request.id}-approve`}
                  onClick={() =>
                    void runAction(
                      `${request.id}-approve`,
                      () => approveJoinRequest(request.id),
                      "Request approved."
                    )
                  }
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={pendingId === `${request.id}-decline`}
                  onClick={() =>
                    void runAction(
                      `${request.id}-decline`,
                      () => declineJoinRequest(request.id),
                      "Request declined."
                    )
                  }
                >
                  Decline
                </Button>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {filter !== "pending_invites" && filter !== "join_requests" ? (
        filteredMembers.length === 0 ? (
          <p className="text-sm text-text-muted">No members in this filter.</p>
        ) : (
          <ul className="space-y-2">
            {filteredMembers.map((member) => {
              const label = memberLabel(member);
              const href = member.profile.username
                ? readerProfilePath(member.profile.username)
                : null;
              const canAct =
                canManage && member.role !== "owner" && member.user_id !== viewerId;

              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
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
                      <Link
                        href={href}
                        className="block truncate font-medium text-text hover:text-primary"
                      >
                        {label}
                      </Link>
                    ) : (
                      <span className="block truncate font-medium text-text">{label}</span>
                    )}
                    {member.profile.username ? (
                      <p className="truncate text-xs text-text-muted">
                        @{member.profile.username}
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-puce-red">
                    {roleLabel(member.role)}
                  </span>

                  {canAct ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {isOwner || viewerRole === "host" ? (
                        <select
                          aria-label={`Role for ${label}`}
                          value={member.role}
                          disabled={pendingId === member.user_id}
                          onChange={(e) => {
                            const role = e.target.value as Exclude<BookClubMemberRole, "owner">;
                            void runAction(
                              member.user_id,
                              () => updateMemberRole(clubId, member.user_id, role),
                              `Updated to ${roleLabel(role)}.`
                            );
                          }}
                          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text"
                        >
                          <option value="host">Host</option>
                          <option value="moderator">Moderator</option>
                          <option value="member">Member</option>
                        </select>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={pendingId === `remove-${member.user_id}`}
                        onClick={() =>
                          void runAction(
                            `remove-${member.user_id}`,
                            () => removeMember(clubId, member.user_id),
                            "Member removed."
                          )
                        }
                      >
                        Remove
                      </Button>
                      {isOwner ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            loading={pendingId === `ban-${member.user_id}`}
                            onClick={() => {
                              if (!window.confirm(`Ban ${label} from this club?`)) return;
                              void runAction(
                                `ban-${member.user_id}`,
                                () => banMember(clubId, member.user_id),
                                "Member banned."
                              );
                            }}
                          >
                            Ban
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            loading={pendingId === `transfer-${member.user_id}`}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Transfer ownership to ${label}? You will become a host.`
                                )
                              ) {
                                return;
                              }
                              void runAction(
                                `transfer-${member.user_id}`,
                                () => transferOwnership(clubId, member.user_id),
                                "Ownership transferred."
                              );
                            }}
                          >
                            Transfer
                          </Button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )
      ) : null}
    </section>
  );
}
