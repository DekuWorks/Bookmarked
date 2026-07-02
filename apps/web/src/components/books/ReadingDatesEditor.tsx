"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { updateReadingDates, type BookActionState } from "@/lib/actions/book";

const initial: BookActionState = {};

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

type Props = {
  bookId: string;
  onShelf: boolean;
  startedAt?: string | null;
  finishedAt?: string | null;
  onDatesChange?: () => void;
};

export function ReadingDatesEditor({
  bookId,
  onShelf,
  startedAt,
  finishedAt,
  onDatesChange,
}: Props) {
  const toast = useToast();
  const [started, setStarted] = useState(toDateInputValue(startedAt));
  const [finished, setFinished] = useState(toDateInputValue(finishedAt));
  const [clientError, setClientError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(updateReadingDates, initial);

  useEffect(() => {
    setStarted(toDateInputValue(startedAt));
    setFinished(toDateInputValue(finishedAt));
  }, [startedAt, finishedAt]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      onDatesChange?.();
    }
  }, [state, toast, onDatesChange]);

  if (!onShelf) return null;

  function validateBeforeSubmit(): boolean {
    if (started && finished && finished < started) {
      setClientError("Finish date cannot be before start date.");
      return false;
    }
    setClientError(null);
    return true;
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-puce-red">Reading dates</h2>
      <p className="mt-1 text-sm text-text-muted">
        Preserve when you started and finished — useful for imports and history.
      </p>

      <form
        action={formAction}
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          if (!validateBeforeSubmit()) e.preventDefault();
        }}
      >
        <input type="hidden" name="book_id" value={bookId} />
        <input type="hidden" name="started_at" value={started} />
        <input type="hidden" name="finished_at" value={finished} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Started reading"
            type="date"
            value={started}
            onChange={(e) => {
              setStarted(e.target.value);
              setClientError(null);
            }}
            error={clientError ?? undefined}
          />
          <Input
            label="Finished reading"
            type="date"
            value={finished}
            min={started || undefined}
            onChange={(e) => {
              setFinished(e.target.value);
              setClientError(null);
            }}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" loading={pending}>
          Save dates
        </Button>
      </form>
    </section>
  );
}
