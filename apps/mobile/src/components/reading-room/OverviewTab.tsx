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
  onSetGoal?: () => void;
  onRefresh: () => void;
};

export function OverviewTab({
  userId,
  books,
  currentlyReading,
  readingGoal,
  onSetGoal,
  onRefresh,
}: Props) {
  const shelves = groupBooksByShelf(books);

  return (
    <View className="gap-4">
      <CurrentlyReadingCarousel userId={userId} items={currentlyReading} onRefresh={onRefresh} />
      <ReadingGoalCard status={readingGoal} onSetGoal={onSetGoal} />
      <ShelfPreviewSection shelves={shelves} />
      <ChallengesCTA />
    </View>
  );
}
