import { Pressable, ScrollView, Text, View } from "react-native";
import {
  CUSTOM_SHELF_ICON_KEYS,
  DEFAULT_CUSTOM_SHELF_ICON_KEY,
  getCustomShelfA11yLabel,
  getCustomShelfIconCatalog,
  type CustomShelfIconKey,
} from "../constants/shelfIcons";
import { ShelfIcon } from "./ShelfIcon";

type Props = {
  value: string;
  onChange: (key: CustomShelfIconKey) => void;
  disabled?: boolean;
};

export function CustomShelfIconPicker({ value, onChange, disabled }: Props) {
  const selected = CUSTOM_SHELF_ICON_KEYS.includes(value as CustomShelfIconKey)
    ? (value as CustomShelfIconKey)
    : DEFAULT_CUSTOM_SHELF_ICON_KEY;
  const catalog = getCustomShelfIconCatalog();

  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs text-ink-muted">Choose icon</Text>
      <Text className="mb-2 text-xs text-ink-muted">
        First icon is selected by default. You can change it before saving.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        {catalog.map((item) => {
          const isSelected = item.key === selected;
          return (
            <Pressable
              key={item.key}
              disabled={disabled}
              onPress={() => onChange(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={getCustomShelfA11yLabel(item.key, isSelected)}
              className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border-2 p-1 ${
                isSelected ? "border-primary bg-primary/10" : "border-brand-border bg-background"
              }`}
            >
              <ShelfIcon iconKey={item.key} size="small" />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
