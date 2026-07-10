"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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
  const [editingTotal, setEditingTotal] = useState(false);
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
    setPage(String(currentPage || ""));
    setTotal(String(totalPages || ""));
    setDisplayPercent(progressPercent);
    setEditingTotal(false);
  }, [currentPage, totalPages, progressPercent]);

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

  // Live preview while editing current page; while editing total, keep the
  // last committed percent so mid-keystrokes (476 → 47) don't show 100%.
  const previewPercent = useMemo(() => {
    if (editingTotal) return displayPercent;
    const cur = Number(page) || 0;
    const tot = Number(total) || totalPages || 0;
    if (tot <= 0) return displayPercent;
    return Math.min(100, Math.round((cur / tot) * 1000) / 10);
  }, [page, total, totalPages, displayPercent, editingTotal]);

  useEffect(() => {
    if (editingTotal) return;
    const tot = Number(total) || totalPages || 0;
    if (tot > 0) {
      setDisplayPercent(previewPercent);
    }
  }, [page, total, totalPages, previewPercent, editingTotal]);

  const pageCountUnavailable = !totalPages && !total;

  function commitTotalPreview() {
    setEditingTotal(false);
    const cur = Number(page) || 0;
    const tot = Number(total) || totalPages || 0;
    if (tot > 0) {
      setDisplayPercent(Math.min(100, Math.round((cur / tot) * 1000) / 10));
    }
  }

  function validateBeforeSubmit(): boolean {
    // Allow current > total when correcting a page count downward; server
    // caps percent at 100% without auto-finishing.
    setClientError(null);
    return true;
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
  const atFullProgress =
    !editingTotal && tot > 0 && cur >= tot && !isFinished;

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
        onSubmit={(e) => {
          if (!validateBeforeSubmit()) e.preventDefault();
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
            onChange={(e) => {
              setPage(e.target.value);
              setClientError(null);
            }}
            error={clientError ?? undefined}
          />
          <Input
            label="Total pages"
            name="total_pages"
            type="number"
            min={0}
            placeholder={totalPages ? String(totalPages) : "Enter total"}
            value={total}
            onChange={(e) => {
              setEditingTotal(true);
              setTotal(e.target.value);
              setClientError(null);
            }}
            onBlur={commitTotalPreview}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTotalPreview();
            }}
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
        {cur > 0 && tot > 0 && cur > tot && !editingTotal ? (
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
            Reading if you lower the page count.
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
