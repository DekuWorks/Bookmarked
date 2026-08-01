"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/messages/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import {
  createDirectConversation,
  getConversations,
  sendMessage,
  searchProfilesForMessaging,
} from "@/lib/services/messages";
import { getFollowList } from "@/lib/services/follows";
import { createPost } from "@/lib/services/posts";
import { messageThreadPath } from "@/lib/routes/messages";
import { profileDisplayName } from "@/lib/utils/messaging";
import type { ConversationPreview, MessageProfile } from "@/types";
import { cn } from "@/lib/utils/cn";

export type SharePayload = {
  kind: "post" | "review" | "book" | "activity";
  title: string;
  previewPath: string;
  body: string;
  bookId?: string | null;
  imageUrl?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  payload: SharePayload | null;
  onSharedToFeed?: () => void;
};

type Mode = "choose" | "message";

export function ShareContentModal({
  open,
  onClose,
  currentUserId,
  payload,
  onSharedToFeed,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("choose");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageProfile[]>([]);
  const [followers, setFollowers] = useState<MessageProfile[]>([]);
  const [recent, setRecent] = useState<ConversationPreview[]>([]);
  const [selected, setSelected] = useState<MessageProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode("choose");
    setNote("");
    setQuery("");
    setResults([]);
    setSelected(null);
    setError(null);

    void getConversations(currentUserId)
      .then((rows) => setRecent(rows.slice(0, 6)))
      .catch(() => setRecent([]));

    void getFollowList(currentUserId, currentUserId, "followers")
      .then((rows) =>
        setFollowers(
          rows.slice(0, 12).map((row) => ({
            id: row.id,
            username: row.username,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
          }))
        )
      )
      .catch(() => setFollowers([]));
  }, [open, currentUserId]);

  useEffect(() => {
    if (!open || mode !== "message") return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void searchProfilesForMessaging(trimmed, currentUserId).then(setResults);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, currentUserId, open, mode]);

  if (!payload) return null;

  async function handleShareToFeed() {
    const share = payload;
    if (!share) return;
    setSubmitting(true);
    setError(null);
    const result = await createPost({
      body: note.trim() ? `${note.trim()}\n\n${share.body}` : share.body,
      bookId: share.bookId ?? null,
      imageUrl: share.imageUrl ?? null,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Shared to your feed.");
    onSharedToFeed?.();
    onClose();
  }

  async function handleShareToMessage() {
    const share = payload;
    if (!share) return;
    if (!selected) {
      setError("Select a recipient.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const convo = await createDirectConversation(selected.id);
    if (convo.error || !convo.conversationId) {
      setSubmitting(false);
      setError(convo.error ?? "Could not start conversation.");
      toast.error(convo.error ?? "Could not start conversation.");
      return;
    }
    const body = [note.trim(), share.body, `Open: ${share.previewPath}`]
      .filter(Boolean)
      .join("\n\n");
    const sent = await sendMessage(convo.conversationId, body);
    setSubmitting(false);
    if (sent.error) {
      setError(sent.error);
      toast.error(sent.error);
      return;
    }
    toast.success("Message delivered.");
    onClose();
    router.push(messageThreadPath(convo.conversationId));
  }

  const recentProfiles: MessageProfile[] = recent.flatMap((row) => {
    const peer = row.participants?.find((participant) => participant.user_id !== currentUserId);
    const profile = peer?.profile;
    if (!profile) return [];
    return [
      {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      },
    ];
  });

  const pickerProfiles =
    query.trim().length >= 2 ? results : followers.length ? followers : recentProfiles;

  return (
    <Modal open={open} onClose={onClose} title="Share" className="max-w-lg">
      <div className="space-y-4 text-left">
        <div className="rounded-xl border border-border bg-background px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Preview</p>
          <p className="mt-1 text-sm font-semibold text-puce-red">{payload.title}</p>
          <p className="mt-1 line-clamp-3 text-sm text-text">{payload.body}</p>
          <Link
            href={payload.previewPath}
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Open content
          </Link>
        </div>

        {mode === "choose" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="primary" loading={submitting} onClick={() => void handleShareToFeed()}>
              Share → Feed
            </Button>
            <Button type="button" variant="outline" onClick={() => setMode("message")}>
              Share → Message
            </Button>
          </div>
        ) : (
          <>
            <label className="block text-left text-sm font-medium text-text">
              Optional message
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a note…"
                className="mt-1"
              />
            </label>

            <label className="block text-left text-sm font-medium text-text">
              Find a reader
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search readers…"
                className="mt-1"
              />
            </label>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {query.trim().length >= 2
                  ? "Search results"
                  : followers.length
                    ? "Followers"
                    : "Recent conversations"}
              </p>
              <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                {pickerProfiles.map((profile) => (
                  <li key={profile.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(profile)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                        selected?.id === profile.id
                          ? "bg-primary/20"
                          : "hover:bg-background"
                      )}
                    >
                      <UserAvatar profile={profile} size="sm" />
                      <span className="text-sm font-medium text-text">
                        {profileDisplayName(profile)}
                      </span>
                    </button>
                  </li>
                ))}
                {pickerProfiles.length === 0 ? (
                  <li className="px-3 py-4 text-sm text-text-muted">No readers found.</li>
                ) : null}
              </ul>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => setMode("choose")}>
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                loading={submitting}
                onClick={() => void handleShareToMessage()}
              >
                Send message
              </Button>
            </div>
          </>
        )}

        {mode === "choose" && error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </Modal>
  );
}
