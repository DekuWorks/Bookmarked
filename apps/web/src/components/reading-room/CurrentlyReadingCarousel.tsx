"use client";

import { useRef, useState } from "react";
import { AddCurrentlyReadingCard } from "@/components/reading-room/AddCurrentlyReadingCard";
import { CurrentlyReadingAddDialog } from "@/components/reading-room/CurrentlyReadingAddDialog";
import { CurrentlyReadingCard } from "@/components/reading-room/CurrentlyReadingCard";
import type { LibraryBookRow } from "@/lib/services/library";
import { CURRENTLY_READING_ADD_EVENTS } from "@bookmarked/utils/currentlyReadingAdd";
import { OVERVIEW_SECTION_TITLES } from "@bookmarked/utils/overviewCopy";
import { trackProductEvent } from "@/lib/services/productAnalytics";

type Props = {
  items: LibraryBookRow[];
  onItemsChange?: () => void;
};

function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export function CurrentlyReadingCarousel({ items, onItemsChange }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const count = items.length + 1;

  function syncIndex() {
    const el = scrollerRef.current;
    if (!el || el.clientWidth <= 0) return;
    setIndex(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / el.clientWidth))));
  }

  function scrollToIndex(next: number) {
    const el = scrollerRef.current;
    const clamped = Math.max(0, Math.min(count - 1, next));
    const child = el?.children[clamped] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: scrollBehavior(), inline: "start", block: "nearest" });
    setIndex(clamped);
  }

  function openAdd() {
    trackProductEvent(CURRENTLY_READING_ADD_EVENTS.opened);
    setAddOpen(true);
  }

  return (
    <section className="rounded-2xl border border-border bg-surface/90 p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-puce-red md:text-2xl">
          {OVERVIEW_SECTION_TITLES.currentlyReading}
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-sm tabular-nums text-text-muted" aria-live="polite">
            {index + 1} / {count}
          </p>
          <div className="hidden gap-1 md:flex">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-lg text-puce-red disabled:opacity-40"
              aria-label="Previous currently reading book"
              disabled={index === 0}
              onClick={() => scrollToIndex(index - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-lg text-puce-red disabled:opacity-40"
              aria-label="Next currently reading book"
              disabled={index >= count - 1}
              onClick={() => scrollToIndex(index + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={syncIndex}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
        aria-label="Currently reading books"
      >
        {items.map((item) => (
          <div key={item.id} className="w-full shrink-0 snap-start">
            <CurrentlyReadingCard item={item} />
          </div>
        ))}
        <div className="w-full shrink-0 snap-start">
          <AddCurrentlyReadingCard onClick={openAdd} />
        </div>
      </div>

      <CurrentlyReadingAddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => onItemsChange?.()}
      />
    </section>
  );
}
