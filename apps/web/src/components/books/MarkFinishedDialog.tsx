"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { markBookFinished, type BookActionState } from "@/lib/actions/book";

const initial: BookActionState = {};

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  open: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  startedAt?: string | null;
  onFinished?: () => void;
  onPromptReview?: () => void;
};

export function MarkFinishedDialog({
  open,
  onClose,
  bookId,
  bookTitle,
  startedAt,
  onFinished,
  onPromptReview,
}: Props) {
  const toast = useToast();
  const [finishDate, setFinishDate] = useState(todayInputValue());
  const [clientError, setClientError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(markBookFinished, initial);

  useEffect(() => {
    if (!open) return;
    setFinishDate(todayInputValue());
    setClientError(null);
  }, [open]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      onFinished?.();
      onClose();
      if (state.promptReview) onPromptReview?.();
    }
  }, [state, toast, onFinished, onClose, onPromptReview]);

  const startedDate = startedAt?.slice(0, 10) ?? "";

  return (
    <Modal open={open} onClose={onClose} title="Mark as finished">
      <p className="text-sm text-text-muted">
        <span className="font-medium text-text">{bookTitle}</span> will move to your Read shelf,
        progress will be set to 100%, and a journal entry will be added.
      </p>

      <form
        action={formAction}
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          if (startedDate && finishDate && finishDate < startedDate) {
            e.preventDefault();
            setClientError("Finish date cannot be before start date.");
            return;
          }
          setClientError(null);
        }}
      >
        <input type="hidden" name="book_id" value={bookId} />
        <input type="hidden" name="finished_at" value={finishDate} />
        <Input
          label="Finish date"
          type="date"
          value={finishDate}
          min={startedDate || undefined}
          max={todayInputValue()}
          onChange={(e) => {
            setFinishDate(e.target.value);
            setClientError(null);
          }}
          error={clientError ?? undefined}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={pending}>
            Mark finished
          </Button>
        </div>
      </form>
    </Modal>
  );
}
