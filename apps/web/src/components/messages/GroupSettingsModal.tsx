"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/messages/UserAvatar";
import {
  addGroupMembers,
  leaveConversation,
  removeGroupMember,
  renameGroupConversation,
  searchProfilesForMessaging,
} from "@/lib/services/messages";
import { messagesInboxPath } from "@/lib/routes/messages";
import { readerProfilePath } from "@/lib/routes/reader";
import { profileDisplayName } from "@/lib/utils/messaging";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ConversationWithParticipants, MessageProfile } from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  conversation: ConversationWithParticipants;
  currentUserId: string;
  onUpdated: () => void;
};

export function GroupSettingsModal({
  open,
  onClose,
  conversation,
  currentUserId,
  onUpdated,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(conversation.title ?? "");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MessageProfile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const isOwner = conversation.participants.some(
    (p) => p.user_id === currentUserId && p.role === "owner"
  );

  useEffect(() => {
    if (!open) return;
    setTitle(conversation.title ?? "");
    setQuery("");
    setSearchResults([]);
    setSelectedIds([]);
  }, [open, conversation.title]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      void searchProfilesForMessaging(query, currentUserId).then((results) => {
        const memberIds = new Set(conversation.participants.map((p) => p.user_id));
        setSearchResults(results.filter((p) => !memberIds.has(p.id)));
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [open, query, currentUserId, conversation.participants]);

  if (!open) return null;

  async function handleRename() {
    setBusy(true);
    const result = await renameGroupConversation(conversation.id, title);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Group renamed");
    onUpdated();
  }

  async function handleLeave() {
    if (!confirm("Leave this group? You will no longer see its messages.")) return;
    setBusy(true);
    const result = await leaveConversation(conversation.id);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("You left the group");
    onClose();
    router.push(messagesInboxPath());
  }

  async function handleAddMembers() {
    if (!selectedIds.length) return;
    setBusy(true);
    const result = await addGroupMembers(conversation.id, selectedIds);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Added ${result.added ?? selectedIds.length} member(s)`);
    setSelectedIds([]);
    setQuery("");
    onUpdated();
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Remove this member from the group?")) return;
    setBusy(true);
    const result = await removeGroupMember(conversation.id, userId);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Member removed");
    onUpdated();
  }

  function toggleSelected(userId: string) {
    setSelectedIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-puce-red/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Group settings"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-puce-red">Group settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-text-muted hover:text-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {isOwner ? (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-text" htmlFor="group-title">
              Group name
            </label>
            <input
              id="group-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button type="button" size="sm" disabled={busy} onClick={() => void handleRename()}>
              Save name
            </Button>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="text-sm font-medium text-puce-red">Members</p>
          <ul className="mt-2 space-y-2">
            {conversation.participants.map((participant) => {
              const username = participant.profile.username?.trim() || null;
              const href = username ? readerProfilePath(username) : null;
              const name = profileDisplayName(participant.profile);
              return (
              <li key={participant.id} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {href ? (
                    <Link
                      href={href}
                      className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
                      aria-label={`View ${name}'s profile`}
                    >
                      <UserAvatar profile={participant.profile} size="sm" />
                    </Link>
                  ) : (
                    <UserAvatar profile={participant.profile} size="sm" />
                  )}
                  <div className="min-w-0">
                    {href ? (
                      <Link
                        href={href}
                        className="truncate text-sm font-medium text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
                      >
                        {name}
                        {participant.user_id === currentUserId ? " (you)" : ""}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium text-text">
                        {name}
                        {participant.user_id === currentUserId ? " (you)" : ""}
                      </p>
                    )}
                    {participant.role === "owner" ? (
                      <p className="text-xs text-text-muted">Owner</p>
                    ) : null}
                  </div>
                </div>
                {isOwner &&
                participant.user_id !== currentUserId &&
                participant.role !== "owner" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void handleRemoveMember(participant.user_id)}
                  >
                    Remove
                  </Button>
                ) : null}
              </li>
              );
            })}
          </ul>
        </div>

        {isOwner ? (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-puce-red">Add members</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search readers…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            {searchResults.length > 0 ? (
              <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {searchResults.map((profile) => (
                  <li key={profile.id}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(profile.id)}
                        onChange={() => toggleSelected(profile.id)}
                      />
                      {profileDisplayName(profile)}
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy || !selectedIds.length}
              onClick={() => void handleAddMembers()}
            >
              Add selected
            </Button>
          </div>
        ) : null}

        <div className="mt-6 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void handleLeave()}
          >
            Leave group
          </Button>
        </div>
      </div>
    </div>
  );
}
