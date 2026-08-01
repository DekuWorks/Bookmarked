import { Text, View } from "react-native";
import { UpgradePrompt } from "./UpgradePrompt";

type Props = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function LockedFeaturePreview({ title, description, children }: Props) {
  return (
    <View className="relative overflow-hidden rounded-2xl">
      {children ? (
        <View className="opacity-40" pointerEvents="none" accessibilityElementsHidden>
          {children}
        </View>
      ) : (
        <Text className="sr-only">{title}</Text>
      )}
      <View className={children ? "mt-3" : undefined}>
        <UpgradePrompt title={title} description={description} />
      </View>
    </View>
  );
}
