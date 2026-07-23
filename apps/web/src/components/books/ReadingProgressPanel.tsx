"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MarkFinishedDialog } from "@/components/books/MarkFinishedDialog";
import { RateBookPrompt } from "@/components/books/RateBookPrompt";
import { TransferReadingStatsModal } from "@/components/books/TransferReadingStatsModal";
import { cn } from "@/lib/utils/cn";
import { updateReadingProgress, type BookActionState } from "@/lib/actions/book";
import { useActionState } from "react";
import { useActionToast } from "@/lib/hooks/useActionToast";

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
}: Props) {
  const [page, setPage] = useState(String(currentPage || ""));
  const [total, setTotal] = useState(String(totalPages || ""));
  const [displayPercent, setDisplayPercent] = useState(progressPercent);
  // While focused in either field, hold the last committed percent so
  // intermediate values (476 → 47) never flash 100% or lock the form.
  const [editing, setEditing] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [ratePromptOpen, setRatePromptOpen] = useState(false);
  const [progressAction, submitProgress, saving] = useActionState(
    updateReadingProgress,
    initial
  );
  const onProgressChangeRef = useRef(onProgressChange);

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  // Track the last props we synced so we only pull server values into the
  // inputs when they *actually* change. Without this, toggling `editing`
  // false (on blur/submit) would re-run this effect and overwrite the value
  // the user just typed with the stale prop — making edits appear to revert.
  const lastSynced = useRef({ currentPage, totalPages, progressPercent });

  useEffect(() => {
    const prev = lastSynced.current;
    const propsChanged =
      prev.currentPage !== currentPage ||
      prev.totalPages !== totalPages ||
      prev.progressPercent !== progressPercent;
    lastSynced.current = { currentPage, totalPages, progressPercent };

    // Only overwrite local input when new server data arrives, and never
    // while the user is actively editing (a realtime tick must not clobber
    // an in-progress edit).
    if (!propsChanged || editing) return;
    setPage(String(currentPage || ""));
    setTotal(String(totalPages || ""));
    setDisplayPercent(progressPercent);
  }, [currentPage, totalPages, progressPercent, editing]);

  useActionToast(progressAction, () => {
    onProgressChangeRef.current?.();
  });

  function handleFinished() {
    onProgressChange?.();
  }

  function handleReviewNow() {
    setRatePromptOpen(false);
    onReviewNow?.();
  }

  function commitPreview() {
    setEditing(false);
    const cur = Number(page) || 0;
    const tot = Number(total) || totalPages || 0;
    const next = percentFromPages(cur, tot);
    if (next != null) setDisplayPercent(next);
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
  // Only an explicit finish marks the book finished — never live percent.
  const isFinished = Boolean(finishedAt);

  const cur = Number(page) || 0;
  const tot = Number(total) || totalPages || 0;
  const pageCountUnavailable = !totalPages && !total;
  const atFullProgress = !editing && tot > 0 && cur >= tot && !isFinished;
  const progressAboveTotal = !editing && cur > 0 && tot > 0 && cur > tot;

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
            <dt className="text-text-muted">Pages</dt>
            <dd className="font-medium text-text">
              {cur || currentPage} / {tot}
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
          Page count unavailable — enter total pages below to track percent complete.
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
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        <ProgressBar
          value={displayPercent}
          label={`${Math.round(displayPercent)}% complete`}
          animate
        />
        {atFullProgress ? (
          <p className="rounded-lg bg-orange-yellow/20 px-3 py-2 text-sm text-puce-red">
            You&apos;ve reached the last page — mark this book as finished to move it to
            Read.
          </p>
        ) : null}
        {progressAboveTotal ? (
          <p className="text-sm text-text-muted">
            Current page is above total pages. Saving will cap progress at 100% without
            marking the book finished.
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

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            document.getElementById("reading-journal")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          Reading journal
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
