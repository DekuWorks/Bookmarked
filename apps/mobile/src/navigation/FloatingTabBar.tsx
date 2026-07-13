import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useTabBarScroll } from "./TabBarScroll";

/** The five primary destinations, in order (final mapping from IMG_5471). */
const PRIMARY_TABS: { name: string; label: string; icon: string }[] = [
  { name: "index", label: "Home", icon: "⌂" },
  { name: "feed", label: "Feed", icon: "❋" },
  { name: "search", label: "Search", icon: "⌕" },
  { name: "messages", label: "Messages", icon: "✉" },
  { name: "profile", label: "Profile", icon: "☺" },
];

function TabItem({
  label,
  icon,
  focused,
  onPress,
  badge,
}: {
  label: string;
  icon: string;
  focused: boolean;
  onPress: () => void;
  badge?: boolean;
}) {
  const color = focused ? "#642F37" : "#B89DBB";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-1 items-center justify-center py-1"
    >
      <View>
        <Text style={{ color, fontSize: 22 }}>{icon}</Text>
        {badge ? (
          <View className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-white bg-rust" />
        ) : null}
      </View>
      <Text style={{ color }} className="mt-0.5 text-[11px] font-medium">
        {label}
      </Text>
    </Pressable>
  );
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { floating } = useTabBarScroll();
  const { data: unreadMessages = 0 } = useUnreadMessageCount();

  const activeName = state.routes[state.index]?.name;

  const containerStyle = useAnimatedStyle(() => {
    return {
      left: interpolate(floating.value, [0, 1], [0, 16]),
      right: interpolate(floating.value, [0, 1], [0, 16]),
      bottom: interpolate(floating.value, [0, 1], [0, insets.bottom + 8]),
      borderRadius: interpolate(floating.value, [0, 1], [0, 28]),
      paddingBottom: interpolate(floating.value, [0, 1], [insets.bottom + 6, 10]),
      backgroundColor: interpolateColor(
        floating.value,
        [0, 1],
        ["#FCFAFE", "rgba(252,250,254,0.92)"]
      ),
      shadowOpacity: interpolate(floating.value, [0, 1], [0.05, 0.18]),
      borderTopWidth: interpolate(floating.value, [0, 1], [1, 0]),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          paddingTop: 8,
          flexDirection: "row",
          borderTopColor: "#E5DFEB",
          shadowColor: "#642F37",
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        },
        containerStyle,
      ]}
    >
      {PRIMARY_TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        if (!route) return null;
        const focused = activeName === tab.name;
        return (
          <TabItem
            key={tab.name}
            label={tab.label}
            icon={tab.icon}
            focused={focused}
            badge={tab.name === "messages" && unreadMessages > 0}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          />
        );
      })}
    </Animated.View>
  );
}
