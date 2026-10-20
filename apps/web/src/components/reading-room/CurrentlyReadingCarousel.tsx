"use client";

import { useEffect, useRef, useState } from "react";
import { AddCurrentlyReadingCard } from "@/components/reading-room/AddCurrentlyReadingCard";
import { CurrentlyReadingAddDialog } from "@/components/reading-room/CurrentlyReadingAddDialog";
import { CurrentlyReadingCard } from "@/components/reading-room/CurrentlyReadingCard";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import type { LibraryBookRow } from "@/lib/services/library";
import { CURRENTLY_READING_ADD_EVENTS } from "@bookmarked/utils/currentlyReadingAdd";
import { OVERVIEW_SECTION_TITLES } from "@bookmarked/utils/overviewCopy";
import {
  READING_ROOM_MOTION,
  carouselIndexAfterMove,
} from "@bookmarked/utils/readingRoomMotion";
import { trackProductEvent } from "@/lib/services/productAnalytics";

type Props = {
  items: LibraryBookRow[];
  onItemsChange?: () => void;
  onMoveStart?: (row: LibraryBookRow) => void;
  onMoveFailed?: (row: LibraryBookRow) => void;
};

let rememberedCarouselIndex = 0;

export function CurrentlyReadingCarousel({
  items,
  onItemsChange,
  onMoveStart,
  onMoveFailed,
}: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const count = items.length + 1;
  const [index, setIndex] = useState(() =>
    carouselIndexAfterMove(rememberedCarouselIndex, 0, count)
  );
  const safeIndex = carouselIndexAfterMove(index, 0, count);
  if (safeIndex !== index) setIndex(safeIndex);

  useEffect(() => {
    rememberedCarouselIndex = safeIndex;
  }, [safeIndex]);
  const [addOpen, setAddOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<number | null>(null);
  const wheelAt = useRef(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function step(delta: number) {
      setIndex((current) => {
        const next = carouselIndexAfterMove(current, delta, count);
        rememberedCarouselIndex = next;
        return next;
      });
    }

    function onWheel(event: WheelEvent) {
      if (Math.abs(event.deltaX) < 16 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const now = Date.now();
      if (now - wheelAt.current < READING_ROOM_MOTION.carouselMs) return;
      wheelAt.current = now;
      step(event.deltaX > 0 ? 1 : -1);
    }

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [count]);

  function commit(delta: number) {
    setIndex((current) => {
      const next = carouselIndexAfterMove(current, delta, count);
      rememberedCarouselIndex = next;
      return next;
    });
  }

  function openAdd() {
    trackProductEvent(CURRENTLY_READING_ADD_EVENTS.opened);
    setAddOpen(true);
  }

  const activeTitle =
    safeIndex >= items.length ? "Add Book" : (items[safeIndex]?.books?.title ?? "Untitled");

  return (
    <section
      className="rounded-2xl border border-border bg-surface/90 p-4 shadow-sm md:p-5"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          commit(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          commit(1);
        }
      }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-puce-red md:text-2xl">
          {OVERVIEW_SECTION_TITLES.currentlyReading}
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-sm tabular-nums text-text-muted" aria-live="polite">
            {safeIndex + 1} / {count}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-lg text-puce-red disabled:opacity-40"
              aria-label="Previous currently reading book"
              disabled={safeIndex === 0}
              onClick={() => commit(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-lg text-puce-red disabled:opacity-40"
              aria-label="Next currently reading book"
              disabled={safeIndex >= count - 1}
              onClick={() => commit(1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div
        ref={viewportRef}
        tabIndex={0}
        className="rr-carousel-viewport focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        aria-label="Currently reading books"
        aria-roledescription="carousel"
        onPointerDown={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest("a, button")) return;
          pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (pointerStart.current == null) return;
          const delta = event.clientX - pointerStart.current;
          pointerStart.current = null;
          if (Math.abs(delta) < 48) return;
          commit(delta < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
      >
        <div
          className="rr-carousel-track"
          style={{
            width: `${count * 100}%`,
            transform: `translate3d(-${(safeIndex * 100) / count}%, 0, 0)`,
            transitionDuration: reducedMotion ? "0ms" : undefined,
          }}
        >
          {items.map((item, itemIndex) => (
            <div
              key={item.id}
              className="shrink-0 px-0.5"
              style={{ width: `${100 / count}%` }}
              aria-hidden={itemIndex === safeIndex ? undefined : true}
              inert={itemIndex === safeIndex ? undefined : true}
            >
              <CurrentlyReadingCard item={item} />
            </div>
          ))}
          <div
            className="shrink-0 px-0.5"
            style={{ width: `${100 / count}%` }}
            aria-hidden={safeIndex === items.length ? undefined : true}
            inert={safeIndex === items.length ? undefined : true}
          >
            <AddCurrentlyReadingCard onClick={openAdd} />
          </div>
        </div>
      </div>
      <p className="sr-only">Showing {activeTitle}</p>

      <CurrentlyReadingAddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => onItemsChange?.()}
        onMoveStart={onMoveStart}
        onMoveFailed={onMoveFailed}
      />
    </section>
  );
}
