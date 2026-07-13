import { Text, View } from "react-native";

type Props = {
  /** Rating out of 5, in 0.5 increments. */
  value: number;
  size?: number;
  /** Show the numeric value next to the stars. */
  showNumber?: boolean;
};

/**
 * Read-only 0.5-precision star rating. Renders an empty star row with a
 * gold-filled overlay clipped to the rating width for accurate half stars.
 */
export function StarRating({ value, size = 16, showNumber }: Props) {
  const clamped = Math.max(0, Math.min(5, value));
  const widthPct = (clamped / 5) * 100;
  const stars = "★★★★★";

  return (
    <View className="flex-row items-center">
      <View style={{ position: "relative" }}>
        <Text style={{ fontSize: size, color: "#E0D6EA", letterSpacing: 2 }}>{stars}</Text>
        <View
          style={{ position: "absolute", top: 0, left: 0, width: `${widthPct}%`, overflow: "hidden" }}
        >
          <Text style={{ fontSize: size, color: "#F3904B", letterSpacing: 2 }}>{stars}</Text>
        </View>
      </View>
      {showNumber ? (
        <Text style={{ fontSize: size * 0.85 }} className="ml-2 font-semibold text-ink-muted">
          {clamped.toFixed(1)}
        </Text>
      ) : null}
    </View>
  );
}
