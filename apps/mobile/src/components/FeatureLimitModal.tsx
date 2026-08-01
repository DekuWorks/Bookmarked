import { Modal, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "./Button";
import { PlusBadge } from "./PlusBadge";

type Props = {
  open: boolean;
  onClose: () => void;
  featureLabel: string;
  limitMessage: string;
  preserveNote?: string;
};

export function FeatureLimitModal({
  open,
  onClose,
  featureLabel,
  limitMessage,
  preserveNote = "Your existing items stay safe — upgrading unlocks more room to create.",
}: Props) {
  const router = useRouter();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-6"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Pressable
          className="w-full max-w-md rounded-2xl border border-brand-border bg-surface p-5"
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
          accessibilityLabel={featureLabel}
        >
          <View className="mb-3 flex-row flex-wrap items-center gap-2">
            <PlusBadge compact />
            <Text className="text-lg font-semibold text-puce-red">{featureLabel}</Text>
          </View>
          <Text className="text-sm leading-5 text-ink-muted">{limitMessage}</Text>
          <Text className="mt-2 text-sm leading-5 text-ink-muted">{preserveNote}</Text>
          <View className="mt-5 gap-2">
            <Button
              title="Upgrade to Plus"
              onPress={() => {
                onClose();
                router.push("/(app)/upgrade");
              }}
            />
            <Button title="Not now" variant="ghost" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
