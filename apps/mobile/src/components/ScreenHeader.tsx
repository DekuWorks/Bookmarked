import { useEffect, useMemo, type ReactNode } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveNavScreen, type NavQuery } from "../../../../packages/utils/navigationHistory";
import {
  originBackHref,
  parseNavOrigin,
  resolveOriginBack,
  UNIVERSAL_BACK_VISIBLE_LABEL,
} from "../../../../packages/utils/navigationOrigin";
import { HistoryMenuButton } from "../navigation/HistoryMenuButton";
import { useNavHistory } from "../navigation/NavHistoryProvider";

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
  const focused = useIsFocused();
  const pathname = usePathname();
  const { previous, renameCurrent } = useNavHistory();
  const params = useLocalSearchParams<{
    id?: string | string[];
    tab?: string | string[];
    origin?: string | string[];
    q?: string | string[];
    scroll?: string | string[];
    slug?: string | string[];
    section?: string | string[];
  }>();
  const screenKey = useMemo(() => {
    const search: NavQuery = {
      id: firstParam(params.id),
      tab: firstParam(params.tab),
      origin: firstParam(params.origin),
      q: firstParam(params.q),
      scroll: firstParam(params.scroll),
      slug: firstParam(params.slug),
      section: firstParam(params.section),
    };
    return resolveNavScreen("mobile", pathname, search)?.key ?? "";
  }, [params.id, params.origin, params.q, params.scroll, params.section, params.slug, params.tab, pathname]);

  useEffect(() => {
    if (focused && screenKey) renameCurrent(screenKey, title);
  }, [focused, renameCurrent, screenKey, title]);
  const origin = parseNavOrigin(firstParam(params.origin));
  const originHref = originBackHref(origin, "mobile", {
    query: firstParam(params.q),
    scroll: firstParam(params.scroll),
  });
  const explicitDestination =
    backHref || originHref ? resolveOriginBack(origin)?.label : undefined;
  const accessibleName = explicitDestination
    ? `Back to ${explicitDestination}`
    : previous[0]?.title
      ? `Back to ${previous[0].title}`
      : UNIVERSAL_BACK_VISIBLE_LABEL;

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
            accessibilityLabel={accessibleName}
            onPress={handleBack}
            className="h-11 flex-row items-center rounded-full pl-1 pr-2 active:bg-primary/10"
          >
            <Text className="text-2xl leading-none text-puce-red">‹</Text>
            <Text className="ml-0.5 text-sm font-medium text-puce-red">
              {UNIVERSAL_BACK_VISIBLE_LABEL}
            </Text>
          </Pressable>
        ) : (
          <View className="w-2" />
        )}
        {back ? <HistoryMenuButton /> : null}
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
