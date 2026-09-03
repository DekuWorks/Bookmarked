import type { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";
import type { OverviewQuickAction, OverviewQuickActionIcon } from "../../../../../packages/utils/overviewQuickActions";

function LibraryIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 28, height: 28, flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
      <View style={{ width: 6, height: 22, borderWidth: 1.75, borderColor: color, borderRadius: 1 }} />
      <View style={{ width: 6, height: 18, borderWidth: 1.75, borderColor: color, borderRadius: 1 }} />
      <View style={{ width: 6, height: 20, borderWidth: 1.75, borderColor: color, borderRadius: 1 }} />
    </View>
  );
}

function ClubsIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "flex-end" }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.75, borderColor: color }} />
      <View
        style={{
          marginTop: 2,
          width: 16,
          height: 8,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderWidth: 1.75,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  );
}

function ChallengesIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 16,
          height: 12,
          borderWidth: 1.75,
          borderColor: color,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        }}
      />
      <View style={{ width: 2, height: 6, backgroundColor: color, marginTop: 1 }} />
      <View style={{ width: 10, height: 1.75, backgroundColor: color, marginTop: 1 }} />
    </View>
  );
}

/** waiting-on-assets: Leighton final purple chrome set. Keep these strokes until then. */
const ICONS: Record<OverviewQuickActionIcon, (props: { color: string }) => ReactElement> = {
  library: LibraryIcon,
  clubs: ClubsIcon,
  challenges: ChallengesIcon,
};

type Props = {
  action: OverviewQuickAction;
  onPress: () => void;
};

export function QuickActionCard({ action, onPress }: Props) {
  const Icon = ICONS[action.icon];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      className="w-full items-center justify-center rounded-2xl border border-black/10 px-3 py-3 active:opacity-[0.82]"
      style={{
        backgroundColor: action.color,
        minHeight: 108,
        shadowColor: action.textColor,
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View className="items-center justify-center gap-2">
        <Icon color={action.textColor} />
        <Text
          className="text-center text-sm font-semibold leading-snug"
          style={{ color: action.textColor }}
        >
          {action.label}
        </Text>
      </View>
    </Pressable>
  );
}
