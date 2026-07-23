"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsIcon } from "@/components/icons/SettingsIcon";
import { UserAvatar } from "@/components/messages/UserAvatar";
import { CircleAvatarUpload } from "@/components/ui/CircleAvatarUpload";
import {
  addGroupMembers,
  leaveConversation,
  removeGroupMember,
  renameGroupConversation,
  searchProfilesForMessaging,
} from "@/lib/services/messages";
import { removeGroupAvatar, uploadGroupAvatar } from "@/lib/services/entityAvatar";
import { messagesInboxPath } from "@/lib/routes/messages";
import { readerProfilePath } from "@/lib/routes/reader";
import { profileDisplayName } from "@/lib/utils/messaging";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";
import type { ConversationWithParticipants, MessageProfile } from "@/types";

type Props = {
  conversation: ConversationWithParticipants;
  currentUserId: string;
  onUpdated: () => void;
};

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function GroupSettingsMenu({ conversation, currentUserId, onUpdated }: Props) {
  const router = useRouter();
  const toast = useToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (!isMobile) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
    setOpen(false);
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

  const panelClassName =
    "max-h-[min(70vh,32rem)] w-full min-w-0 overflow-y-auto rounded-xl border border-border bg-surface p-4 shadow-lg sm:w-80 sm:min-w-[18rem]";

  const panelContent = (
    <>
      {isOwner ? (
        <Section title="Group">
          <div className="w-full min-w-0 space-y-4">
            <CircleAvatarUpload
              imageUrl={conversation.avatar_url}
              fallbackLabel={title}
              disabled={busy}
              size="md"
              onFileSelect={async (file) => {
                const result = await uploadGroupAvatar(conversation.id, file);
                if (result.error) throw new Error(result.error);
                toast.success("Group photo updated");
                onUpdated();
              }}
              onRemove={async () => {
                const result = await removeGroupAvatar(conversation.id);
                if (result.error) throw new Error(result.error);
                toast.success("Group photo removed");
                onUpdated();
              }}
            />
            <div className="w-full min-w-0 space-y-3 [&>div]:mb-0">
              <Input
                id="group-title"
                label="Group name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Book club friends, reading buddies…"
                disabled={busy}
                className="min-w-0"
              />
              <Button
                type="button"
                size="sm"
                disabled={busy || !title.trim()}
                onClick={() => void handleRename()}
                className="w-full"
              >
                Save name
              </Button>
            </div>
          </div>
        </Section>
      ) : null}

      <Section title={`Members (${conversation.participants.length})`} className="mt-4">
        <ul className="divide-y divide-border rounded-lg border border-border">
          {conversation.participants.map((participant) => {
            const username = participant.profile.username?.trim() || null;
            const href = username ? readerProfilePath(username) : null;
            const name = profileDisplayName(participant.profile);
            const canRemove =
              isOwner &&
              participant.user_id !== currentUserId &&
              participant.role !== "owner";

            return (
              <li
                key={participant.id}
                className="flex items-center justify-between gap-2 px-2.5 py-2"
              >
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
                {canRemove ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleRemoveMember(participant.user_id)}
                    className="shrink-0 text-xs font-medium text-rust hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Section>

      {isOwner ? (
        <Section title="Add members" className="mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search readers…"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          />
          {searchResults.length > 0 ? (
            <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded-lg border border-border p-1.5">
              {searchResults.map((profile) => (
                <li key={profile.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-background">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(profile.id)}
                      onChange={() => toggleSelected(profile.id)}
                      className="accent-royal-orange"
                    />
                    {profileDisplayName(profile)}
                  </label>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 2 ? (
            <p className="text-xs text-text-muted">No readers found.</p>
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
        </Section>
      ) : null}

      <div className="mt-4 border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void handleLeave()}
          className="w-full sm:w-auto"
        >
          Leave group
        </Button>
      </div>
    </>
  );

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Group settings"
        className={cn(
          "flex items-center justify-center rounded-md p-1.5 transition",
          open
            ? "bg-background text-royal-orange"
            : "text-text-muted hover:bg-background hover:text-royal-orange"
        )}
      >
        <SettingsIcon className="h-4 w-4" />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-puce-red/30 sm:hidden"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-label="Group settings"
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-1 sm:rounded-xl",
              panelClassName
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2 sm:hidden">
              <p className="text-sm font-semibold text-puce-red">Group settings</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-text-muted hover:bg-background hover:text-text"
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>
            {panelContent}
          </div>
        </>
      ) : null}
    </div>
  );
}
