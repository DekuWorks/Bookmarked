import { computeReadingDna } from "../../../../packages/utils/readingDna";
import { Text, View } from "react-native";
import { Button } from "./Button";

type Props = {
  favoriteGenres: string[];
  canAccess: (feature: "reading_dna_dashboard" | "reading_dna_match") => boolean;
  onUpgrade: () => void;
};

export function ReadingDnaSection({ favoriteGenres, canAccess, onUpgrade }: Props) {
  const dna = computeReadingDna({ shelves: favoriteGenres.map((genre) => ({ genre })) });
  const hasPlus = canAccess("reading_dna_dashboard");
  const hasHome = canAccess("reading_dna_match");

  return (
    <View className="mt-6 rounded-2xl border border-brand-border bg-surface p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-puce-red">Reading DNA</Text>
          <Text className="mt-1 text-sm text-ink-muted">
            Your evolving reader profile from books, shelves, ratings, and reviews.
          </Text>
        </View>
        <Text className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {hasPlus ? "Full dashboard" : "Top traits"}
        </Text>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {dna.topTraits.map((trait) => (
          <Text
            key={`${trait.category}-${trait.label}`}
            className="rounded-full bg-primary/15 px-3 py-1 text-sm font-medium capitalize text-puce-red"
          >
            {trait.label}
          </Text>
        ))}
      </View>

      {hasPlus ? (
        <Text className="mt-4 text-sm leading-5 text-ink-muted">
          {dna.summary} AI insights and book-match hooks are ready for your reading history.
        </Text>
      ) : (
        <View className="mt-4">
          <Text className="text-sm leading-5 text-ink-muted">
            Unlock Bookmarked Plus for your full DNA dashboard, AI insights, and book matches.
          </Text>
          <View className="mt-3 self-start">
            <Button title="Explore Plus" variant="secondary" onPress={onUpgrade} />
          </View>
        </View>
      )}

      <Text className="mt-4 text-xs text-ink-muted">
        {hasHome
          ? "Home: monthly DNA updates, DNA Match %, and Reader Map filters."
          : "Bookmarked Home adds monthly DNA updates, DNA Match %, and Reader Map filters."}
      </Text>
    </View>
  );
}
