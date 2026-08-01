import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "./Button";
import { PlusBadge } from "./PlusBadge";

type Props = {
  title: string;
  description: string;
  ctaLabel?: string;
};

export function UpgradePrompt({
  title,
  description,
  ctaLabel = "Explore Bookmarked Plus",
}: Props) {
  const router = useRouter();

  return (
    <View
      className="rounded-2xl border border-primary/30 bg-surface p-4"
      accessibilityRole="summary"
      accessibilityLabel={title}
    >
      <View className="mb-2 flex-row flex-wrap items-center gap-2">
        <PlusBadge compact />
        <Text className="text-base font-semibold text-puce-red">{title}</Text>
      </View>
      <Text className="text-sm leading-5 text-ink-muted">{description}</Text>
      <View className="mt-4">
        <Button title={ctaLabel} onPress={() => router.push("/(app)/upgrade")} />
      </View>
    </View>
  );
}
