import { ActivityIndicator, Text, View } from "react-native";

export function LoadingState({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <ActivityIndicator size="large" color="#0f172a" />
      {message ? <Text className="text-slate-600">{message}</Text> : null}
    </View>
  );
}
