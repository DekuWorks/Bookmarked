import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useThemeColors } from "../store/themeStore";

type Props = Omit<TextInputProps, "secureTextEntry"> & {
  label?: string;
  error?: string;
};

export function PasswordField({
  label = "Password",
  error,
  className,
  value,
  onChangeText,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>();
  const colors = useThemeColors();

  function toggleVisibility() {
    setVisible((current) => !current);
  }

  return (
    <View className="mb-3">
      {label ? <Text className="mb-1.5 text-sm font-medium text-ink">{label}</Text> : null}
      <View
        className={`flex-row items-center rounded-full border border-brand-border bg-surface shadow-sm ${
          error ? "border-rust" : ""
        }`}
      >
        <TextInput
          {...rest}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoComplete="password"
          placeholderTextColor="#A99DAE"
          selection={selection}
          onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
          className={`min-h-[48px] flex-1 px-4 py-3 text-base text-ink ${className ?? ""}`}
        />
        <Pressable
          onPress={toggleVisibility}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          accessibilityState={{ selected: visible }}
          className="min-h-[44px] min-w-[44px] items-center justify-center pr-2"
          hitSlop={8}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.inkMuted}
            accessible={false}
          />
        </Pressable>
      </View>
      {error ? <Text className="text-rust text-sm mt-1.5">{error}</Text> : null}
    </View>
  );
}
