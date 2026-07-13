import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenGradientWash } from "./ScreenGradientWash";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  /** Render the top gradient wash behind content (defaults to true). */
  wash?: boolean;
};

export function ScreenContainer({ children, scroll, className, wash = true }: Props) {
  const inner = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
      className="px-5 pt-2"
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-5 pt-2 ${className ?? ""}`}>{children}</View>
  );

  return (
    <View className="flex-1 bg-background">
      {wash ? <ScreenGradientWash /> : null}
      <SafeAreaView className={`flex-1 ${!scroll ? className ?? "" : ""}`}>{inner}</SafeAreaView>
    </View>
  );
}
