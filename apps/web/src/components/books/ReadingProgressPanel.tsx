"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";
import {
  markBookFinished,
  updateReadingProgress,
  type BookActionState,
} from "@/lib/actions/book";

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
  onShelf: boolean;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  onProgressChange?: () => void;
};

export function ReadingProgressPanel({
  bookId,
  onShelf,
  currentPage,
  totalPages,
  progressPercent,
  startedAt,
  finishedAt,
  onProgressChange,
}: Props) {
  const toast = useToast();
  const [page, setPage] = useState(String(currentPage || ""));
  const [total, setTotal] = useState(String(totalPages || ""));
  const [displayPercent, setDisplayPercent] = useState(progressPercent);
  // While focused in either field, hold the last committed percent so
  // intermediate values (476 → 47) never flash 100% or lock the form.
  const [editing, setEditing] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [progressAction, submitProgress, saving] = useActionState(
    updateReadingProgress,
    initial
  );
  const [finishAction, submitFinish, finishing] = useActionState(
    markBookFinished,
    initial
  );

  useEffect(() => {
    if (editing) return;
    setPage(String(currentPage || ""));
    setTotal(String(totalPages || ""));
    setDisplayPercent(progressPercent);
  }, [currentPage, totalPages, progressPercent, editing]);

  useEffect(() => {
    if (progressAction.error) toast.error(progressAction.error);
    if (progressAction.success) {
      toast.success(progressAction.success);
      onProgressChange?.();
    }
  }, [progressAction, toast, onProgressChange]);

  useEffect(() => {
    if (finishAction.error) toast.error(finishAction.error);
    if (finishAction.success) {
      toast.success(finishAction.success);
      onProgressChange?.();
    }
  }, [finishAction, toast, onProgressChange]);

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
        <form
          action={submitFinish}
          className={cn(
            "mt-4 border-t border-border pt-4",
            atFullProgress && "rounded-lg bg-primary/10 px-3 pb-3"
          )}
        >
          <input type="hidden" name="book_id" value={bookId} />
          <Button
            type="submit"
            variant={atFullProgress ? "secondary" : "outline"}
            loading={finishing}
          >
            Mark as finished
          </Button>
        </form>
      ) : null}

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
      </div>
    </section>
  );
}
