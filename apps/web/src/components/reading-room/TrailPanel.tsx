"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SessionMoodChip } from "@/components/books/SessionMoodPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  filterBookGroupsByQuery,
  formatSessionDate,
  groupSessionsByBook,
  groupSessionsByReadNumber,
  sessionSummary,
  type BookSessionGroup,
} from "@/lib/reading-room/trail";
import { bookDetailsPath } from "@/lib/routes/book";
import type { UserReadingSession } from "@/lib/services/readingSessions";
import { cn } from "@/lib/utils/cn";

type TrailView = "books" | "sessions" | "detail";

type Props = {
  sessions: UserReadingSession[] | null;
};

export function TrailPanel({ sessions }: Props) {
  const [view, setView] = useState<TrailView>("books");
  const [selectedBookKey, setSelectedBookKey] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const bookGroups = useMemo(
    () => (sessions ? groupSessionsByBook(sessions) : []),
    [sessions]
  );
  const filteredBookGroups = useMemo(
    () => filterBookGroupsByQuery(bookGroups, searchQuery),
    [bookGroups, searchQuery]
  );
  const activeBook = bookGroups.find((group) => group.key === selectedBookKey) ?? null;
  const readGroups = useMemo(
    () => (activeBook ? groupSessionsByReadNumber(activeBook.sessions) : []),
    [activeBook]
  );
  const activeSession =
    activeBook?.sessions.find((session) => session.id === selectedSessionId) ?? null;

  function openBook(group: BookSessionGroup) {
    setSelectedBookKey(group.key);
    setSelectedSessionId(null);
    setView("sessions");
  }

  function openSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    setView("detail");
  }

  function backToBooks() {
    setView("books");
    setSelectedBookKey(null);
    setSelectedSessionId(null);
  }

  function backToSessions() {
    setView("sessions");
    setSelectedSessionId(null);
  }

  if (sessions === null) {
    return (
      <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-puce-red">Trail</h2>
        <LoadingState message="Loading trail…" />
      </section>
    );
  }

  if (!sessions.length) {
    return (
      <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-puce-red">Trail</h2>
        <p className="mt-4 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-text-muted">
          Save reading progress to build your trail.
        </p>
      </section>
    );
  }

  if (view === "detail" && activeBook && activeSession) {
    return (
      <section className="rounded-2xl border border-border bg-surface/90 p-5 text-left shadow-sm md:p-6">
        <Button type="button" variant="ghost" size="sm" onClick={backToSessions}>
          ← Back to sessions
        </Button>
        <div className="mt-4 rounded-lg border border-border bg-background/50 px-4 py-4">
          <p className="text-base font-semibold text-text">{activeBook.bookTitle}</p>
          {activeSession.read_number > 1 ? (
            <p className="mt-1 text-xs font-medium text-puce-red">
              Read #{activeSession.read_number}
            </p>
          ) : null}
          <time className="mt-2 block text-xs text-text-muted" dateTime={activeSession.created_at}>
            {formatSessionDate(activeSession.created_at)}
          </time>
          <p className="mt-2 text-sm text-text-muted">{sessionSummary(activeSession)}</p>
          <p className="mt-1 text-sm text-text-muted">
            {Math.round(activeSession.percent_complete)}% complete
          </p>
          {activeSession.note ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-text">
              {activeSession.note}
            </p>
          ) : (
            <p className="mt-4 text-sm italic text-text-muted">No note for this session.</p>
          )}
          {activeSession.mood ? (
            <div className="mt-3">
              <SessionMoodChip mood={activeSession.mood} />
            </div>
          ) : null}
          {activeBook.bookId ? (
            <div className="mt-4">
              <Link
                href={bookDetailsPath(activeBook.bookId)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Open book
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  if (view === "sessions" && activeBook) {
    return (
      <section className="rounded-2xl border border-border bg-surface/90 p-5 text-left shadow-sm md:p-6">
        <Button type="button" variant="ghost" size="sm" onClick={backToBooks}>
          ← Back to books
        </Button>
        <div className="mt-4">
          <h3 className="text-base font-semibold text-text">{activeBook.bookTitle}</h3>
          {activeBook.bookId ? (
            <Link
              href={bookDetailsPath(activeBook.bookId)}
              className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
            >
              Open book
            </Link>
          ) : null}
        </div>
        <div className="space-y-6">
          {readGroups.map((readGroup) => (
            <div key={readGroup.readNumber}>
              {readGroups.length > 1 ? (
                <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Read #{readGroup.readNumber}
                </h4>
              ) : null}
              <ol className={cn("space-y-2", readGroups.length > 1 && "mt-2")}>
                {readGroup.sessions.map((session) => (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => openSession(session.id)}
                      className="w-full rounded-lg border border-border bg-background/50 px-4 py-3 text-left transition hover:border-primary"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <time
                          className="text-xs text-text-muted"
                          dateTime={session.created_at}
                        >
                          {formatSessionDate(session.created_at)}
                        </time>
                        <span className="text-xs text-text-muted">{sessionSummary(session)}</span>
                      </div>
                      {session.note ? (
                        <p className="mt-1 line-clamp-2 text-sm text-text">{session.note}</p>
                      ) : (
                        <p className="mt-1 text-sm italic text-text-muted">No note</p>
                      )}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface/90 p-5 text-left shadow-sm md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-puce-red">Trail</h2>
        <p className="text-sm text-text-muted">Pick a book to view its session notes.</p>
      </div>
      <Input
        type="search"
        variant="search"
        label="Search books"
        hideLabel
        placeholder="Search by book title…"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        autoComplete="off"
        className="mt-6"
      />
      {filteredBookGroups.length === 0 ? (
        <p className="mt-4 text-center text-sm text-text-muted">No books match your search.</p>
      ) : (
        <ul className="mt-4 space-y-2" role="list">
          {filteredBookGroups.map((group) => (
            <li key={group.key}>
              <button
                type="button"
                onClick={() => openBook(group)}
                className="w-full rounded-lg border border-border bg-background/50 px-4 py-3 text-left text-sm font-medium text-text transition hover:border-primary"
              >
                {group.bookTitle}
                <span className="ml-2 text-xs font-normal text-text-muted">
                  ({group.sessions.length} session
                  {group.sessions.length === 1 ? "" : "s"})
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
