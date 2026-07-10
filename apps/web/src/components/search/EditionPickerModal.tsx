"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EDITION_PAGE_SIZE } from "@/lib/constants/searchFilters";
import {
  fetchCatalogEditions,
  type CatalogEditionSummary,
} from "@/lib/services/isbndb";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  workId: string;
  workTitle: string;
  onClose: () => void;
  onSelect: (edition: CatalogEditionSummary) => void;
};

export function EditionPickerModal({ open, workId, workTitle, onClose, onSelect }: Props) {
  const [editions, setEditions] = useState<CatalogEditionSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const loadEditions = useCallback(
    async (offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
        setLoadMoreError(null);
      } else {
        setLoading(true);
        setError(null);
        setLoadMoreError(null);
      }

      try {
        const result = await fetchCatalogEditions(workId, {
          limit: EDITION_PAGE_SIZE,
          offset,
        });

        setTotal(result.total);
        setEditions((prev) => {
          if (!append) return result.editions;
          const seen = new Set((prev ?? []).map((edition) => edition.editionKey));
          const next = result.editions.filter((edition) => !seen.has(edition.editionKey));
          return [...(prev ?? []), ...next];
        });

        if (!append && result.editions.length === 0) {
          setError("No editions found for this work.");
        }
      } catch {
        if (append) {
          setLoadMoreError("Could not load more editions. Try again.");
        } else {
          setEditions(null);
          setTotal(0);
          setError("Could not load editions. Try again.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [workId]
  );

  useEffect(() => {
    if (!open || !workId) return;

    setEditions(null);
    setTotal(0);
    setError(null);
    setLoadMoreError(null);
    void loadEditions(0, false);
  }, [open, workId, loadEditions]);

  const hasMore = editions !== null && editions.length < total;

  return (
    <Modal open={open} onClose={onClose} title="Choose an edition" className="max-w-lg">
      <p className="mb-4 text-sm text-text-muted">
        Pick a specific edition of <span className="font-medium text-text">{workTitle}</span>{" "}
        before adding to your shelf.
      </p>

      {loading && editions === null && !error ? (
        <p className="text-sm text-text-muted">Loading editions…</p>
      ) : null}

      {error ? (
        <p className="text-sm text-rust" role="alert">
          {error}
        </p>
      ) : null}

      {editions && editions.length > 0 ? (
        <>
          <p className="mb-3 text-xs text-text-muted">
            Showing {editions.length.toLocaleString()} of {total.toLocaleString()} editions
          </p>
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
                    {[
                      edition.publishDate,
                      edition.publisher,
                      edition.pageCount ? `${edition.pageCount} pp` : null,
                      edition.isbn ? `ISBN ${edition.isbn}` : null,
                      edition.coverUrl ? "Cover available" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Edition details unavailable"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {hasMore ? (
            <div className="mt-3 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={loadingMore}
                onClick={() => void loadEditions(editions.length, true)}
              >
                Load more editions
              </Button>
            </div>
          ) : null}

          {loadMoreError ? (
            <p className="mt-2 text-center text-sm text-rust" role="alert">
              {loadMoreError}
            </p>
          ) : null}
        </>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

export type { CatalogEditionSummary, CatalogEditionSummary as OpenLibraryEditionSummary };
