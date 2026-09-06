"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MarkFinishedDialog } from "@/components/books/MarkFinishedDialog";
import { RateBookPrompt } from "@/components/books/RateBookPrompt";
import { CompletionCelebration } from "@/components/books/CompletionCelebration";
import { TransferReadingStatsModal } from "@/components/books/TransferReadingStatsModal";
import { cn } from "@/lib/utils/cn";
import {
  logListeningSession,
  updateReadingProgress,
  type BookActionState,
} from "@/lib/actions/book";
import { useActionState } from "react";
import { useActionToast } from "@/lib/hooks/useActionToast";
import { validatePageProgress } from "@bookmarked/utils/pageProgress";
import {
  calculateAudiobookProgress,
  formatAudiobookProgressLabel,
  formatListeningTime,
  formatListeningTimeSpoken,
  parseListeningTime,
  validateListeningProgress,
} from "@bookmarked/utils/listeningTime";

const initial: BookActionState = {};

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function percentFromPages(current: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.min(100, Math.round((current / total) * 1000) / 10);
}

type Props = {
  bookId: string;
  bookTitle: string;
  onShelf: boolean;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  hasReviewForCurrentRead?: boolean;
  onProgressChange?: () => void;
  onReviewNow?: () => void;
  format?: "book" | "ebook" | "audiobook";
  currentListeningSeconds?: number;
  totalListeningSeconds?: number;
};

export function ReadingProgressPanel({
  bookId,
  bookTitle,
  onShelf,
  currentPage,
  totalPages,
  progressPercent,
  startedAt,
  finishedAt,
  hasReviewForCurrentRead = false,
  onProgressChange,
  onReviewNow,
  format = "book",
  currentListeningSeconds = 0,
  totalListeningSeconds = 0,
}: Props) {
  const isAudiobook = format === "audiobook";
  const [page, setPage] = useState(String(currentPage || ""));
  const [total, setTotal] = useState(String(totalPages || ""));
  const [currentTime, setCurrentTime] = useState(
    currentListeningSeconds > 0 || totalListeningSeconds > 0
      ? formatListeningTime(currentListeningSeconds)
      : ""
  );
  const [totalTime, setTotalTime] = useState(
    totalListeningSeconds > 0 ? formatListeningTime(totalListeningSeconds) : ""
  );
  const [sessionStart, setSessionStart] = useState(
    currentListeningSeconds > 0 ? formatListeningTime(currentListeningSeconds) : ""
  );
  const [sessionEnd, setSessionEnd] = useState("");
  const [displayPercent, setDisplayPercent] = useState(progressPercent);
  const [editing, setEditing] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [ratePromptOpen, setRatePromptOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [challengeUpdates, setChallengeUpdates] = useState<
    import("@bookmarked/utils/challengeTypes").ChallengeEvaluationSummary | null
  >(null);
  const [progressAction, submitProgress, saving] = useActionState(
    updateReadingProgress,
    initial
  );
  const [sessionAction, submitSession, sessionSaving] = useActionState(
    logListeningSession,
    initial
  );
  const onProgressChangeRef = useRef(onProgressChange);

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  const lastSynced = useRef({
    currentPage,
    totalPages,
    progressPercent,
    currentListeningSeconds,
    totalListeningSeconds,
  });

  useEffect(() => {
    const prev = lastSynced.current;
    const propsChanged =
      prev.currentPage !== currentPage ||
      prev.totalPages !== totalPages ||
      prev.progressPercent !== progressPercent ||
      prev.currentListeningSeconds !== currentListeningSeconds ||
      prev.totalListeningSeconds !== totalListeningSeconds;
    lastSynced.current = {
      currentPage,
      totalPages,
      progressPercent,
      currentListeningSeconds,
      totalListeningSeconds,
    };

    if (!propsChanged || editing) return;
    setPage(String(currentPage || ""));
    setTotal(String(totalPages || ""));
    setCurrentTime(
      currentListeningSeconds > 0 || totalListeningSeconds > 0
        ? formatListeningTime(currentListeningSeconds)
        : ""
    );
    setTotalTime(totalListeningSeconds > 0 ? formatListeningTime(totalListeningSeconds) : "");
    setSessionStart(
      currentListeningSeconds > 0 ? formatListeningTime(currentListeningSeconds) : ""
    );
    setDisplayPercent(progressPercent);
  }, [
    currentPage,
    totalPages,
    progressPercent,
    currentListeningSeconds,
    totalListeningSeconds,
    editing,
  ]);

  useActionToast(progressAction, () => {
    onProgressChangeRef.current?.();
  });
  useActionToast(sessionAction, () => {
    onProgressChangeRef.current?.();
    setSessionEnd("");
  });

  function handleFinished(
    summary?: import("@bookmarked/utils/challengeTypes").ChallengeEvaluationSummary
  ) {
    onProgressChange?.();
    setChallengeUpdates(summary ?? null);
    setCelebrationOpen(true);
  }

  function handleReviewNow() {
    setRatePromptOpen(false);
    onReviewNow?.();
  }

  function normalizeTime(value: string): string {
    const parsed = parseListeningTime(value);
    return parsed.ok ? parsed.display : value;
  }

  function commitPreview() {
    setEditing(false);
    if (isAudiobook) {
      const nextCurrent = normalizeTime(currentTime);
      const nextTotal = normalizeTime(totalTime);
      setCurrentTime(nextCurrent);
      setTotalTime(nextTotal);
      const validated = validateListeningProgress({ current: nextCurrent, total: nextTotal });
      if (validated.ok) {
        setDisplayPercent(validated.percent);
        setClientError(null);
        return;
      }
      if (nextCurrent && nextTotal) setClientError(validated.error);
      return;
    }
    const validated = validatePageProgress({ currentPage: page, totalPages: total });
    if (validated.ok) {
      setDisplayPercent(validated.percent);
      setClientError(null);
      return;
    }
    setClientError(validated.error);
  }

  if (!onShelf) {
    return (
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-puce-red">Reading room</h2>
        <p className="mt-2 text-sm text-text-muted">
          Add this book to a shelf to start tracking progress.
        </p>
      </section>
    );
  }

  const startedLabel = formatDate(startedAt);
  const finishedLabel = formatDate(finishedAt);
  const isFinished = Boolean(finishedAt);
  const parsedCurrent = isAudiobook ? parseListeningTime(currentTime) : null;
  const parsedTotal = isAudiobook ? parseListeningTime(totalTime) : null;
  const cur = isAudiobook
    ? parsedCurrent?.ok
      ? parsedCurrent.seconds
      : currentListeningSeconds
    : Number(page) || 0;
  const tot = isAudiobook
    ? parsedTotal?.ok
      ? parsedTotal.seconds
      : totalListeningSeconds
    : Number(total) || totalPages || 0;
  const pageCountUnavailable = isAudiobook
    ? tot <= 0
    : !(totalPages) && !total;
  const atFullProgress = !editing && tot > 0 && cur >= tot && !isFinished;
  const progressAboveTotal = !editing && cur > 0 && tot > 0 && cur > tot;
  const livePercent = isAudiobook
    ? tot > 0
      ? calculateAudiobookProgress(cur, tot)
      : displayPercent
    : percentFromPages(cur, tot) ?? displayPercent;

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-puce-red">Reading room</h2>

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text-muted">Progress</dt>
          <dd className="font-medium text-text">{Math.round(displayPercent)}% complete</dd>
        </div>
        {tot > 0 ? (
          <div>
            <dt className="text-text-muted">{isAudiobook ? "Listening time" : "Pages"}</dt>
            <dd className="font-medium text-text">
              {isAudiobook
                ? `${formatAudiobookProgressLabel(cur, tot)} · ${Math.round(livePercent)}%`
                : `${cur || currentPage} / ${tot}`}
            </dd>
          </div>
        ) : null}
        {startedLabel ? (
          <div>
            <dt className="text-text-muted">Started</dt>
            <dd className="text-text" suppressHydrationWarning>
              {startedLabel}
            </dd>
          </div>
        ) : null}
        {finishedLabel ? (
          <div>
            <dt className="text-text-muted">Finished</dt>
            <dd className="text-text" suppressHydrationWarning>
              {finishedLabel}
            </dd>
          </div>
        ) : null}
      </dl>

      {pageCountUnavailable ? (
        <p className="mt-2 text-sm text-text-muted">
          {isAudiobook
            ? "Enter the audiobook's total listening time below to track percent complete."
            : "Page count unavailable — enter total pages below to track percent complete."}
        </p>
      ) : null}

      <form
        action={submitProgress}
        className="mt-4 space-y-3"
        onSubmit={() => {
          setClientError(null);
          commitPreview();
        }}
      >
        <input type="hidden" name="book_id" value={bookId} />
        <input type="hidden" name="format" value={isAudiobook ? "audiobook" : "book"} />
        <div className="grid gap-4 sm:grid-cols-2">
          {isAudiobook ? (
            <>
              <Input
                label="Current Listening Time"
                name="current_listening_time"
                inputMode="numeric"
                placeholder="2:30"
                hint="Enter your current listening position in hours and minutes."
                value={currentTime}
                aria-label={
                  parsedCurrent?.ok
                    ? formatListeningTimeSpoken(parsedCurrent.seconds)
                    : "Current listening time"
                }
                onFocus={() => setEditing(true)}
                onChange={(e) => {
                  setEditing(true);
                  setCurrentTime(e.target.value);
                  setClientError(null);
                }}
                onBlur={() => {
                  setCurrentTime(normalizeTime(currentTime));
                  commitPreview();
                }}
                error={clientError ?? undefined}
              />
              <Input
                label="Total Listening Time"
                name="total_listening_time"
                inputMode="numeric"
                placeholder="20:30"
                hint="Enter the audiobook's total length in hours and minutes."
                value={totalTime}
                onFocus={() => setEditing(true)}
                onChange={(e) => {
                  setEditing(true);
                  setTotalTime(e.target.value);
                  setClientError(null);
                }}
                onBlur={() => {
                  setTotalTime(normalizeTime(totalTime));
                  commitPreview();
                }}
              />
            </>
          ) : (
            <>
              <Input
                label="Current page"
                name="current_page"
                type="number"
                min={0}
                value={page}
                onFocus={() => setEditing(true)}
                onChange={(e) => {
                  setEditing(true);
                  setPage(e.target.value);
                  setClientError(null);
                }}
                onBlur={commitPreview}
                error={clientError ?? undefined}
              />
              <Input
                label="Total pages"
                name="total_pages"
                type="number"
                min={0}
                placeholder={totalPages ? String(totalPages) : "Enter total"}
                value={total}
                onFocus={() => setEditing(true)}
                onChange={(e) => {
                  setEditing(true);
                  setTotal(e.target.value);
                  setClientError(null);
                }}
                onBlur={commitPreview}
              />
            </>
          )}
        </div>
        <ProgressBar
          value={displayPercent}
          label={`${Math.round(displayPercent)}% complete`}
          animate
        />
        {atFullProgress ? (
          <p className="rounded-lg bg-orange-yellow/20 px-3 py-2 text-sm text-puce-red">
            {isAudiobook
              ? "You've reached the end — mark this audiobook as finished to move it to Read."
              : "You've reached the last page — mark this book as finished to move it to Read."}
          </p>
        ) : null}
        {progressAboveTotal ? (
          <p className="text-sm text-text-muted">
            {isAudiobook
              ? "Current listening time is above the total. Saving will cap progress at 100% without marking the book finished."
              : "Current page is above total pages. Saving will cap progress at 100% without marking the book finished."}
          </p>
        ) : null}
        <Button type="submit" variant="secondary" loading={saving}>
          Update progress
        </Button>
        {isFinished ? (
          <p className="text-sm font-medium text-puce-red">
            This book is finished. Updating progress will move it back to Currently
            Reading.
          </p>
        ) : null}
      </form>

      {isAudiobook ? (
        <form
          action={submitSession}
          className="mt-6 space-y-3 border-t border-border pt-4"
          onSubmit={() => setSessionError(null)}
        >
          <h3 className="text-sm font-semibold text-puce-red">Log listening session</h3>
          <input type="hidden" name="book_id" value={bookId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Starting Listening Position"
              name="listening_start_time"
              inputMode="numeric"
              placeholder="1:45"
              hint="Hours and minutes, such as 1:45."
              value={sessionStart}
              onChange={(e) => {
                setSessionStart(e.target.value);
                setSessionError(null);
              }}
              onBlur={() => setSessionStart(normalizeTime(sessionStart))}
              error={sessionError ?? undefined}
            />
            <Input
              label="Ending Listening Position"
              name="listening_end_time"
              inputMode="numeric"
              placeholder="2:30"
              hint="Hours and minutes, such as 2:30."
              value={sessionEnd}
              onChange={(e) => {
                setSessionEnd(e.target.value);
                setSessionError(null);
              }}
              onBlur={() => setSessionEnd(normalizeTime(sessionEnd))}
            />
          </div>
          <Button type="submit" variant="outline" loading={sessionSaving}>
            Save listening session
          </Button>
        </form>
      ) : null}

      {!isFinished ? (
        <div
          className={cn(
            "mt-4 border-t border-border pt-4",
            atFullProgress && "rounded-lg bg-primary/10 px-3 pb-3"
          )}
        >
          <Button
            type="button"
            variant={atFullProgress ? "secondary" : "outline"}
            onClick={() => setFinishOpen(true)}
          >
            Mark as finished
          </Button>
        </div>
      ) : null}

      <MarkFinishedDialog
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        bookId={bookId}
        bookTitle={bookTitle}
        startedAt={startedAt}
        onFinished={handleFinished}
        onPromptReview={() => {
          if (!hasReviewForCurrentRead) setRatePromptOpen(true);
        }}
      />

      <RateBookPrompt
        open={ratePromptOpen}
        bookTitle={bookTitle}
        onSkip={() => setRatePromptOpen(false)}
        onReviewNow={handleReviewNow}
      />

      <CompletionCelebration
        open={celebrationOpen}
        bookTitle={bookTitle}
        challengeUpdates={challengeUpdates}
        onClose={() => setCelebrationOpen(false)}
      />

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            document.getElementById("reading-trail")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          Trail
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            document.getElementById("reading-notes")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          Reading notes
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setTransferOpen(true)}
        >
          Move to another edition
        </Button>
      </div>

      <TransferReadingStatsModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        fromBookId={bookId}
        fromBookTitle={bookTitle}
      />
    </section>
  );
}
