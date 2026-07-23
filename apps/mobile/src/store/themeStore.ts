import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";
import { Appearance, type ColorSchemeName } from "react-native";
import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "bookmarked_theme";

export const themeColors = {
  light: {
    background: "#F4EEFA",
    surface: "#FCFAFE",
    /** Opaque equivalent of primary/10 on background — stat cards must not show the header wash through. */
    statTile: "#F4E6F4",
    ink: "#1A1A1A",
    inkMuted: "#6B6B6B",
    border: "#E5DFEB",
    headerWash: ["#D8C7EC", "#F1D3C8", "#F4EEFA", "#F4EEFA"] as const,
  },
  dark: {
    background: "#1A1326",
    surface: "#261C34",
    statTile: "#2C2337",
    ink: "#F4EFFA",
    inkMuted: "#B5A8C4",
    border: "#3A2F4A",
    headerWash: ["#3A2850", "#2E223C", "#1A1326", "#1A1326"] as const,
  },
} as const;

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

type ThemeState = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
  syncSystem: (scheme: ColorSchemeName) => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: "system",
  resolved: resolveTheme("system"),
  hydrated: false,
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const preference =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    colorScheme.set(preference);
    set({ preference, resolved: resolveTheme(preference), hydrated: true });
  },
  setPreference: async (preference) => {
    await AsyncStorage.setItem(STORAGE_KEY, preference);
    colorScheme.set(preference);
    set({ preference, resolved: resolveTheme(preference) });
  },
  syncSystem: (scheme) => {
    if (get().preference !== "system") return;
    set({ resolved: scheme === "dark" ? "dark" : "light" });
  },
}));

export function useThemeColors() {
  const resolved = useThemeStore((state) => state.resolved);
  return themeColors[resolved];
}
