"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  fetchWorkEditions,
  type OpenLibraryEditionSummary,
} from "@/lib/services/openLibrary";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  workId: string;
  workTitle: string;
  onClose: () => void;
  onSelect: (edition: OpenLibraryEditionSummary) => void;
};

export function EditionPickerModal({ open, workId, workTitle, onClose, onSelect }: Props) {
  const [editions, setEditions] = useState<OpenLibraryEditionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !workId) return;

    setEditions(null);
    setError(null);
    void fetchWorkEditions(workId)
      .then((items) => {
        setEditions(items);
        if (items.length === 0) {
          setError("No editions found for this work.");
        }
      })
      .catch(() => setError("Could not load editions. Try again."));
  }, [open, workId]);

  return (
    <Modal open={open} onClose={onClose} title="Choose an edition" className="max-w-lg">
      <p className="mb-4 text-sm text-text-muted">
        Pick a specific edition of <span className="font-medium text-text">{workTitle}</span>{" "}
        before adding to your shelf.
      </p>

      {editions === null && !error ? (
        <p className="text-sm text-text-muted">Loading editions…</p>
      ) : null}

      {error ? (
        <p className="text-sm text-rust" role="alert">
          {error}
        </p>
      ) : null}

      {editions && editions.length > 0 ? (
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto" role="listbox" aria-label="Editions">
          {editions.map((edition) => (
            <li key={edition.editionKey}>
              <button
                type="button"
                role="option"
                onClick={() => {
                  onSelect(edition);
                  onClose();
                }}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-lg border border-border bg-background px-4 py-3 text-left transition",
                  "hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
                )}
              >
                <span className="font-medium text-text">{edition.title}</span>
                <span className="text-xs text-text-muted">
                  {[edition.publishDate, edition.publisher, edition.pageCount ? `${edition.pageCount} pp` : null, edition.isbn ? `ISBN ${edition.isbn}` : null]
                    .filter(Boolean)
                    .join(" · ") || "Edition details unavailable"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

export type { OpenLibraryEditionSummary };
