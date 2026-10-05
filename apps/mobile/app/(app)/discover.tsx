import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DISCOVER_DESTINATIONS } from "../../../../packages/utils/discoverDestinations";
import { ScreenGradientWash } from "../../src/components/ScreenGradientWash";

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScreenGradientWash />
      <View style={{ paddingTop: insets.top + 12 }} className="px-4 pb-4">
        <Text className="text-4xl font-semibold text-puce-red">Discover</Text>
        <Text className="mt-2 text-sm text-ink-muted">
          Library, search, clubs, events, and messages.
        </Text>
      </View>
      <View className="mx-4 overflow-hidden rounded-2xl border border-brand-border bg-surface">
        {DISCOVER_DESTINATIONS.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="link"
            accessibilityLabel={item.label}
            onPress={() => router.push(item.mobileHref as never)}
            className="border-b border-brand-border px-4 py-3 active:bg-primary/10"
          >
            <Text className="font-semibold text-puce-red">{item.label}</Text>
            <Text className="text-sm text-ink-muted">{item.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
