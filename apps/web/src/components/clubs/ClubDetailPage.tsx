"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookCover } from "@/components/books/BookCover";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { ClubDiscussionCard } from "@/components/clubs/ClubDiscussionCard";
import { ClubDiscussionComposer } from "@/components/clubs/ClubDiscussionComposer";
import { ClubMembersPanel } from "@/components/clubs/ClubMembersPanel";
import { BookPickerModal } from "@/components/clubs/BookPickerModal";
import { CircleAvatarUpload } from "@/components/ui/CircleAvatarUpload";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useClubDiscussionsRealtime } from "@/lib/hooks/useClubDiscussionsRealtime";
import {
  deleteClub,
  getClub,
  getDiscussion,
  joinClub,
  leaveClub,
  listDiscussions,
  setCurrentBook,
} from "@/lib/services/bookClubs";
import { removeClubAvatar, uploadClubAvatar } from "@/lib/services/entityAvatar";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { clubDetailPath, clubsPath } from "@/lib/routes/clubs";
import type { BookClubPostWithAuthor, BookClubWithDetails } from "@/types";
import type { BookSearchResult } from "@/lib/services/feedSearch";

function ClubDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const clubId = searchParams.get("id")?.trim() ?? "";
  const user = useAuthUser();

  const [club, setClub] = useState<BookClubWithDetails | null | undefined>(undefined);
  const [discussions, setDiscussions] = useState<BookClubPostWithAuthor[] | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);

  const loadClub = useCallback(async () => {
    if (!clubId || !user) return;
    const detail = await getClub(clubId, user.id);
    setClub(detail);
    if (detail) {
      const posts = await listDiscussions(clubId).catch(() => []);
      setDiscussions(posts);
    }
  }, [clubId, user]);

  useEffect(() => {
    if (!clubId) {
      setClub(null);
      return;
    }
    if (!user) return;
    void loadClub().catch((err) => {
      console.error("[club] load failed:", err);
      setClub(null);
    });
  }, [clubId, user, loadClub]);

  // Live-prepend new discussions arriving over Realtime (deduped so the
  // poster's own optimistic reload doesn't create duplicates).
  const handleRealtimeInsert = useCallback(
    async (postId: string) => {
      if (!clubId) return;
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

  useClubDiscussionsRealtime(club ? clubId : undefined, (postId) => {
    void handleRealtimeInsert(postId).catch((err) => {
      console.warn("[club] realtime hydrate failed:", err);
    });
  });

  async function handleJoin() {
    setActionPending(true);
    const result = await joinClub(clubId);
    setActionPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("You joined the club!");
    void loadClub();
  }

  async function handleLeave() {
    setActionPending(true);
    const result = await leaveClub(clubId);
    setActionPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("You left the club.");
    void loadClub();
  }

  async function handleSetBook(book: BookSearchResult | null) {
    const result = await setCurrentBook(clubId, book?.id ?? null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(book ? "Current book updated." : "Current book cleared.");
    void loadClub();
  }

  async function handleDeleteClub() {
    if (!window.confirm("Delete this club? This can't be undone.")) return;
    setActionPending(true);
    const result = await deleteClub(clubId);
    setActionPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Club deleted.");
    router.push(clubsPath());
  }

  if (!clubId) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">No club selected.</p>
        <ButtonLink href={clubsPath()} variant="primary">
          Browse book clubs
        </ButtonLink>
      </div>
    );
  }

  if (user === undefined || club === undefined) {
    return <LoadingState message="Loading club…" />;
  }

  if (!user) return null;

  if (!club) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-2xl font-bold text-puce-red">Club not found</h1>
        <p className="text-text-muted">
          This club may be private or no longer exists.
        </p>
        <ButtonLink href={clubsPath()} variant="primary">
          Browse book clubs
        </ButtonLink>
      </div>
    );
  }

  const isOwner = club.viewer_role === "owner";
  const isMember = club.viewer_is_member;
  const memberLabel = `${club.member_count} member${club.member_count === 1 ? "" : "s"}`;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <p>
        <Link href={clubsPath()} className="text-sm font-medium text-primary hover:underline">
          ← Back to book clubs
        </Link>
      </p>

      <header className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          {club.image_url ? (
            <Image
              src={club.image_url}
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-royal-orange/20 text-xl font-bold text-puce-red">
              {club.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-puce-red sm:text-3xl">{club.name}</h1>
                  {club.visibility === "private" ? (
                    <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                      Private
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-text-muted">{memberLabel}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CopyLinkButton path={clubDetailPath(club.id)} label="Share" variant="outline" size="sm" />
                {isOwner ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={actionPending}
                    onClick={() => void handleDeleteClub()}
                  >
                    Delete
                  </Button>
                ) : isMember ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={actionPending}
                    onClick={() => void handleLeave()}
                  >
                    Leave
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    loading={actionPending}
                    onClick={() => void handleJoin()}
                  >
                    Join club
                  </Button>
                )}
              </div>
            </div>

            {club.description ? (
              <p className="mt-4 leading-relaxed text-text">{club.description}</p>
            ) : null}
          </div>
        </div>

        {isOwner ? (
          <div className="mt-6 border-t border-border pt-6">
            <CircleAvatarUpload
              imageUrl={club.image_url}
              fallbackLabel={club.name}
              disabled={actionPending}
              size="md"
              onFileSelect={async (file) => {
                const result = await uploadClubAvatar(clubId, file);
                if (result.error) throw new Error(result.error);
                toast.success("Club photo updated.");
                void loadClub();
              }}
              onRemove={async () => {
                const result = await removeClubAvatar(clubId);
                if (result.error) throw new Error(result.error);
                toast.success("Club photo removed.");
                void loadClub();
              }}
            />
          </div>
        ) : null}
      </header>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-puce-red">Current book</h2>
          {isOwner ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setBookPickerOpen(true)}>
              {club.current_book ? "Change" : "Set book"}
            </Button>
          ) : null}
        </div>

        {club.current_book ? (
          <div className="flex items-center gap-4">
            <Link
              href={bookDetailsPath(club.current_book.id)}
              className="h-28 w-20 shrink-0 overflow-hidden rounded-md shadow-sm"
            >
              <BookCover
                title={club.current_book.title}
                author={club.current_book.author}
                coverUrl={club.current_book.cover_url}
                className="h-full w-full"
                bookmarked
              />
            </Link>
            <div className="min-w-0">
              <Link
                href={bookDetailsPath(club.current_book.id)}
                className="block font-semibold text-puce-red hover:underline"
              >
                {club.current_book.title}
              </Link>
              {club.current_book.author ? (
                <Link
                  href={authorPagePath(club.current_book.author)}
                  className="text-sm text-text-muted hover:text-primary hover:underline"
                >
                  {club.current_book.author}
                </Link>
              ) : null}
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => void handleSetBook(null)}
                  className="mt-2 block text-xs text-text-muted hover:text-rust"
                >
                  Clear current book
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            {isOwner
              ? "No current book yet. Set one to give the club something to read together."
              : "This club hasn't picked a current book yet."}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-puce-red">Members</h2>
        <ClubMembersPanel
          clubId={club.id}
          members={club.members}
          viewerId={user.id}
          viewerIsOwner={isOwner}
          onChanged={() => void loadClub()}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-puce-red">Discussions</h2>

        {isMember ? (
          <ClubDiscussionComposer
            clubId={club.id}
            viewerId={user.id}
            onPosted={() => void loadClub()}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-background px-6 py-8 text-center">
            <p className="text-sm text-text-muted">Join this club to start and reply to discussions.</p>
          </div>
        )}

        {!discussions ? (
          <LoadingState message="Loading discussions…" />
        ) : discussions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
            <p className="font-medium text-puce-red">No discussions yet</p>
            <p className="mt-2 text-sm text-text-muted">
              {isMember
                ? "Be the first to start a discussion above."
                : "This club hasn't started any discussions yet."}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {discussions.map((post) => (
              <li key={post.id}>
                <ClubDiscussionCard
                  post={post}
                  viewerId={user.id}
                  onDeleted={() => void loadClub()}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <BookPickerModal
        open={bookPickerOpen}
        onClose={() => setBookPickerOpen(false)}
        viewerId={user.id}
        title="Set the current book"
        onSelect={(book) => void handleSetBook(book)}
      />
    </div>
  );
}

export default function ClubDetailPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading club…" />}>
      <ClubDetailContent />
    </Suspense>
  );
}
