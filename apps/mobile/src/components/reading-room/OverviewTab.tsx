import { View } from "react-native";
import { CurrentlyReadingCarousel } from "./CurrentlyReadingCarousel";
import { ReadingGoalCard } from "./ReadingGoalCard";
import { ShelfPreviewSection } from "./ShelfPreviewSection";
import { ChallengesCTA } from "./ChallengesCTA";
import { groupBooksByShelf, type LibraryBookRow } from "../../services/library";
import type { ReadingGoalStatus } from "../../services/readingGoal";

type Props = {
  userId: string;
  books: LibraryBookRow[];
  currentlyReading: LibraryBookRow[];
  readingGoal: ReadingGoalStatus;
  dataSettled: boolean;
  focusGeneration: number;
  onRefresh: () => void;
  onMoveStart?: (row: LibraryBookRow) => void;
  onMoveFailed?: (row: LibraryBookRow) => void;
};

export function OverviewTab({
  userId,
  books,
  currentlyReading,
  readingGoal,
  dataSettled,
  focusGeneration,
  onRefresh,
  onMoveStart,
  onMoveFailed,
}: Props) {
  const shelves = groupBooksByShelf(books);

  return (
    <View className="gap-4">
      <CurrentlyReadingCarousel
        userId={userId}
        items={currentlyReading}
        onRefresh={onRefresh}
        onMoveStart={onMoveStart}
        onMoveFailed={onMoveFailed}
      />
      <ReadingGoalCard
        status={readingGoal}
        dataSettled={dataSettled}
        focusGeneration={focusGeneration}
      />
      <ShelfPreviewSection shelves={shelves} />
      <ChallengesCTA />
    </View>
  );
}
