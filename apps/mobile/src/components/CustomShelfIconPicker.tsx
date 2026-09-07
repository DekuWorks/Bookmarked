import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  getCustomShelfIconA11yLabel,
  getCustomShelfIconCatalog,
  resolveCustomShelfPickerSelection,
  sanitizeShelfEmoji,
  type CustomShelfIconSelection,
} from "../constants/shelfIcons";
import { ShelfIcon } from "./ShelfIcon";

type Props = {
  value: CustomShelfIconSelection;
  onChange: (next: CustomShelfIconSelection) => void;
  disabled?: boolean;
};

export function CustomShelfIconPicker({ value, onChange, disabled }: Props) {
  const selected = resolveCustomShelfPickerSelection(value);
  const catalog = getCustomShelfIconCatalog();
  const emojiSelected = selected.type === "emoji";

  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs text-ink-muted">Choose icon</Text>
      <Text className="mb-2 text-xs text-ink-muted">
        The bookmark is selected by default. You can use an emoji instead.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        keyboardShouldPersistTaps="handled"
      >
        {catalog.map((item) => {
          const isSelected = selected.type === "bookmarked" && item.key === selected.value;
          return (
            <Pressable
              key={item.key}
              disabled={disabled}
              onPress={() => onChange({ type: "bookmarked", value: item.key })}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={getCustomShelfIconA11yLabel(
                { type: "bookmarked", value: item.key },
                isSelected
              )}
              className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border-2 p-1 ${
                isSelected ? "border-primary bg-primary/10" : "border-brand-border bg-background"
              }`}
            >
              <ShelfIcon iconKey={item.key} size="small" />
            </Pressable>
          );
        })}
        <Pressable
          disabled={disabled}
          onPress={() =>
            onChange({
              type: "emoji",
              value: emojiSelected ? selected.value : "",
            })
          }
          accessibilityRole="button"
          accessibilityState={{ selected: emojiSelected, disabled }}
          accessibilityLabel={getCustomShelfIconA11yLabel(
            { type: "emoji", value: emojiSelected ? selected.value : "" },
            emojiSelected
          )}
          className={`min-h-[44px] items-center justify-center rounded-xl border-2 px-3 ${
            emojiSelected ? "border-primary bg-primary/10" : "border-brand-border bg-background"
          }`}
        >
          <Text className="text-sm font-semibold text-puce-red">
            {emojiSelected && selected.value ? `${selected.value} ` : ""}
            Use Emoji
          </Text>
        </Pressable>
      </ScrollView>
      {emojiSelected ? (
        <TextInput
          value={selected.value}
          onChangeText={(next) => {
            const sanitized = sanitizeShelfEmoji(next);
            onChange({ type: "emoji", value: sanitized ?? next });
          }}
          placeholder="Pick one emoji"
          placeholderTextColor="#A99DAE"
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="default"
          autoFocus
          editable={!disabled}
          className="mt-3 min-h-[44px] rounded-xl border border-brand-border bg-background px-3 py-2 text-lg text-ink"
          accessibilityLabel="Custom shelf emoji"
        />
      ) : null}
    </View>
  );
}
