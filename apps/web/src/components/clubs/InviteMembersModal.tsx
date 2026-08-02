"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/messages/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import { listMembers, sendInvitations } from "@/lib/services/bookClubs";
import { getFollowList } from "@/lib/services/follows";
import { searchProfilesForMessaging } from "@/lib/services/messages";
import { profileDisplayName } from "@/lib/utils/messaging";
import type { MessageProfile } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  clubId: string;
  currentUserId: string;
  clubName?: string;
  onInvited?: () => void;
};

export function InviteMembersModal({
  open,
  onClose,
  clubId,
  currentUserId,
  clubName,
  onInvited,
}: Props) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [followers, setFollowers] = useState<MessageProfile[]>([]);
  const [following, setFollowing] = useState<MessageProfile[]>([]);
  const [results, setResults] = useState<MessageProfile[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Map<string, MessageProfile>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPeople, setLoadingPeople] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setMessage("");
    setResults([]);
    setSelected(new Map());
    setError(null);
    setLoadingPeople(true);

    void Promise.all([
      listMembers(clubId),
      getFollowList(currentUserId, currentUserId, "followers"),
      getFollowList(currentUserId, currentUserId, "following"),
    ])
      .then(([members, followerRows, followingRows]) => {
        setMemberIds(new Set(members.map((m) => m.user_id)));
        setFollowers(
          followerRows.map((row) => ({
            id: row.id,
            username: row.username,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
          }))
        );
        setFollowing(
          followingRows.map((row) => ({
            id: row.id,
            username: row.username,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
          }))
        );
      })
      .catch(() => {
        setFollowers([]);
        setFollowing([]);
        setMemberIds(new Set());
      })
      .finally(() => setLoadingPeople(false));
  }, [open, clubId, currentUserId]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void searchProfilesForMessaging(trimmed, currentUserId).then(setResults);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, currentUserId, open]);

  const suggestions = useMemo(() => {
    const byId = new Map<string, MessageProfile>();
    for (const profile of [...following, ...followers]) {
      if (profile.id === currentUserId) continue;
      if (memberIds.has(profile.id)) continue;
      byId.set(profile.id, profile);
    }
    return [...byId.values()];
  }, [followers, following, memberIds, currentUserId]);

  const pickerProfiles = useMemo(() => {
    const source = query.trim().length >= 2 ? results : suggestions;
    return source.filter(
      (profile) => profile.id !== currentUserId && !memberIds.has(profile.id)
    );
  }, [query, results, suggestions, currentUserId, memberIds]);

  function toggleProfile(profile: MessageProfile) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(profile.id)) {
        next.delete(profile.id);
      } else {
        next.set(profile.id, profile);
      }
      return next;
    });
  }

  async function handleSend() {
    if (!selected.size) {
      setError("Select at least one person to invite.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await sendInvitations(
      clubId,
      [...selected.keys()],
      message.trim() || null
    );
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(
      selected.size === 1
        ? "Invitation sent."
        : `${selected.size} invitations sent.`
    );
    onInvited?.();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={clubName ? `Invite to ${clubName}` : "Invite members"}
      className="max-w-lg"
    >
      <div className="space-y-4 text-left">
        <Textarea
          label="Optional message"
          name="invite-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Join us — we're reading something great…"
          className="mb-0 min-h-[72px]"
        />

        <Input
          label="Find readers"
          name="invite-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username…"
          className="mb-0"
        />

        {selected.size > 0 ? (
          <div className="flex flex-wrap gap-2">
            {[...selected.values()].map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => toggleProfile(profile)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-puce-red"
              >
                {profileDisplayName(profile)}
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        ) : null}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {query.trim().length >= 2
              ? "Search results"
              : "Followers & following"}
          </p>
          {loadingPeople ? (
            <p className="mt-3 text-sm text-text-muted">Loading people…</p>
          ) : (
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
              {pickerProfiles.map((profile) => {
                const isSelected = selected.has(profile.id);
                return (
                  <li key={profile.id}>
                    <button
                      type="button"
                      onClick={() => toggleProfile(profile)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                        isSelected ? "bg-primary/20" : "hover:bg-background"
                      )}
                    >
                      <UserAvatar profile={profile} size="sm" />
                      <span className="min-w-0 flex-1 text-sm font-medium text-text">
                        {profileDisplayName(profile)}
                      </span>
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs",
                          isSelected
                            ? "border-primary bg-primary text-on-primary"
                            : "border-border text-transparent"
                        )}
                        aria-hidden
                      >
                        ✓
                      </span>
                    </button>
                  </li>
                );
              })}
              {pickerProfiles.length === 0 ? (
                <li className="px-3 py-4 text-sm text-text-muted">
                  {query.trim().length >= 2
                    ? "No readers found."
                    : "No followers or following to invite yet. Try searching."}
                </li>
              ) : null}
            </ul>
          )}
        </div>

        {error ? <p className="text-sm text-rust">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={!selected.size}
            onClick={() => void handleSend()}
          >
            Send {selected.size > 0 ? `(${selected.size})` : "invites"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
