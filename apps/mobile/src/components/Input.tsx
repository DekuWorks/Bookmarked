import { Text, TextInput, View, type TextInputProps } from "react-native";

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, ...rest }: Props) {
  return (
    <View className="mb-3">
      <Text className="text-sm font-medium text-ink mb-1">{label}</Text>
      <TextInput
        placeholderTextColor="#A99DAE"
        className={`rounded-xl border border-brand-border bg-surface px-3 py-3 text-base text-ink ${error ? "border-rust" : ""} ${className ?? ""}`}
        {...rest}
      />
      {error ? <Text className="text-rust text-sm mt-1">{error}</Text> : null}
    </View>
  );
}
