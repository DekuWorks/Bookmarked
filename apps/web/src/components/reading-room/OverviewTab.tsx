"use client";

import { useRef, useState } from "react";
import { CurrentlyReadingCarousel } from "@/components/reading-room/CurrentlyReadingCarousel";
import { ReadingGoalCard } from "@/components/reading-room/ReadingGoalCard";
import { ShelfPreviewSection } from "@/components/reading-room/ShelfPreviewSection";
import { ChallengesCTA } from "@/components/reading-room/ChallengesCTA";
import type { ReadingRoomData } from "@/lib/services/readingRoom";
import type { LibraryBookRow } from "@/lib/services/library";
import {
  READING_ROOM_DASHBOARD_CLASS,
  relocateOverviewBook,
  sameUserBookIds,
} from "@bookmarked/utils/readingRoomMotion";

type Slice = Pick<ReadingRoomData, "currentlyReading" | "readingGoal" | "shelves">;

type Props = {
  data: Slice;
  dataSettled: boolean;
  onRefresh: () => void;
};

export function OverviewTab({ data, dataSettled, onRefresh }: Props) {
  const [override, setOverride] = useState<Pick<Slice, "currentlyReading" | "shelves"> | null>(
    null
  );
  const snapshot = useRef<Pick<Slice, "currentlyReading" | "shelves"> | null>(null);
  const synced =
    override != null &&
    sameUserBookIds(data.currentlyReading, override.currentlyReading) &&
    data.shelves.every((shelf) => {
      const next = override.shelves.find((item) => item.status === shelf.status);
      return next ? sameUserBookIds(shelf.items, next.items) : false;
    });
  if (synced) setOverride(null);
  const activeOverride = synced ? null : override;
  const view = {
    currentlyReading: activeOverride?.currentlyReading ?? data.currentlyReading,
    shelves: activeOverride?.shelves ?? data.shelves,
    readingGoal: data.readingGoal,
  };

  function beginMove(row: LibraryBookRow) {
    setOverride((current) => {
      snapshot.current = current;
      const base = current ?? data;
      return relocateOverviewBook({
        currentlyReading: base.currentlyReading,
        shelves: base.shelves,
        book: row,
        toStatus: "currently_reading",
      });
    });
  }

  function failMove() {
    setOverride(snapshot.current);
    snapshot.current = null;
  }

  return (
    <div className={READING_ROOM_DASHBOARD_CLASS}>
      <CurrentlyReadingCarousel
        items={view.currentlyReading}
        onItemsChange={onRefresh}
        onMoveStart={beginMove}
        onMoveFailed={failMove}
      />
      <ReadingGoalCard
        status={view.readingGoal}
        dataSettled={dataSettled}
        onSaved={onRefresh}
      />
      <ShelfPreviewSection shelves={view.shelves} />
      <ChallengesCTA />
    </div>
  );
}
