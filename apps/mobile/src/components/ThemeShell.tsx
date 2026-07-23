import type { ReactNode } from "react";
import { View } from "react-native";
import { useThemeStore } from "../store/themeStore";

/** Applies NativeWind `dark` class from theme preference (shared key with web). */
export function ThemeShell({ children }: { children: ReactNode }) {
  const resolved = useThemeStore((state) => state.resolved);
  return (
    <View className={`flex-1 ${resolved === "dark" ? "dark" : ""}`} style={{ flex: 1 }}>
      {children}
    </View>
  );
}
