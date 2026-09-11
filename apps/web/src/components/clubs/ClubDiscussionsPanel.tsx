"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookCover } from "@/components/books/BookCover";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { ClubDiscussionCard } from "@/components/clubs/ClubDiscussionCard";
import { ClubDiscussionComposer } from "@/components/clubs/ClubDiscussionComposer";
import { DiscussionActionsMenu } from "@/components/clubs/DiscussionActionsMenu";
import { EditDiscussionModal } from "@/components/clubs/EditDiscussionModal";
import { ReplyActionsMenu } from "@/components/clubs/ReplyActionsMenu";
import { ProfanityBlur } from "@/components/social/ProfanityBlur";
import {
  useClubDiscussionsRealtime,
  type ClubDiscussionRealtimeChange,
} from "@/lib/hooks/useClubDiscussionsRealtime";
import {
  useClubDiscussionRepliesRealtime,
  type ClubReplyRealtimeChange,
} from "@/lib/hooks/useClubDiscussionRepliesRealtime";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import {
  CLUB_REPLY_SORT_LABEL,
  CLUB_REPLY_SORT_OPTIONS,
  CLUB_REPLY_SORT_STORAGE_KEY,
  mergeClubReplies,
  mergeReconnectClubReplies,
  parseClubReplySort,
  removeClubReply,
  sortClubReplies,
  type ClubReplySort,
} from "../../../../../packages/utils/clubReplyThread";
import {
  adjustDiscussionReplyCount,
  formatReplyCount,
  isDiscussionEdited,
  patchDiscussionContent,
  upsertDiscussionCounts,
} from "@bookmarked/utils/clubDiscussionUi";
import {
  createReply,
  deleteDiscussion,
  deleteReply,
  getDiscussion,
  getReply,
  listDiscussions,
  listReplies,
  setDiscussionLocked,
  setDiscussionPinned,
  updateReply,
} from "@/lib/services/bookClubs";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { readerProfilePath } from "@/lib/routes/reader";
import { formatFeedTimestamp } from "@/lib/utils/locale";
import {
  canPinDiscussions,
} from "@bookmarked/utils/clubPermissions";
import type {
  BookClubDiscussionReplyWithAuthor,
  BookClubDiscussionWithAuthor,
  BookClubMemberRole,
} from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  clubId: string;
  viewerId: string;
  isMember: boolean;
  viewerRole: BookClubMemberRole | null;
  initialDiscussionId?: string | null;
};

type SortFilter = "newest" | "activity" | "pinned";

function authorLabel(author: { display_name: string | null; username: string | null }): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

export function ClubDiscussionsPanel({
  clubId,
  viewerId,
  isMember,
  viewerRole,
  initialDiscussionId,
}: Props) {
  const toast = useToast();
  const router = useRouter();
  const locale = usePreferredLocale();
  const canPin = canPinDiscussions(viewerRole);

  const [discussions, setDiscussions] = useState<BookClubDiscussionWithAuthor[] | null>(null);
  const [filter, setFilter] = useState<SortFilter>("activity");
  const [activeId, setActiveId] = useState<string | null>(initialDiscussionId ?? null);
  const [activeDiscussion, setActiveDiscussion] = useState<BookClubDiscussionWithAuthor | null>(
    null
  );
  const [replies, setReplies] = useState<BookClubDiscussionReplyWithAuthor[] | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replySpoilers, setReplySpoilers] = useState(false);
  const [pending, setPending] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editDiscussionOpen, setEditDiscussionOpen] = useState(false);
  const [fromDeepLink, setFromDeepLink] = useState(Boolean(initialDiscussionId));
  const [replySort, setReplySort] = useState<ClubReplySort>(() => {
    if (typeof window === "undefined") return "newest";
    try {
      return parseClubReplySort(window.localStorage.getItem(CLUB_REPLY_SORT_STORAGE_KEY));
    } catch {
      return "newest";
    }
  });
  const replySortRef = useRef(replySort);
  useEffect(() => {
    replySortRef.current = replySort;
  }, [replySort]);

  function changeReplySort(next: ClubReplySort) {
    setReplySort(next);
    try {
      window.localStorage.setItem(CLUB_REPLY_SORT_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function clearActiveDiscussion() {
    setFromDeepLink(false);
    setActiveId(null);
    setActiveDiscussion(null);
  }

  function handleBackFromThread() {
    if (fromDeepLink && typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    clearActiveDiscussion();
  }

  const loadList = useCallback(async () => {
    const rows = await listDiscussions(clubId);
    setDiscussions(rows);
  }, [clubId]);

  const loadThread = useCallback(
    async (discussionId: string) => {
      const [discussion, replyRows] = await Promise.all([
        getDiscussion(clubId, discussionId),
        listReplies(discussionId),
      ]);
      if (!discussion) {
        throw new Error("Discussion not found.");
      }
      setActiveDiscussion(discussion);
      setReplies(sortClubReplies(replyRows, replySortRef.current));
    },
    [clubId]
  );

  useEffect(() => {
    void loadList().catch((err) => {
      console.error("[club-discussions] load failed:", err);
      setDiscussions([]);
    });
  }, [loadList]);

  useEffect(() => {
    if (!activeId) {
      setActiveDiscussion(null);
      setReplies(null);
      return;
    }
    void loadThread(activeId).catch((err) => {
      console.error("[club-discussions] thread failed:", err);
      toast.error("Could not open discussion.");
      setFromDeepLink(false);
      setActiveId(null);
      setActiveDiscussion(null);
    });
  }, [activeId, loadThread, toast]);

  useEffect(() => {
    if (initialDiscussionId) {
      setFromDeepLink(true);
      setActiveId(initialDiscussionId);
    }
  }, [initialDiscussionId]);

  const handleDiscussionRealtime = useCallback(
    async (change: ClubDiscussionRealtimeChange) => {
      if (change.type === "reconnect") {
        await loadList();
        return;
      }
      if (change.type === "delete") {
        setDiscussions((current) => current?.filter((row) => row.id !== change.id) ?? current);
        if (activeId === change.id) clearActiveDiscussion();
        return;
      }
      if (change.type === "update") {
        const patch = {
          id: change.id,
          ...(typeof change.reply_count === "number" ? { reply_count: change.reply_count } : {}),
          ...(typeof change.latest_activity_at === "string"
            ? { latest_activity_at: change.latest_activity_at }
            : {}),
          ...(typeof change.title === "string" ? { title: change.title } : {}),
          ...(typeof change.body === "string" ? { body: change.body } : {}),
          ...(typeof change.updated_at === "string" ? { updated_at: change.updated_at } : {}),
          ...(change.edited_at !== undefined ? { edited_at: change.edited_at } : {}),
          ...(typeof change.is_pinned === "boolean" ? { is_pinned: change.is_pinned } : {}),
          ...(typeof change.is_locked === "boolean" ? { is_locked: change.is_locked } : {}),
        };
        setDiscussions((current) =>
          current ? patchDiscussionContent(current, patch) : current
        );
        setActiveDiscussion((current) =>
          current && current.id === change.id ? { ...current, ...patch } : current
        );
        return;
      }
      const post = await getDiscussion(clubId, change.id);
      if (!post) return;
      setDiscussions((current) => {
        if (!current) return current;
        if (current.some((existing) => existing.id === post.id)) {
          return current.map((row) => (row.id === post.id ? post : row));
        }
        return [post, ...current];
      });
    },
    [activeId, clubId, loadList]
  );

  useClubDiscussionsRealtime(clubId, (change) => {
    void handleDiscussionRealtime(change).catch((err) => {
      console.warn("[club] realtime hydrate failed:", err);
    });
  });

  const handleReplyRealtime = useCallback(
    async (change: ClubReplyRealtimeChange) => {
      if (!activeId) return;
      if (change.type === "delete") {
        setReplies((current) => {
          const had = (current ?? []).some((row) => row.id === change.id);
          const next = removeClubReply(current ?? [], change.id);
          if (had) {
            setDiscussions((rows) =>
              rows ? adjustDiscussionReplyCount(rows, activeId, -1) : rows
            );
          }
          return next;
        });
        return;
      }
      if (change.type === "reconnect") {
        const [rows, discussion] = await Promise.all([
          listReplies(activeId),
          getDiscussion(clubId, activeId),
        ]);
        setReplies((current) =>
          mergeReconnectClubReplies(current ?? [], rows, replySortRef.current, activeId)
        );
        if (discussion) {
          setActiveDiscussion(discussion);
          setDiscussions((current) =>
            current
              ? upsertDiscussionCounts(current, discussion).map((row) =>
                  row.id === discussion.id ? { ...row, ...discussion } : row
                )
              : current
          );
        }
        return;
      }
      const row = await getReply(change.id);
      if (!row || row.discussion_id !== activeId) return;
      setReplies((current) => {
        const existed = (current ?? []).some((item) => item.id === row.id);
        const next = mergeClubReplies(current ?? [], row, replySortRef.current);
        if (!existed && change.type === "insert") {
          setDiscussions((rows) =>
            rows
              ? adjustDiscussionReplyCount(rows, activeId, 1, row.created_at)
              : rows
          );
        }
        return next;
      });
    },
    [activeId, clubId]
  );

  useClubDiscussionRepliesRealtime(activeId ?? undefined, (change) => {
    void handleReplyRealtime(change).catch((err) => {
      console.warn("[club-replies-realtime] hydrate failed:", err);
    });
  });

  const sorted = useMemo(() => {
    const rows = [...(discussions ?? [])];
    if (filter === "pinned") {
      return rows
        .filter((row) => row.is_pinned)
        .sort(
          (a, b) =>
            new Date(b.latest_activity_at).getTime() - new Date(a.latest_activity_at).getTime()
        );
    }
    if (filter === "newest") {
      return rows.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return rows.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return (
        new Date(b.latest_activity_at).getTime() - new Date(a.latest_activity_at).getTime()
      );
    });
  }, [discussions, filter]);

  const sortedReplies = useMemo(
    () => sortClubReplies(replies ?? [], replySort),
    [replies, replySort]
  );

  async function handleReply() {
    if (!activeId || !replyBody.trim()) return;
    setPending(true);
    const result = await createReply(activeId, replyBody, {
      containsSpoilers: replySpoilers,
    });
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setReplyBody("");
    setReplySpoilers(false);
    toast.success("Reply posted.");
    if (result.replyId) {
      const row = await getReply(result.replyId);
      if (row) {
        setReplies((current) => {
          const existed = (current ?? []).some((item) => item.id === row.id);
          const next = mergeClubReplies(current ?? [], row, replySort);
          if (!existed) {
            setDiscussions((rows) =>
              rows
                ? adjustDiscussionReplyCount(rows, activeId, 1, row.created_at)
                : rows
            );
          }
          return next;
        });
      }
    }
  }

  async function handleDeleteDiscussion(discussionId: string) {
    if (!window.confirm("Delete this discussion?")) return;
    setPending(true);
    const result = await deleteDiscussion(discussionId);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Discussion deleted.");
    clearActiveDiscussion();
    await loadList();
  }

  async function handleDeleteReply(replyId: string) {
    setPending(true);
    const result = await deleteReply(replyId);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Reply deleted.");
    setReplies((current) => {
      const had = (current ?? []).some((row) => row.id === replyId);
      const next = removeClubReply(current ?? [], replyId);
      if (had && activeId) {
        setDiscussions((rows) =>
          rows ? adjustDiscussionReplyCount(rows, activeId, -1) : rows
        );
      }
      return next;
    });
  }

  async function handleSaveEditReply(replyId: string) {
    if (!editBody.trim()) return;
    setPending(true);
    const result = await updateReply(replyId, editBody);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Reply updated.");
    setEditingReplyId(null);
    setEditBody("");
    const row = await getReply(replyId);
    if (row) {
      setReplies((current) => mergeClubReplies(current ?? [], row, replySort));
    }
  }

  if (activeId && activeDiscussion) {
    const profileHref = activeDiscussion.author.username
      ? readerProfilePath(activeDiscussion.author.username)
      : null;
    const showEdited = isDiscussionEdited(activeDiscussion);

    return (
      <section className="space-y-4 pt-6 text-left scroll-mt-[var(--app-nav-clearance)]">
        <button
          type="button"
          onClick={handleBackFromThread}
          className="text-left text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          aria-label={fromDeepLink ? "Go back" : "Back to discussions"}
        >
          {fromDeepLink ? "← Back" : "← Back to discussions"}
        </button>

        <article className="rounded-xl border border-border bg-surface p-5 text-left shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 text-left">
            <div className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2 text-left">
                <h2 className="text-left text-xl font-bold text-puce-red">
                  {activeDiscussion.title}
                </h2>
                {activeDiscussion.is_pinned ? (
                  <span className="rounded-full bg-royal-orange/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-royal-orange">
                    Pinned
                  </span>
                ) : null}
                {activeDiscussion.is_locked ? (
                  <span className="rounded-full bg-border/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-text-muted">
                    Locked
                  </span>
                ) : null}
                {activeDiscussion.contains_spoilers ? (
                  <span className="rounded-full bg-rust/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-rust">
                    Spoilers
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                {profileHref ? (
                  <Link href={profileHref} className="flex items-center gap-2 hover:text-primary">
                    <ProfileAvatar profile={activeDiscussion.author} size="sm" />
                    {authorLabel(activeDiscussion.author)}
                  </Link>
                ) : (
                  <>
                    <ProfileAvatar profile={activeDiscussion.author} size="sm" />
                    {authorLabel(activeDiscussion.author)}
                  </>
                )}
                <time suppressHydrationWarning dateTime={activeDiscussion.created_at}>
                  {formatFeedTimestamp(activeDiscussion.created_at, locale)}
                </time>
                {showEdited ? (
                  <span className="text-xs text-text-muted" aria-label="Edited">
                    · Edited
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {canPin ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={pending}
                  onClick={() =>
                    void setDiscussionPinned(activeDiscussion.id, !activeDiscussion.is_pinned).then(
                      async (result) => {
                        if (result.error) toast.error(result.error);
                        else {
                          toast.success(activeDiscussion.is_pinned ? "Unpinned." : "Pinned.");
                          await loadThread(activeDiscussion.id);
                          await loadList();
                        }
                      }
                    )
                  }
                >
                  {activeDiscussion.is_pinned ? "Unpin" : "Pin"}
                </Button>
              ) : null}
              {canPin ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={pending}
                  onClick={() =>
                    void setDiscussionLocked(activeDiscussion.id, !activeDiscussion.is_locked).then(
                      async (result) => {
                        if (result.error) toast.error(result.error);
                        else {
                          toast.success(activeDiscussion.is_locked ? "Unlocked." : "Locked.");
                          await loadThread(activeDiscussion.id);
                          await loadList();
                        }
                      }
                    )
                  }
                >
                  {activeDiscussion.is_locked ? "Unlock" : "Lock"}
                </Button>
              ) : null}
              <DiscussionActionsMenu
                discussionId={activeDiscussion.id}
                creatorId={activeDiscussion.user_id}
                creatorName={authorLabel(activeDiscussion.author)}
                viewerId={viewerId}
                viewerRole={viewerRole}
                onEdit={() => setEditDiscussionOpen(true)}
                onDelete={() => void handleDeleteDiscussion(activeDiscussion.id)}
              />
            </div>
          </div>

          <ProfanityBlur
            text={activeDiscussion.body}
            meta={activeDiscussion.moderation_meta ?? null}
            className="mt-4 text-left"
          >
            <p className="whitespace-pre-wrap text-left text-sm leading-relaxed text-text">
              {activeDiscussion.body}
            </p>
          </ProfanityBlur>

          {activeDiscussion.book ? (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-border p-3">
              <Link
                href={bookDetailsPath(activeDiscussion.book.id)}
                className="h-20 w-14 shrink-0 overflow-hidden rounded-md"
              >
                <BookCover
                  title={activeDiscussion.book.title}
                  author={activeDiscussion.book.author}
                  coverUrl={activeDiscussion.book.cover_url}
                  className="h-full w-full"
                  bookmarked
                />
              </Link>
              <div className="min-w-0">
                <Link
                  href={bookDetailsPath(activeDiscussion.book.id)}
                  className="block font-medium text-puce-red hover:underline"
                >
                  {activeDiscussion.book.title}
                </Link>
                {activeDiscussion.book.author ? (
                  <Link
                    href={authorPagePath(activeDiscussion.book.author)}
                    className="text-sm text-text-muted hover:text-primary hover:underline"
                  >
                    {activeDiscussion.book.author}
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </article>

        <EditDiscussionModal
          open={editDiscussionOpen}
          discussionId={activeDiscussion.id}
          initialTitle={activeDiscussion.title}
          initialBody={activeDiscussion.body}
          onClose={() => setEditDiscussionOpen(false)}
          onSaved={(values) => {
            const patch = {
              id: activeDiscussion.id,
              title: values.title,
              body: values.body,
              updated_at: values.updated_at,
              edited_at: values.edited_at,
            };
            setActiveDiscussion((current) =>
              current && current.id === patch.id ? { ...current, ...patch } : current
            );
            setDiscussions((current) =>
              current ? patchDiscussionContent(current, patch) : current
            );
          }}
        />

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-muted">
              {formatReplyCount(sortedReplies.length)}
            </h3>
            <label className="block">
              <span className="sr-only">{CLUB_REPLY_SORT_LABEL}</span>
              <select
                value={replySort}
                onChange={(e) => changeReplySort(parseClubReplySort(e.target.value))}
                aria-label={CLUB_REPLY_SORT_LABEL}
                className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CLUB_REPLY_SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {replies === null ? (
            <LoadingState message="Loading replies…" />
          ) : sortedReplies.length === 0 ? (
            <p className="text-sm text-text-muted">No replies yet.</p>
          ) : (
            <ul className="space-y-3">
              {sortedReplies.map((reply) => {
                const replyHref = reply.author.username
                  ? readerProfilePath(reply.author.username)
                  : null;
                const isEditing = editingReplyId === reply.id;
                return (
                  <li
                    key={reply.id}
                    className="rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        {replyHref ? (
                          <Link href={replyHref} className="flex items-center gap-2">
                            <ProfileAvatar profile={reply.author} size="sm" />
                            <span className="font-medium text-puce-red">
                              {authorLabel(reply.author)}
                            </span>
                          </Link>
                        ) : (
                          <>
                            <ProfileAvatar profile={reply.author} size="sm" />
                            <span className="font-medium text-puce-red">
                              {authorLabel(reply.author)}
                            </span>
                          </>
                        )}
                        <time
                          suppressHydrationWarning
                          dateTime={reply.created_at}
                          className="text-text-muted"
                        >
                          {formatFeedTimestamp(reply.created_at, locale)}
                        </time>
                        {reply.contains_spoilers ? (
                          <span className="text-[10px] font-semibold uppercase text-rust">
                            Spoilers
                          </span>
                        ) : null}
                      </div>
                      <ReplyActionsMenu
                        replyId={reply.id}
                        replyAuthorId={reply.user_id}
                        replyAuthorName={authorLabel(reply.author)}
                        viewerId={viewerId}
                        viewerRole={viewerRole}
                        onEdit={() => {
                          setEditingReplyId(reply.id);
                          setEditBody(reply.body);
                        }}
                        onDelete={() => void handleDeleteReply(reply.id)}
                      />
                    </div>
                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          label="Edit reply"
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            loading={pending}
                            disabled={!editBody.trim()}
                            onClick={() => void handleSaveEditReply(reply.id)}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingReplyId(null);
                              setEditBody("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ProfanityBlur
                        text={reply.body}
                        meta={reply.moderation_meta ?? null}
                        className="mt-2 text-left"
                      >
                        <p className="whitespace-pre-wrap text-left text-sm text-text">
                          {reply.body}
                        </p>
                      </ProfanityBlur>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {isMember && !activeDiscussion.is_locked ? (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <Textarea
              label="Reply"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={3}
              placeholder="Add to the conversation…"
            />
            <label className="mb-3 flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={replySpoilers}
                onChange={(e) => setReplySpoilers(e.target.checked)}
                className="rounded border-border"
              />
              Contains spoilers
            </label>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={pending}
              disabled={!replyBody.trim()}
              onClick={() => void handleReply()}
            >
              {pending ? "Checking…" : "Post reply"}
            </Button>
          </div>
        ) : activeDiscussion.is_locked ? (
          <p className="text-sm text-text-muted">This discussion is locked.</p>
        ) : (
          <p className="text-sm text-text-muted">Join this club to reply.</p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4 pt-6 text-left scroll-mt-[var(--app-nav-clearance)]">
      <div className="flex flex-wrap items-center justify-between gap-2 text-left">
        <h2 className="text-left text-lg font-semibold text-puce-red">Discussions</h2>
        <div
          className="flex gap-1 overflow-x-auto"
          role="group"
          aria-label="Discussion filters"
        >
          {(
            [
              ["activity", "Latest Activity"],
              ["newest", "Newest"],
              ["pinned", "Pinned"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
                filter === id
                  ? "bg-puce-red text-white"
                  : "bg-surface text-text-muted hover:text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isMember ? (
        <ClubDiscussionComposer
          clubId={clubId}
          viewerId={viewerId}
          onPosted={() => void loadList()}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-8 text-center">
          <p className="text-sm text-text-muted">
            Join this club to start and reply to discussions.
          </p>
        </div>
      )}

      {!discussions ? (
        <LoadingState message="Loading discussions…" />
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
          <p className="font-medium text-puce-red">
            {filter === "pinned" ? "No pinned discussions" : "No discussions yet"}
          </p>
          <p className="mt-2 text-sm text-text-muted">
            {isMember
              ? "Be the first to start a discussion above."
              : "This club hasn't started any discussions yet."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((discussion) => (
            <li key={discussion.id}>
              <ClubDiscussionCard
                discussion={discussion}
                onOpen={() => {
                  setFromDeepLink(false);
                  setActiveId(discussion.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
