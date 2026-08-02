"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { BookPickerModal } from "@/components/clubs/BookPickerModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  listClubBooks,
  listCurrentReads,
  listDiscussions,
  setCurrentRead,
} from "@/lib/services/bookClubs";
import {
  formatEventDateTime,
  getEventRsvps,
  listClubEvents,
  setEventRsvp,
} from "@/lib/services/clubEvents";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { readerProfilePath } from "@/lib/routes/reader";
import {
  canCreateAnnouncements,
  canManageBookshelf,
  canManageMembers,
  roleLabel,
} from "@bookmarked/utils/clubPermissions";
import type {
  BookClubAnnouncementWithAuthor,
  BookClubCurrentRead,
  BookClubDiscussionWithAuthor,
  BookClubEvent,
  BookClubMemberRole,
  BookClubRsvpStatus,
  BookClubShelfBook,
  BookClubWithDetails,
} from "@/types";
import type { BookSearchResult } from "@/lib/services/feedSearch";
import { cn } from "@/lib/utils/cn";

type Props = {
  club: BookClubWithDetails;
  viewerId: string;
  onInvite?: () => void;
  onOpenDiscussions?: () => void;
  onOpenSchedule?: () => void;
  onOpenBookshelf?: () => void;
  onChanged?: () => void;
};

const RSVP_OPTIONS: Array<{ value: BookClubRsvpStatus; label: string }> = [
  { value: "going", label: "Going" },
  { value: "maybe", label: "Maybe" },
  { value: "not_going", label: "Not Going" },
];

export function ClubOverviewPanel({
  club,
  viewerId,
  onInvite,
  onOpenDiscussions,
  onOpenSchedule,
  onOpenBookshelf,
  onChanged,
}: Props) {
  const toast = useToast();
  const role = club.viewer_role;
  const canManageRead = canManageBookshelf(role);
  const canAnnounce = canCreateAnnouncements(role);
  const canInvite = canManageMembers(role);

  const [currentReads, setCurrentReads] = useState<BookClubCurrentRead[] | null>(null);
  const [discussions, setDiscussions] = useState<BookClubDiscussionWithAuthor[] | null>(null);
  const [announcements, setAnnouncements] = useState<BookClubAnnouncementWithAuthor[] | null>(
    null
  );
  const [upcoming, setUpcoming] = useState<BookClubEvent | null | undefined>(undefined);
  const [viewerRsvp, setViewerRsvp] = useState<BookClubRsvpStatus | null>(null);
  const [shelfPreview, setShelfPreview] = useState<BookClubShelfBook[]>([]);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const [reads, posts, notes, events, books] = await Promise.all([
      listCurrentReads(club.id),
      listDiscussions(club.id),
      listAnnouncements(club.id),
      listClubEvents(club.id, { limit: 1 }),
      listClubBooks(club.id),
    ]);
    setCurrentReads(reads);
    setDiscussions(posts.slice(0, 3));
    setAnnouncements(notes);
    const nextEvent = events[0] ?? null;
    setUpcoming(nextEvent);
    setShelfPreview(books.filter((b) => b.book).slice(0, 6));

    if (nextEvent && club.viewer_is_member) {
      const rsvps = await getEventRsvps(nextEvent.id).catch(() => []);
      setViewerRsvp(rsvps.find((row) => row.user_id === viewerId)?.rsvp_status ?? null);
    } else {
      setViewerRsvp(null);
    }
  }, [club.id, club.viewer_is_member, viewerId]);

  useEffect(() => {
    void load().catch((err) => {
      console.error("[club-overview] load failed:", err);
      setCurrentReads([]);
      setDiscussions([]);
      setAnnouncements([]);
      setUpcoming(null);
    });
  }, [load]);

  const activeRead =
    currentReads?.find((read) => read.is_current) ??
    (club.current_book
      ? ({
          id: "legacy",
          club_id: club.id,
          book_id: club.current_book.id,
          started_at: null,
          target_finish_at: null,
          chapters_assigned: null,
          pages_assigned: null,
          is_current: true,
          archived_at: null,
          created_by: club.owner_id,
          created_at: club.created_at,
          updated_at: club.updated_at,
          book: club.current_book,
        } satisfies BookClubCurrentRead)
      : null);

  async function handleSetBook(book: BookSearchResult) {
    setPending(true);
    const result = await setCurrentRead(club.id, { bookId: book.id });
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Current read updated.");
    setBookPickerOpen(false);
    await load();
    onChanged?.();
  }

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const result = await createAnnouncement(club.id, {
      title: announceTitle,
      body: announceBody,
    });
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Announcement posted.");
    setAnnounceTitle("");
    setAnnounceBody("");
    setShowAnnounceForm(false);
    await load();
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!window.confirm("Delete this announcement?")) return;
    const result = await deleteAnnouncement(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Announcement deleted.");
    await load();
  }

  async function handleRsvp(status: BookClubRsvpStatus) {
    if (!upcoming) return;
    setPending(true);
    try {
      await setEventRsvp(upcoming.id, status);
      setViewerRsvp(status);
      toast.success("RSVP saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not RSVP.");
    } finally {
      setPending(false);
    }
  }

  const memberPreview = club.members.slice(0, 8);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-puce-red">Current Read</h2>
          {canManageRead ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setBookPickerOpen(true)}>
              {activeRead?.book ? "Change" : "Set book"}
            </Button>
          ) : null}
        </div>

        {currentReads === null ? (
          <LoadingState message="Loading current read…" />
        ) : activeRead?.book ? (
          <div className="flex items-center gap-4">
            <Link
              href={bookDetailsPath(activeRead.book.id)}
              className="h-28 w-20 shrink-0 overflow-visible rounded-md shadow-sm"
            >
              <BookCover
                title={activeRead.book.title}
                author={activeRead.book.author}
                coverUrl={activeRead.book.cover_url}
                className="h-full w-full"
                bookmarked
              />
            </Link>
            <div className="min-w-0">
              <Link
                href={bookDetailsPath(activeRead.book.id)}
                className="block font-semibold text-puce-red hover:underline"
              >
                {activeRead.book.title}
              </Link>
              {activeRead.book.author ? (
                <Link
                  href={authorPagePath(activeRead.book.author)}
                  className="text-sm text-text-muted hover:text-primary hover:underline"
                >
                  {activeRead.book.author}
                </Link>
              ) : null}
              {activeRead.target_finish_at ? (
                <p className="mt-2 text-sm text-text-muted">
                  Deadline:{" "}
                  {new Date(activeRead.target_finish_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              ) : null}
              {activeRead.chapters_assigned || activeRead.pages_assigned ? (
                <p className="mt-1 text-xs text-text-muted">
                  {[activeRead.chapters_assigned, activeRead.pages_assigned]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            {canManageRead
              ? "No current book yet. Set one to give the club something to read together."
              : "This club hasn't picked a current book yet."}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-puce-red">Latest discussions</h2>
          {onOpenDiscussions ? (
            <Button type="button" variant="ghost" size="sm" onClick={onOpenDiscussions}>
              View all
            </Button>
          ) : null}
        </div>
        {discussions === null ? (
          <LoadingState message="Loading discussions…" />
        ) : discussions.length === 0 ? (
          <p className="text-sm text-text-muted">No discussions yet.</p>
        ) : (
          <ul className="space-y-2">
            {discussions.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={onOpenDiscussions}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left hover:border-primary/40"
                >
                  <p className="truncate font-medium text-puce-red">{post.title}</p>
                  <p className="truncate text-xs text-text-muted">
                    {post.reply_count} replies
                    {post.is_pinned ? " · Pinned" : ""}
                    {post.contains_spoilers ? " · Spoilers" : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-puce-red">Members</h2>
          {canInvite && onInvite ? (
            <Button type="button" variant="ghost" size="sm" onClick={onInvite}>
              Invite
            </Button>
          ) : null}
        </div>
        <ul className="flex flex-wrap gap-3">
          {memberPreview.map((member) => {
            const href = member.profile.username
              ? readerProfilePath(member.profile.username)
              : null;
            const label =
              member.profile.display_name?.trim() ||
              member.profile.username?.trim() ||
              "Reader";
            const content = (
              <>
                <ProfileAvatar profile={member.profile} size="sm" />
                <span className="mt-1 block max-w-[4.5rem] truncate text-center text-[11px] text-text-muted">
                  {label}
                </span>
              </>
            );
            return (
              <li key={member.id} className="w-[4.5rem]">
                {href ? (
                  <Link href={href} className="flex flex-col items-center hover:opacity-90">
                    {content}
                  </Link>
                ) : (
                  <div className="flex flex-col items-center">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-text-muted">
          {club.member_count} members
          {role ? ` · You’re ${roleLabel(role)}` : ""}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-puce-red">Announcements</h2>
          {canAnnounce ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAnnounceForm((open) => !open)}
            >
              {showAnnounceForm ? "Cancel" : "Create"}
            </Button>
          ) : null}
        </div>

        {showAnnounceForm ? (
          <form onSubmit={(e) => void handleCreateAnnouncement(e)} className="mb-4 space-y-3">
            <Input
              label="Title"
              value={announceTitle}
              onChange={(e) => setAnnounceTitle(e.target.value)}
              required
            />
            <Textarea
              label="Body"
              value={announceBody}
              onChange={(e) => setAnnounceBody(e.target.value)}
              rows={3}
              required
            />
            <Button type="submit" variant="primary" size="sm" loading={pending}>
              Post announcement
            </Button>
          </form>
        ) : null}

        {announcements === null ? (
          <LoadingState message="Loading announcements…" />
        ) : announcements.length === 0 ? (
          <p className="text-sm text-text-muted">No announcements yet.</p>
        ) : (
          <ul className="space-y-3">
            {announcements.slice(0, 5).map((note) => (
              <li key={note.id} className="rounded-lg border border-border bg-background px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-puce-red">{note.title}</p>
                    <p className="mt-1 text-sm text-text">{note.body}</p>
                  </div>
                  {canAnnounce ? (
                    <button
                      type="button"
                      onClick={() => void handleDeleteAnnouncement(note.id)}
                      className="text-xs text-text-muted hover:text-rust"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-puce-red">Upcoming event</h2>
          {onOpenSchedule ? (
            <Button type="button" variant="ghost" size="sm" onClick={onOpenSchedule}>
              Schedule
            </Button>
          ) : null}
        </div>
        {upcoming === undefined ? (
          <LoadingState message="Loading event…" />
        ) : !upcoming ? (
          <p className="text-sm text-text-muted">No upcoming events.</p>
        ) : (
          <div>
            <p className="font-medium text-puce-red">{upcoming.title}</p>
            <p className="mt-1 text-sm text-text-muted">
              {formatEventDateTime(upcoming.starts_at)}
            </p>
            {upcoming.meeting_url ? (
              <a
                href={upcoming.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                Join meeting
              </a>
            ) : null}
            {club.viewer_is_member ? (
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="group"
                aria-label={`RSVP for ${upcoming.title}`}
              >
                {RSVP_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={pending}
                    onClick={() => void handleRsvp(option.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium",
                      viewerRsvp === option.value
                        ? "border-primary bg-primary/15 text-puce-red"
                        : "border-border text-text-muted hover:border-primary/40"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-puce-red">Bookshelf</h2>
          {onOpenBookshelf ? (
            <Button type="button" variant="ghost" size="sm" onClick={onOpenBookshelf}>
              View all
            </Button>
          ) : null}
        </div>
        {shelfPreview.length === 0 ? (
          <p className="text-sm text-text-muted">No books on the club shelf yet.</p>
        ) : (
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {shelfPreview.map((shelf) => {
              const book = shelf.book;
              if (!book) return null;
              return (
                <li key={shelf.id} className="w-16 shrink-0">
                  <Link href={bookDetailsPath(book.id)} className="block">
                    <BookCover
                      title={book.title}
                      author={book.author}
                      coverUrl={book.cover_url}
                      className="h-24 w-full"
                      bookmarked
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <BookPickerModal
        open={bookPickerOpen}
        onClose={() => setBookPickerOpen(false)}
        viewerId={viewerId}
        title="Set the current book"
        onSelect={(book) => void handleSetBook(book)}
      />
    </div>
  );
}
