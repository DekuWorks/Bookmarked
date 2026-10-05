"use client";

import { CurrentlyReadingCarousel } from "@/components/reading-room/CurrentlyReadingCarousel";
import { ReadingGoalCard } from "@/components/reading-room/ReadingGoalCard";
import { ShelfPreviewSection } from "@/components/reading-room/ShelfPreviewSection";
import { ChallengesCTA } from "@/components/reading-room/ChallengesCTA";
import type { ReadingRoomData } from "@/lib/services/readingRoom";

type Props = {
  data: Pick<ReadingRoomData, "currentlyReading" | "readingGoal" | "shelves">;
  onRefresh: () => void;
};

export function OverviewTab({ data, onRefresh }: Props) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <CurrentlyReadingCarousel items={data.currentlyReading} onItemsChange={onRefresh} />
      <ReadingGoalCard status={data.readingGoal} />
      <ShelfPreviewSection shelves={data.shelves} />
      <ChallengesCTA />
    </div>
  );
}
