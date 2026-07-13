import type { ReactNode } from "react";
import { Text, View } from "react-native";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <View className="items-center justify-center px-6 py-12">
      <Text className="text-lg font-semibold text-ink text-center">{title}</Text>
      {description ? (
        <Text className="text-ink-muted text-center mt-2">{description}</Text>
      ) : null}
      {action ? <View className="mt-6 w-full max-w-sm">{action}</View> : null}
    </View>
  );
}
