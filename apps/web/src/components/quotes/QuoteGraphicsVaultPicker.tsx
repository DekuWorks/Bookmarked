"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { QuoteGraphicCard } from "@/components/quotes/QuoteGraphicCard";
import { listQuoteGraphics } from "@/lib/services/quoteGraphics";
import { quoteGraphicSnippet } from "@bookmarked/utils/quoteGraphics";
import type { QuoteGraphic } from "@/types";

type Props = {
  userId: string;
  open: boolean;
  onClose: () => void;
  onSelect: (graphic: QuoteGraphic) => void;
};

export function QuoteGraphicsVaultPicker({ userId, open, onClose, onSelect }: Props) {
  const [items, setItems] = useState<QuoteGraphic[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void listQuoteGraphics(userId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  return (
    <Modal open={open} onClose={onClose} title="Quote Graphics Vault">
      {items == null ? (
        <LoadingState message="Loading vault…" />
      ) : items.length === 0 ? (
        <p className="text-sm text-text-muted">No saved graphics yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((graphic) => (
            <li key={graphic.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(graphic);
                  onClose();
                }}
                className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
              >
                {graphic.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={graphic.image_url}
                    alt={quoteGraphicSnippet(graphic.quote_text)}
                    className="max-h-48 w-full rounded-xl object-cover"
                  />
                ) : (
                  <QuoteGraphicCard
                    quote={graphic.quote_text}
                    attribution={graphic.attribution}
                  />
                )}
                <p className="mt-1 text-xs text-text-muted">
                  {graphic.book?.title ?? "Saved graphic"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
