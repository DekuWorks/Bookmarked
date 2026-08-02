"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { ClubDiscussionCard } from "@/components/clubs/ClubDiscussionCard";
import { ClubDiscussionComposer } from "@/components/clubs/ClubDiscussionComposer";
import { ProfanityBlur } from "@/components/social/ProfanityBlur";
import { useClubDiscussionsRealtime } from "@/lib/hooks/useClubDiscussionsRealtime";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import {
  createReply,
  deleteDiscussion,
  deleteReply,
  getDiscussion,
  listDiscussions,
  listReplies,
  setDiscussionLocked,
  setDiscussionPinned,
} from "@/lib/services/bookClubs";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { readerProfilePath } from "@/lib/routes/reader";
import { formatFeedTimestamp } from "@/lib/utils/locale";
import {
  canModerateDiscussions,
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
  const locale = usePreferredLocale();
  const canPin = canPinDiscussions(viewerRole);
  const canModerate = canModerateDiscussions(viewerRole);

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
      setReplies(replyRows);
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
      setActiveId(null);
    });
  }, [activeId, loadThread, toast]);

  useEffect(() => {
    if (initialDiscussionId) setActiveId(initialDiscussionId);
  }, [initialDiscussionId]);

  const handleRealtimeInsert = useCallback(
    async (postId: string) => {
      const post = await getDiscussion(clubId, postId);
      if (!post) return;
      setDiscussions((current) => {
        if (!current) return current;
        if (current.some((existing) => existing.id === post.id)) return current;
        return [post, ...current];
      });
    },
    [clubId]
  );

  useClubDiscussionsRealtime(clubId, (postId) => {
    void handleRealtimeInsert(postId).catch((err) => {
      console.warn("[club] realtime hydrate failed:", err);
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
    await loadThread(activeId);
    await loadList();
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
    setActiveId(null);
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
    if (activeId) await loadThread(activeId);
    await loadList();
  }

  if (activeId && activeDiscussion) {
    const isOwn = activeDiscussion.user_id === viewerId;
    const profileHref = activeDiscussion.author.username
      ? readerProfilePath(activeDiscussion.author.username)
      : null;

    return (
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setActiveId(null)}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to discussions
        </button>

        <article className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-puce-red">{activeDiscussion.title}</h2>
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
              <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
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
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
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
              {isOwn || canModerate ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={pending}
                  onClick={() => void handleDeleteDiscussion(activeDiscussion.id)}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>

          <ProfanityBlur text={activeDiscussion.body} className="mt-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
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

        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-muted">
            {activeDiscussion.reply_count}{" "}
            {activeDiscussion.reply_count === 1 ? "reply" : "replies"}
          </h3>
          {replies === null ? (
            <LoadingState message="Loading replies…" />
          ) : replies.length === 0 ? (
            <p className="text-sm text-text-muted">No replies yet.</p>
          ) : (
            <ul className="space-y-3">
              {replies.map((reply) => {
                const replyHref = reply.author.username
                  ? readerProfilePath(reply.author.username)
                  : null;
                const canDeleteReply = reply.user_id === viewerId || canModerate;
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
                      {canDeleteReply ? (
                        <button
                          type="button"
                          onClick={() => void handleDeleteReply(reply.id)}
                          className="text-xs text-text-muted hover:text-rust"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                    <ProfanityBlur text={reply.body} className="mt-2">
                      <p className="whitespace-pre-wrap text-sm text-text">{reply.body}</p>
                    </ProfanityBlur>
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
              Post reply
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-puce-red">Discussions</h2>
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
                onOpen={() => setActiveId(discussion.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
