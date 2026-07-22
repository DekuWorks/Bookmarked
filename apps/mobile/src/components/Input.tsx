import { Text, TextInput, View, type TextInputProps } from "react-native";

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, ...rest }: Props) {
  return (
    <View className="mb-3">
      {label ? <Text className="mb-1.5 text-sm font-medium text-ink">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#A99DAE"
        className={`rounded-full border border-brand-border bg-surface px-4 py-3 text-base text-ink shadow-sm ${error ? "border-rust" : ""} ${className ?? ""}`}
        {...rest}
      />
      {error ? <Text className="text-rust text-sm mt-1.5">{error}</Text> : null}
    </View>
  );
}
