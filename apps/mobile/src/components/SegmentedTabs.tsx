import { Pressable, Text, View } from "react-native";

type Option<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
};

/** Pill-style segmented control mirroring the web `pill-tabs`. */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: Props<T>) {
  return (
    <View className={`flex-row gap-2 ${className ?? ""}`}>
      {options.map((option) => {
        const active = value === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.id)}
            className={`rounded-full px-4 py-2 ${active ? "bg-puce-red" : "bg-primary/15"}`}
          >
            <Text
              className={`text-sm font-semibold ${active ? "text-white" : "text-puce-red"}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
