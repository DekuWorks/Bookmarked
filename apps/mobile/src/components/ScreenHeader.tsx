import type { ReactNode } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title: string;
  /** Show a back chevron (defaults to true). */
  back?: boolean;
  /** Optional right-aligned actions. */
  right?: ReactNode;
};

/** Plain screen header with an optional back button + title, matching mockup detail screens. */
export function ScreenHeader({ title, back = true, right }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top + 6 }}
      className="border-b border-brand-border bg-surface px-2 pb-2"
    >
      <View className="h-11 flex-row items-center">
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-primary/10"
          >
            <Text className="text-2xl text-puce-red">‹</Text>
          </Pressable>
        ) : (
          <View className="w-2" />
        )}
        <Text className="flex-1 text-lg font-bold text-puce-red" numberOfLines={1}>
          {title}
        </Text>
        {right ? <View className="flex-row items-center">{right}</View> : null}
      </View>
    </View>
  );
}
