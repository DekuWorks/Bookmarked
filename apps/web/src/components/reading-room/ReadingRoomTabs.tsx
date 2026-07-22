"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { ReadingActivityPanel } from "@/components/analytics/ReadingActivityPanel";
import { BookCover } from "@/components/books/BookCover";
import { NotesSearchForm } from "@/components/notes/NotesSearchForm";
import { NotesSearchResultCard } from "@/components/notes/NotesSearchResultCard";
import { BookMiniGrid } from "@/components/reading-room/BookMiniGrid";
import { CurrentlyReadingRow } from "@/components/reading-room/CurrentlyReadingRow";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { bookDetailsPath } from "@/lib/routes/book";
import { searchNotesWithBooks } from "@/lib/services/readingNotes";
import type { ReadingRoomData } from "@/lib/services/readingRoom";
import { listUserReviews, type UserReviewWithBook } from "@/lib/services/readingRoom";
import {
  listUserReadingSessions,
  type UserReadingSession,
} from "@/lib/services/readingSessions";
import { cn } from "@/lib/utils/cn";
import { formatReviewDate } from "@/lib/utils/locale";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";

export type ReadingRoomTab =
  | "overview"
  | "progress"
  | "journal"
  | "notes"
  | "reviews"
  | "history";

const TAB_OPTIONS: { id: ReadingRoomTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "progress", label: "Progress" },
  { id: "journal", label: "Journal" },
  { id: "notes", label: "Notes" },
  { id: "reviews", label: "Reviews" },
  { id: "history", label: "History" },
];

function parseTab(value: string | null): ReadingRoomTab {
  if (value && TAB_OPTIONS.some((tab) => tab.id === value)) {
    return value as ReadingRoomTab;
  }
  return "overview";
}

function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  userId: string;
  data: ReadingRoomData;
  onRefresh: () => void;
};

function ReadingRoomTabsContent({ userId, data, onRefresh }: Props) {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const locale = usePreferredLocale();
  const [sessions, setSessions] = useState<UserReadingSession[] | null>(null);
  const [reviews, setReviews] = useState<UserReviewWithBook[] | null>(null);
  const [recentNotes, setRecentNotes] = useState<
    Awaited<ReturnType<typeof searchNotesWithBooks>>["notes"] | null
  >(null);

  const loadSessions = useCallback(async () => {
    const rows = await listUserReadingSessions(userId);
    setSessions(rows);
  }, [userId]);

  const loadReviews = useCallback(async () => {
    const rows = await listUserReviews(userId);
    setReviews(rows);
  }, [userId]);

  const loadNotes = useCallback(async () => {
    const { notes } = await searchNotesWithBooks({ userId, limit: 12 });
    setRecentNotes(notes);
  }, [userId]);

  useEffect(() => {
    if (tab === "journal" || tab === "history") {
      void loadSessions();
    }
  }, [tab, loadSessions]);

  useEffect(() => {
    if (tab === "reviews") {
      void loadReviews();
    }
  }, [tab, loadReviews]);

  useEffect(() => {
    if (tab === "notes") {
      void loadNotes();
    }
  }, [tab, loadNotes]);

  function tabHref(nextTab: ReadingRoomTab): string {
    if (nextTab === "overview") return "/reading-room/";
    return `/reading-room/?tab=${nextTab}`;
  }

  return (
    <div className="space-y-6">
      <div
        className="pill-tabs overflow-x-auto"
        role="tablist"
        aria-label="Reading room sections"
      >
        {TAB_OPTIONS.map((option) => (
          <Link
            key={option.id}
            href={tabHref(option.id)}
            role="tab"
            aria-selected={tab === option.id}
            data-active={tab === option.id ? "true" : "false"}
            className="pill-tab shrink-0"
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div role="tabpanel" aria-label={TAB_OPTIONS.find((t) => t.id === tab)?.label}>
        {tab === "overview" ? (
          <div className="space-y-8">
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/library/" variant="secondary" size="sm">
                Open library
              </ButtonLink>
              <ButtonLink href="/dashboard/" variant="outline" size="sm">
                Today&apos;s dashboard
              </ButtonLink>
            </div>

            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-puce-red">Currently reading</h2>
              <div className="mt-4">
                <CurrentlyReadingRow
                  items={data.currentlyReading}
                  onItemsChange={onRefresh}
                />
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold text-puce-red">Recently finished</h2>
                <div className="mt-4">
                  <BookMiniGrid
                    items={data.recentlyFinished}
                    emptyMessage="Finished books will appear here."
                    emptyAction={{ label: "Browse your library", href: "/library/read/" }}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
                <h2 className="text-lg font-semibold text-puce-red">Favorites</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Mark favorites on any book page
                </p>
                <div className="mt-4">
                  <BookMiniGrid
                    items={data.favorites}
                    emptyMessage="Star books from their detail page to collect favorites here."
                    emptyAction={{ label: "Find a book", href: "/search/" }}
                  />
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {tab === "progress" ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-puce-red">Reading goal</h2>
              <div className="mt-4">
                <ReadingGoalPanel
                  status={data.readingGoal}
                  onSaved={() => void onRefresh()}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-puce-red">Reading statistics</h2>
              <div className="mt-4">
                <AnalyticsGrid
                  analytics={data.analytics}
                  readingGoal={data.readingGoal}
                  compact
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-puce-red">Activity</h2>
              <div className="mt-4">
                <ReadingActivityPanel userId={userId} />
              </div>
            </section>
          </div>
        ) : null}

        {tab === "journal" ? (
          <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6 text-left">
            <h2 className="text-center text-lg font-semibold text-puce-red">Reading journal</h2>
            <p className="mt-1 text-center text-sm text-text-muted">
              Session notes across all your books — newest first.
            </p>
            {sessions === null ? (
              <LoadingState message="Loading journal…" />
            ) : sessions.length === 0 ? (
              <p className="mt-6 text-center text-sm text-text-muted">
                Save reading progress to build your journal.
              </p>
            ) : (
              <ol className="mt-6 space-y-4">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="rounded-lg border border-border bg-background/50 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-text">
                        {session.bookTitle ? (
                          session.bookId ? (
                            <Link
                              href={bookDetailsPath(session.bookId)}
                              className="text-primary hover:underline"
                            >
                              {session.bookTitle}
                            </Link>
                          ) : (
                            session.bookTitle
                          )
                        ) : (
                          "Reading session"
                        )}
                      </p>
                      <time className="text-xs text-text-muted" dateTime={session.created_at}>
                        {formatSessionDate(session.created_at)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">
                      Pages {session.page_start}–{session.page_end} ·{" "}
                      {Math.round(session.percent_complete)}% complete
                    </p>
                    {session.note ? (
                      <p className="mt-2 text-sm leading-relaxed text-text">{session.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}

        {tab === "notes" ? (
          <div className="space-y-6 text-left">
            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h2 className="text-center text-lg font-semibold text-puce-red">
                Search reading notes
              </h2>
              <div className="mt-4">
                <NotesSearchForm />
              </div>
              <p className="mt-4 text-center text-sm text-text-muted">
                Or open the full{" "}
                <Link href="/notes/" className="font-medium text-primary hover:underline">
                  notes search page
                </Link>
                .
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
              <h3 className="text-center text-base font-semibold text-puce-red">Recent notes</h3>
              {recentNotes === null ? (
                <LoadingState message="Loading notes…" />
              ) : recentNotes.length === 0 ? (
                <p className="mt-4 text-center text-sm text-text-muted">
                  Add notes from any book in your library.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {recentNotes.map((note) => (
                    <li key={note.id}>
                      <NotesSearchResultCard note={note} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}

        {tab === "reviews" ? (
          <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6 text-left">
            <h2 className="text-center text-lg font-semibold text-puce-red">Your reviews</h2>
            {reviews === null ? (
              <LoadingState message="Loading reviews…" />
            ) : reviews.length === 0 ? (
              <p className="mt-6 text-center text-sm text-text-muted">
                Finish a book and share your thoughts from its detail page.
              </p>
            ) : (
              <ul className="mt-6 space-y-4">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-lg border border-border bg-background/50 px-4 py-3"
                  >
                    <div className="flex gap-3">
                      {review.books?.cover_url ? (
                        <BookCover
                          coverUrl={review.books.cover_url}
                          title={review.books.title}
                          author={review.books.author}
                          className="h-16 w-11 shrink-0 rounded shadow-sm"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        {review.books ? (
                          <Link
                            href={bookDetailsPath(review.books.id)}
                            className="font-medium text-primary hover:underline"
                          >
                            {review.books.title}
                          </Link>
                        ) : (
                          <p className="font-medium text-text">Review</p>
                        )}
                        {review.books?.author ? (
                          <p className="text-xs text-text-muted">{review.books.author}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StarDisplay rating={review.rating ?? 0} />
                          <time className="text-xs text-text-muted" dateTime={review.created_at}>
                            {formatReviewDate(review.created_at, locale)}
                          </time>
                        </div>
                        {review.review_body ? (
                          <p className="mt-2 line-clamp-3 text-sm text-text-muted">
                            {review.review_body}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {tab === "history" ? (
          <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
            <h2 className="text-lg font-semibold text-puce-red">Reading history</h2>
            <p className="mt-1 text-sm text-text-muted">
              Finished books and recent reading sessions.
            </p>
            <div className="mt-6">
              <BookMiniGrid
                items={data.shelves.find((s) => s.status === "read")?.items ?? []}
                emptyMessage="Books you finish will appear here."
                emptyAction={{ label: "Browse library", href: "/library/read/" }}
              />
            </div>
            {sessions === null ? (
              <LoadingState message="Loading sessions…" />
            ) : sessions.length > 0 ? (
              <div className="mt-8 text-left">
                <h3 className="text-center text-base font-semibold text-puce-red">
                  Recent sessions
                </h3>
                <ol className="mt-4 max-h-80 space-y-2 overflow-y-auto">
                  {sessions.slice(0, 20).map((session) => (
                    <li
                      key={session.id}
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-2 rounded-lg",
                        "border border-border/60 bg-background/40 px-3 py-2 text-sm"
                      )}
                    >
                      <span className="font-medium text-text">
                        {session.bookTitle ?? "Session"}
                      </span>
                      <span className="text-text-muted">
                        {formatSessionDate(session.created_at)} · {session.pages_read} pages
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function ReadingRoomTabs(props: Props) {
  return (
    <Suspense fallback={<LoadingState message="Loading reading room…" />}>
      <ReadingRoomTabsContent {...props} />
    </Suspense>
  );
}
