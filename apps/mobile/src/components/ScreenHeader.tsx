import type { ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { originBackHref, parseNavOrigin } from "../../../../packages/utils/navigationOrigin";

type Props = {
  title: string;
  /** Show a back chevron (defaults to true). */
  back?: boolean;
  /** When set, Back goes here instead of history (origin-aware search/library). */
  backHref?: string;
  /** When history is empty, navigate here instead of a no-op back. */
  fallbackHref?: string;
  /** Optional press handler for the title (e.g. open peer profile). */
  onTitlePress?: () => void;
  /** Optional avatar shown beside the title. */
  left?: ReactNode;
  /** Optional right-aligned actions. */
  right?: ReactNode;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Plain screen header with an optional back button + title, matching mockup detail screens. */
export function ScreenHeader({
  title,
  back = true,
  fallbackHref,
  backHref,
  onTitlePress,
  left,
  right,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    origin?: string | string[];
    q?: string | string[];
    scroll?: string | string[];
  }>();
  const originHref = originBackHref(parseNavOrigin(firstParam(params.origin)), "mobile", {
    query: firstParam(params.q),
    scroll: firstParam(params.scroll),
  });

  function handleBack() {
    if (backHref) {
      router.replace(backHref as never);
      return;
    }
    if (originHref) {
      router.replace(originHref as never);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (fallbackHref) {
      router.replace(fallbackHref as never);
      return;
    }
    router.back();
  }

  return (
    <View
      style={{ paddingTop: insets.top + 6 }}
      className="bg-background px-2 pb-2"
    >
      <View className="h-11 flex-row items-center">
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-primary/10"
          >
            <Text className="text-2xl text-puce-red">‹</Text>
          </Pressable>
        ) : (
          <View className="w-2" />
        )}
        {left ? <View className="mr-2">{left}</View> : null}
        {onTitlePress ? (
          <Pressable
            onPress={onTitlePress}
            className="flex-1 active:opacity-70"
            accessibilityRole="link"
          >
            <Text className="text-lg font-bold text-puce-red" numberOfLines={1}>
              {title}
            </Text>
          </Pressable>
        ) : (
          <Text className="flex-1 text-lg font-bold text-puce-red" numberOfLines={1}>
            {title}
          </Text>
        )}
        {right ? <View className="flex-row items-center">{right}</View> : null}
      </View>
    </View>
  );
}
