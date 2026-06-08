"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
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
};

export function ReadingProgressPanel({
  bookId,
  onShelf,
  currentPage,
  totalPages,
  progressPercent,
  startedAt,
  finishedAt,
}: Props) {
  const toast = useToast();
  const [page, setPage] = useState(String(currentPage || ""));
  const [total, setTotal] = useState(String(totalPages || ""));
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
    if (progressAction.error) toast.error(progressAction.error);
    if (progressAction.success) toast.success(progressAction.success);
  }, [progressAction, toast]);

  useEffect(() => {
    if (finishAction.error) toast.error(finishAction.error);
    if (finishAction.success) toast.success(finishAction.success);
  }, [finishAction, toast]);

  const previewPercent = useMemo(() => {
    const cur = Number(page) || 0;
    const tot = Number(total) || totalPages || 0;
    if (tot <= 0) return progressPercent;
    return Math.min(100, Math.round((cur / tot) * 1000) / 10);
  }, [page, total, totalPages, progressPercent]);

  const pageCountUnavailable = !totalPages && !total;

  function validateBeforeSubmit(): boolean {
    const cur = Number(page) || 0;
    const tot = Number(total) || totalPages || 0;
    if (tot > 0 && cur > tot) {
      setClientError("Current page cannot exceed total pages.");
      return false;
    }
    setClientError(null);
    return true;
  }

  if (!onShelf) {
    return (
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-puce-red">Reading progress</h2>
        <p className="mt-2 text-sm text-text-muted">
          Add this book to a shelf to start tracking progress.
        </p>
      </section>
    );
  }

  const displayPercent =
    progressAction.success && progressAction.success.includes("%")
      ? parseFloat(progressAction.success)
      : previewPercent;

  const startedLabel = formatDate(startedAt);
  const finishedLabel = formatDate(finishedAt);

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-puce-red">Reading progress</h2>

      {startedLabel || finishedLabel ? (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {startedLabel ? (
            <div>
              <dt className="inline text-text-muted">Started </dt>
              <dd className="inline text-text" suppressHydrationWarning>
                {startedLabel}
              </dd>
            </div>
          ) : null}
          {finishedLabel ? (
            <div>
              <dt className="inline text-text-muted">Finished </dt>
              <dd className="inline text-text" suppressHydrationWarning>
                {finishedLabel}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

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
              setTotal(e.target.value);
              setClientError(null);
            }}
          />
        </div>
        <ProgressBar
          value={displayPercent}
          label={`${Math.round(displayPercent)}% complete`}
        />
        <Button type="submit" variant="secondary" loading={saving}>
          Save progress
        </Button>
      </form>

      <form
        action={submitFinish}
        className="mt-4 border-t border-border pt-4"
        onSubmit={(e) => {
          if (!validateBeforeSubmit()) e.preventDefault();
        }}
      >
        <input type="hidden" name="book_id" value={bookId} />
        <Button type="submit" variant="outline" loading={finishing}>
          Mark as finished
        </Button>
      </form>
    </section>
  );
}
