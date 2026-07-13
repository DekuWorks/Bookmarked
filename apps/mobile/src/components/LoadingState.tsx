import { ActivityIndicator, Text, View } from "react-native";

export function LoadingState({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8 bg-background">
      <ActivityIndicator size="large" color="#642F37" />
      {message ? <Text className="text-ink-muted">{message}</Text> : null}
    </View>
  );
}
