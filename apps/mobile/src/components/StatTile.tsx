import { StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../store/themeStore";

type Props = {
  value: string | number;
  label: string;
};

/** Burgundy-tinted stat card for the Reading Room dashboard metrics row. */
export function StatTile({ value, label }: Props) {
  const colors = useThemeColors();

  return (
    <View
      className="flex-1 items-center rounded-2xl px-2 py-3"
      style={[styles.card, { backgroundColor: colors.statTile }]}
    >
      <Text className="text-2xl font-black text-puce-red">{value}</Text>
      <Text className="mt-0.5 text-center text-xs text-ink-muted">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "rgba(184, 157, 187, 0.25)",
    shadowColor: "#642F37",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
