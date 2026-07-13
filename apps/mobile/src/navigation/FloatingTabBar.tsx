import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useTabBarScroll } from "./TabBarScroll";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * The five primary destinations, in order (final mapping from IMG_5471).
 * Icons use @expo/vector-icons Ionicons outline set (filled when focused)
 * for a consistent, native look.
 */
const PRIMARY_TABS: {
  name: string;
  label: string;
  icon: IoniconName;
  iconFocused: IoniconName;
}[] = [
  { name: "index", label: "Home", icon: "home-outline", iconFocused: "home" },
  { name: "feed", label: "Feed", icon: "newspaper-outline", iconFocused: "newspaper" },
  { name: "search", label: "Search", icon: "search-outline", iconFocused: "search" },
  { name: "messages", label: "Messages", icon: "mail-outline", iconFocused: "mail" },
  { name: "profile", label: "Profile", icon: "person-outline", iconFocused: "person" },
];

function TabItem({
  label,
  icon,
  iconFocused,
  focused,
  onPress,
  badge,
}: {
  label: string;
  icon: IoniconName;
  iconFocused: IoniconName;
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
        <Ionicons name={focused ? iconFocused : icon} size={23} color={color} />
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
            iconFocused={tab.iconFocused}
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
