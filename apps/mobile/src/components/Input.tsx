import { Text, TextInput, View, type TextInputProps } from "react-native";

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, ...rest }: Props) {
  return (
    <View className="mb-3">
      <Text className="text-sm font-medium text-slate-700 mb-1">{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        className={`rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 ${error ? "border-red-400" : ""} ${className ?? ""}`}
        {...rest}
      />
      {error ? <Text className="text-red-600 text-sm mt-1">{error}</Text> : null}
    </View>
  );
}
