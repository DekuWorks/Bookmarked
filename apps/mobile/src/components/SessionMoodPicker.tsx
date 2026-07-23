import { Pressable, Text, View } from "react-native";
import { REVIEW_FEELINGS } from "../services/reviews";

type Props = {
  value: string | null;
  onChange: (mood: string | null) => void;
  disabled?: boolean;
};

export function SessionMoodPicker({ value, onChange, disabled }: Props) {
  return (
    <View>
      <Text className="text-xs font-medium text-ink-muted">Mood</Text>
      <View className="mt-1.5 flex-row flex-wrap gap-1.5">
        {REVIEW_FEELINGS.map((feeling) => {
          const active = value === feeling;
          return (
            <Pressable
              key={feeling}
              disabled={disabled}
              onPress={() => onChange(active ? null : feeling)}
              className={`rounded-full border px-2.5 py-1 ${
                active ? "border-puce-red bg-puce-red" : "border-brand-border bg-background"
              } ${disabled ? "opacity-50" : "active:opacity-80"}`}
            >
              <Text
                className={`text-xs font-medium ${active ? "text-white" : "text-ink-muted"}`}
              >
                {feeling}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SessionMoodChip({ mood }: { mood: string }) {
  return (
    <View className="self-start rounded-full bg-primary/15 px-2 py-0.5">
      <Text className="text-xs font-medium text-puce-red">{mood}</Text>
    </View>
  );
}
