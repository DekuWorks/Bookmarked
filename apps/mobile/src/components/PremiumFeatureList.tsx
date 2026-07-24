import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { PREMIUM_FEATURE_LINKS } from "../../../../packages/utils/premiumFeatures";

type Props = {
  className?: string;
};

export function PremiumFeatureList({ className }: Props) {
  const router = useRouter();

  return (
    <View className={className ?? "mt-6 gap-3"}>
      {PREMIUM_FEATURE_LINKS.map((feature) => (
        <View
          key={feature.id}
          className="rounded-xl border border-brand-border bg-background/60 px-4 py-3"
        >
          {feature.mobileHref ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push(feature.mobileHref!)}
              className="self-start active:opacity-80"
            >
              <Text className="font-semibold text-puce-red underline">{feature.title}</Text>
            </Pressable>
          ) : (
            <Text className="font-semibold text-puce-red">{feature.title}</Text>
          )}
          <Text className="mt-1 text-sm text-ink-muted">{feature.description}</Text>
        </View>
      ))}
    </View>
  );
}
