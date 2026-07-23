import { Text, TextInput, View } from "react-native";
import { useThemeColors } from "../store/themeStore";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function FeedSearchBar({ value, onChange }: Props) {
  const colors = useThemeColors();

  return (
    <View className="relative">
      <TextInput
        accessibilityLabel="Search feed"
        placeholder="Search readers, books, or posts"
        placeholderTextColor={colors.inkMuted}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="rounded-full border border-brand-border bg-surface px-4 py-3 pr-11 text-base text-ink shadow-sm"
      />
      <View
        pointerEvents="none"
        className="absolute right-4 top-0 bottom-0 justify-center"
      >
        <Text className="text-base text-ink-muted">🔍</Text>
      </View>
    </View>
  );
}
