"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/messages/UserAvatar";
import {
  createDirectConversation,
  createGroupConversation,
  searchProfilesForMessaging,
} from "@/lib/services/messages";
import { CircleAvatarUpload } from "@/components/ui/CircleAvatarUpload";
import { uploadGroupAvatar } from "@/lib/services/entityAvatar";
import { messageThreadPath } from "@/lib/routes/messages";
import { profileDisplayName } from "@/lib/utils/messaging";
import { useToast } from "@/components/ui/Toast";
import type { MessageProfile } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
};

type Mode = "direct" | "group";

export function NewMessageModal({
  open,
  onClose,
  currentUserId,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("direct");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDirect, setSelectedDirect] = useState<MessageProfile | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<MessageProfile[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupAvatarFile, setGroupAvatarFile] = useState<File | null>(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setMode("direct");
    setQuery("");
    setResults([]);
    setSelectedDirect(null);
    setSelectedGroup([]);
    setGroupTitle("");
    setGroupAvatarFile(null);
    setGroupAvatarPreview(null);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const handle = window.setTimeout(() => {
      void searchProfilesForMessaging(trimmed, currentUserId)
        .then(setResults)
        .finally(() => setSearching(false));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [query, currentUserId, open, mode]);

  function toggleGroupMember(profile: MessageProfile) {
    setSelectedGroup((current) => {
      const exists = current.some((p) => p.id === profile.id);
      if (exists) return current.filter((p) => p.id !== profile.id);
      return [...current, profile];
    });
  }

  async function handleDirectMessage() {
    if (!selectedDirect) {
      setError("Select a reader to message.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createDirectConversation(selectedDirect.id);
    setSubmitting(false);

    if (result.error || !result.conversationId) {
      setError(result.error ?? "Could not start conversation.");
      toast.error(result.error ?? "Could not start conversation.");
      return;
    }

    onClose();
    router.push(messageThreadPath(result.conversationId));
  }

  async function handleCreateGroup() {
    if (!groupTitle.trim()) {
      setError("Enter a group name.");
      return;
    }
    if (selectedGroup.length < 2) {
      setError("Select at least two other readers.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createGroupConversation(
      groupTitle,
      selectedGroup.map((p) => p.id)
    );
    setSubmitting(false);

    if (result.error || !result.conversationId) {
      setError(result.error ?? "Could not create group.");
      toast.error(result.error ?? "Could not create group.");
      return;
    }

    if (groupAvatarFile) {
      const avatarResult = await uploadGroupAvatar(result.conversationId, groupAvatarFile);
      if (avatarResult.error) {
        toast.error(avatarResult.error);
      }
    }

    onClose();
    router.push(messageThreadPath(result.conversationId));
  }

  return (
    <Modal open={open} onClose={onClose} title="New message" className="max-w-lg">
      <div className="space-y-4">
        <div className="flex rounded-lg border border-border bg-background p-1">
          {(["direct", "group"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setMode(option);
                setError(null);
              }}
              className={cn(
                "min-h-[44px] flex-1 rounded-md px-3 text-sm font-medium transition",
                mode === option
                  ? "bg-puce-red text-white"
                  : "text-text-muted hover:text-text"
              )}
            >
              {option === "direct" ? "Direct message" : "Group chat"}
            </button>
          ))}
        </div>

        {mode === "group" ? (
          <>
            <CircleAvatarUpload
              imageUrl={groupAvatarPreview}
              fallbackLabel={groupTitle || "Group"}
              disabled={submitting}
              onFileSelect={async (file) => {
                setGroupAvatarFile(file);
                setGroupAvatarPreview(URL.createObjectURL(file));
              }}
              onRemove={async () => {
                setGroupAvatarFile(null);
                setGroupAvatarPreview(null);
              }}
            />
            <Input
              label="Group name"
              name="group-title"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Book club friends, reading buddies…"
            />
          </>
        ) : null}

        <Input
          label="Search readers"
          name="reader-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or display name"
        />

        {searching ? (
          <p className="text-sm text-text-muted">Searching…</p>
        ) : query.trim().length >= 2 && results.length === 0 ? (
          <p className="text-sm text-text-muted">No readers found.</p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {results.map((profile) => {
              const selected =
                mode === "direct"
                  ? selectedDirect?.id === profile.id
                  : selectedGroup.some((p) => p.id === profile.id);

              return (
                <li key={profile.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (mode === "direct") {
                        setSelectedDirect(profile);
                      } else {
                        toggleGroupMember(profile);
                      }
                      setError(null);
                    }}
                    className={cn(
                      "flex w-full min-h-[44px] items-center gap-3 rounded-lg border px-3 py-2 text-left transition",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <UserAvatar profile={profile} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">
                        {profileDisplayName(profile)}
                      </p>
                      {profile.username ? (
                        <p className="truncate text-xs text-text-muted">@{profile.username}</p>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {mode === "group" && selectedGroup.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedGroup.map((profile) => (
              <span
                key={profile.id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-puce-red"
              >
                {profileDisplayName(profile)}
                <button
                  type="button"
                  aria-label={`Remove ${profileDisplayName(profile)}`}
                  onClick={() => toggleGroupMember(profile)}
                  className="ml-1 text-rust"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {error ? <p className="text-sm text-rust">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          {mode === "direct" ? (
            <Button
              type="button"
              onClick={() => void handleDirectMessage()}
              loading={submitting}
              disabled={!selectedDirect}
            >
              Message
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handleCreateGroup()}
              loading={submitting}
              disabled={!groupTitle.trim() || selectedGroup.length < 2}
            >
              Create group
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
