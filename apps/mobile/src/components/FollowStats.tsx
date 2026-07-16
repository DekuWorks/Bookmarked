import { Pressable, Text, View } from "react-native";
import type { FollowCounts } from "../services/follows";

type Props = {
  counts: FollowCounts;
  /** When set (other profiles), show a Mutuals count. */
  mutualsCount?: number;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
  onMutualsPress?: () => void;
  size?: "sm" | "md";
};

function StatButton({
  label,
  count,
  onPress,
  size,
}: {
  label: string;
  count: number;
  onPress: () => void;
  size: "sm" | "md";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${count} ${label}`}
      onPress={onPress}
      className={`rounded-lg active:bg-primary/10 ${size === "md" ? "px-2 py-1" : "px-1 py-0.5"}`}
    >
      <Text className="text-xs text-ink-muted">{label}</Text>
      <Text
        className={`font-semibold text-ink ${size === "md" ? "text-lg" : "text-base"}`}
      >
        {count}
      </Text>
    </Pressable>
  );
}

/** Tappable followers / following (/ mutuals) counts — mirrors web FollowStats. */
export function FollowStats({
  counts,
  mutualsCount,
  onFollowersPress,
  onFollowingPress,
  onMutualsPress,
  size = "sm",
}: Props) {
  return (
    <View className="flex-row items-start gap-6">
      <StatButton
        label="Followers"
        count={counts.followers}
        onPress={onFollowersPress}
        size={size}
      />
      <StatButton
        label="Following"
        count={counts.following}
        onPress={onFollowingPress}
        size={size}
      />
      {mutualsCount !== undefined && onMutualsPress ? (
        <StatButton
          label="Mutuals"
          count={mutualsCount}
          onPress={onMutualsPress}
          size={size}
        />
      ) : null}
    </View>
  );
}
