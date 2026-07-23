"use client";

import { useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { validateManualPageCount } from "@/lib/utils/readingCompletion";

type Props = {
  bookTitle: string;
  open: boolean;
  loading?: boolean;
  onSaveWithPageCount: (pageCount: number) => void;
  onSaveWithoutPageCount: () => void;
  onClose: () => void;
};

export function MissingPageCountDialog({
  bookTitle,
  open,
  loading = false,
  onSaveWithPageCount,
  onSaveWithoutPageCount,
  onClose,
}: Props) {
  const inputId = useId();
  const errorId = useId();
  const [pageCount, setPageCount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSaveWithCount() {
    const result = validateManualPageCount(pageCount);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onSaveWithPageCount(result.value);
  }

  function handleClose() {
    if (loading) return;
    setPageCount("");
    setError(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Page count unavailable">
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Page count unavailable — This book will count as completed, but it cannot be added to
          your total pages read until a page count is provided.
        </p>
        <p className="text-sm text-text">
          <span className="font-medium">{bookTitle}</span>
        </p>

        <div>
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text">
            Enter page count
          </label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={pageCount}
            onChange={(event) => {
              setPageCount(event.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
            placeholder="e.g. 384"
            disabled={loading}
          />
          {error ? (
            <p id={errorId} className="mt-1.5 text-sm text-rust" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSaveWithoutPageCount}
            loading={loading}
            aria-label={`Save ${bookTitle} as completed without page count`}
          >
            Save without page count
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSaveWithCount}
            loading={loading}
            disabled={!pageCount.trim()}
          >
            Enter page count
          </Button>
        </div>
      </div>
    </Modal>
  );
}
