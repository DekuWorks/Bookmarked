import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button } from "./Button";

type Props = {
  title: string;
  description: string;
  featureLabel?: string;
  compact?: boolean;
};

export function PremiumFeatureLock({
  title,
  description,
  featureLabel = "Premium",
  compact,
}: Props) {
  const router = useRouter();

  return (
    <View
      className={`overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-surface ${compact ? "p-4" : "p-6"}`}
    >
      <View className="items-center">
        <View className="rounded-full bg-primary/20 px-3 py-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-puce-red">
            {featureLabel}
          </Text>
        </View>
        <Text
          className={`text-center font-semibold text-puce-red ${compact ? "mt-3 text-base" : "mt-4 text-lg"}`}
        >
          {title}
        </Text>
        <Text
          className={`text-center text-ink-muted ${compact ? "mt-2 text-sm" : "mt-3 text-sm leading-5"}`}
        >
          {description}
        </Text>
        <View className="mt-4 w-full">
          <Button
            title="Upgrade to Premium"
            variant="primary"
            onPress={() => router.push("/upgrade")}
          />
        </View>
      </View>
    </View>
  );
}
