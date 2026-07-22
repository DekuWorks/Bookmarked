import { Modal, Pressable, Text, View } from "react-native";
import { Button } from "./Button";

type Props = {
  visible: boolean;
  bookTitle: string;
  onSkip: () => void;
  onReviewNow: () => void;
};

export function RateBookPromptSheet({ visible, bookTitle, onSkip, onReviewNow }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onSkip}>
      <Pressable className="flex-1 items-center justify-center bg-black/30" onPress={onSkip}>
        <Pressable
          className="w-[min(100%,22rem)] rounded-2xl bg-surface p-5"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-lg font-bold text-puce-red">Rate this book?</Text>
          <Text className="mt-2 text-sm leading-5 text-ink-muted">
            You finished <Text className="font-semibold text-ink">{bookTitle}</Text>. Share a quick
            rating or write a full review — or skip for now.
          </Text>
          <View className="mt-5 flex-row gap-2">
            <View className="flex-1">
              <Button title="Skip" variant="ghost" onPress={onSkip} />
            </View>
            <View className="flex-1">
              <Button title="Review now" onPress={onReviewNow} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
