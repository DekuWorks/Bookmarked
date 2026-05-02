import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
};

export function ScreenContainer({ children, scroll, className }: Props) {
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
    <SafeAreaView className={`flex-1 bg-slate-50 ${!scroll ? className ?? "" : ""}`}>
      {inner}
    </SafeAreaView>
  );
}
