import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text } from "react-native";
import type { OverviewQuickAction, OverviewQuickActionIcon } from "../../../../../packages/utils/overviewQuickActions";

const ICONS: Record<OverviewQuickActionIcon, ComponentProps<typeof Ionicons>["name"]> = {
  library: "library-outline",
  clubs: "people-outline",
  challenges: "trophy-outline",
};

type Props = {
  action: OverviewQuickAction;
  onPress: () => void;
};

export function QuickActionCard({ action, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      className="min-h-[108px] w-full items-center justify-center rounded-2xl border border-black/10 px-3 py-3 active:opacity-[0.82]"
      style={{
        backgroundColor: action.color,
        minHeight: 108,
        shadowColor: action.textColor,
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Ionicons
        name={ICONS[action.icon]}
        size={28}
        color={action.textColor}
        accessible={false}
        importantForAccessibility="no"
      />
      <Text
        className="mt-2 text-center text-sm font-semibold leading-snug"
        style={{ color: action.textColor }}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}
