import { Pressable, Text, View } from "react-native";

type Props = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
};

function InputStar({
  index,
  value,
  onChange,
  size,
}: {
  index: number;
  value: number;
  onChange: (v: number) => void;
  size: number;
}) {
  const full = value >= index;
  const half = !full && value >= index - 0.5;
  return (
    <View style={{ width: size, height: size }}>
      <Text style={{ position: "absolute", fontSize: size, color: "#E0D6EA", lineHeight: size }}>
        ★
      </Text>
      {full || half ? (
        <View style={{ position: "absolute", width: full ? size : size / 2, overflow: "hidden" }}>
          <Text style={{ fontSize: size, color: "#F3904B", lineHeight: size }}>★</Text>
        </View>
      ) : null}
      <View style={{ position: "absolute", flexDirection: "row", width: size, height: size }}>
        <Pressable
          style={{ flex: 1 }}
          accessibilityLabel={`Rate ${index - 0.5} stars`}
          onPress={() => onChange(index - 0.5)}
        />
        <Pressable
          style={{ flex: 1 }}
          accessibilityLabel={`Rate ${index} stars`}
          onPress={() => onChange(index)}
        />
      </View>
    </View>
  );
}

/** Interactive 0.5-increment star rating input (tap left/right half of a star). */
export function StarRatingInput({ value, onChange, size = 28 }: Props) {
  return (
    <View className="flex-row" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <InputStar key={i} index={i} value={value} onChange={onChange} size={size} />
      ))}
    </View>
  );
}
