import { Text, View } from "react-native";
import { starFills } from "../../../../packages/utils/starRatingDisplay";

type Props = {
  /** Rating out of 5, in 0.5 increments. */
  value: number;
  size?: number;
  /** Show the numeric value next to the stars. */
  showNumber?: boolean;
};

/**
 * Read-only 0.5-precision star rating. Always one unwrapped row of 5 stars.
 */
export function StarRating({ value, size = 16, showNumber }: Props) {
  const fills = starFills(value);
  const clamped = Math.max(0, Math.min(5, value));

  return (
    <View style={{ flexDirection: "row", flexWrap: "nowrap", alignItems: "center" }}>
      <View style={{ flexDirection: "row", flexWrap: "nowrap" }}>
        {fills.map((fill, index) => (
          <View key={index} style={{ width: size, height: size, marginRight: 2 }}>
            <Text style={{ fontSize: size, color: "#E0D6EA", lineHeight: size }}>☆</Text>
            {fill !== "empty" ? (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: fill === "half" ? size / 2 : size,
                  height: size,
                  overflow: "hidden",
                }}
              >
                <Text style={{ fontSize: size, color: "#F3904B", lineHeight: size }}>★</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
      {showNumber ? (
        <Text style={{ fontSize: size * 0.85 }} className="ml-2 font-semibold text-ink-muted">
          {clamped.toFixed(1)}
        </Text>
      ) : null}
    </View>
  );
}
