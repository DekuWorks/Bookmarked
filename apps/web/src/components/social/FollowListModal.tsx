"use client";

import { useEffect, useState } from "react";
import { FollowListRow } from "@/components/social/FollowListRow";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  getFollowList,
  getSharedFollowing,
  type FollowListKind,
  type FollowListUser,
} from "@/lib/services/follows";

type Props = {
  open: boolean;
  onClose: () => void;
  kind: FollowListKind;
  profileUserId: string;
  viewerId: string;
  profileName: string;
  isOwnProfile: boolean;
};

function FollowUserList({
  users,
  viewerId,
  onNavigate,
}: {
  users: FollowListUser[];
  viewerId: string;
  onNavigate: () => void;
}) {
  if (!users.length) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
        No one here yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {users.map((user) => (
        <FollowListRow
          key={user.id}
          user={user}
          viewerId={viewerId}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  );
}

export function FollowListModal({
  open,
  onClose,
  kind,
  profileUserId,
  viewerId,
  profileName,
  isOwnProfile,
}: Props) {
  const [users, setUsers] = useState<FollowListUser[] | null>(null);
  const [sharedFollowing, setSharedFollowing] = useState<FollowListUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setUsers(null);
      setSharedFollowing(null);
      setError(null);
      return;
    }

    void (async () => {
      try {
        const [list, shared] = await Promise.all([
          getFollowList(profileUserId, viewerId, kind),
          isOwnProfile
            ? Promise.resolve([])
            : getSharedFollowing(profileUserId, viewerId),
        ]);
        setUsers(list);
        setSharedFollowing(shared);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load list.");
        setUsers([]);
        setSharedFollowing([]);
      }
    })();
  }, [open, profileUserId, viewerId, kind, isOwnProfile]);

  const title = kind === "followers" ? "Followers" : "Following";
  const mutuals = users?.filter((user) => user.isMutual) ?? [];
  const others = users?.filter((user) => !user.isMutual) ?? [];
  const shared =
    sharedFollowing?.filter((user) => !mutuals.some((mutual) => mutual.id === user.id)) ?? [];

  return (
    <Modal open={open} onClose={onClose} title={`${profileName} · ${title}`} className="max-w-lg">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : users === null ? (
        <LoadingState message="Loading…" />
      ) : users.length === 0 && shared.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
          {kind === "followers" ? "No followers yet." : "Not following anyone yet."}
        </p>
      ) : (
        <div className="space-y-6">
          {mutuals.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-puce-red">Mutuals</h3>
              <FollowUserList users={mutuals} viewerId={viewerId} onNavigate={onClose} />
            </section>
          ) : null}

          {!isOwnProfile && shared.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-puce-red">You both follow</h3>
              <FollowUserList users={shared} viewerId={viewerId} onNavigate={onClose} />
            </section>
          ) : null}

          {others.length > 0 ? (
            <section className="space-y-2">
              {mutuals.length > 0 || shared.length > 0 ? (
                <h3 className="text-sm font-semibold text-text-muted">
                  {kind === "followers" ? "All followers" : "All following"}
                </h3>
              ) : null}
              <FollowUserList users={others} viewerId={viewerId} onNavigate={onClose} />
            </section>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
