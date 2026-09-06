import { forwardRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { shouldShowSearchClear } from "../../../../packages/utils/searchClear";

type Props = Omit<TextInputProps, "value" | "onChangeText"> & {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
};

export const SearchBar = forwardRef<TextInput, Props>(function SearchBar(
  { value, onChangeText, onClear, className, ...rest },
  ref
) {
  const showClear = shouldShowSearchClear(value);

  return (
    <View className="relative mb-3">
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#A99DAE"
        className={`rounded-full border border-brand-border bg-surface py-3 text-base text-ink shadow-sm ${
          showClear ? "pl-4 pr-12" : "px-4"
        } ${className ?? ""}`}
        {...rest}
      />
      {showClear ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          className="absolute bottom-0 right-1.5 top-0 w-11 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="close" size={22} color="#642F37" accessible={false} />
        </Pressable>
      ) : null}
    </View>
  );
});
