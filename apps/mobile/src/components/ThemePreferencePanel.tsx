import { Alert, Pressable, Text, View } from "react-native";
import { useThemeColors, useThemeStore, type ThemePreference } from "../store/themeStore";

const OPTIONS: { id: ThemePreference; label: string; description: string }[] = [
  { id: "light", label: "Light", description: "Lavender-tinted light theme" },
  { id: "dark", label: "Dark", description: "Deep purple night mode" },
  { id: "system", label: "System", description: "Match device setting" },
];

export function ThemePreferencePanel() {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const colors = useThemeColors();

  async function handleSelect(next: ThemePreference) {
    if (next === preference) return;
    try {
      await setPreference(next);
      Alert.alert("Saved", "Appearance preference saved.");
    } catch {
      Alert.alert("Couldn't save", "Your theme preference could not be saved.");
    }
  }

  return (
    <View
      className="rounded-2xl border p-4 mb-6"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <Text className="text-base font-semibold text-puce-red">Appearance</Text>
      <Text className="mt-1 text-sm" style={{ color: colors.inkMuted }}>
        Dark mode uses rich purple tones instead of pure black.
      </Text>
      <View className="mt-3 gap-2">
        {OPTIONS.map((option) => {
          const active = preference === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => void handleSelect(option.id)}
              className="rounded-xl border px-4 py-3 active:opacity-80"
              style={{
                borderColor: active ? "#C9AED0" : colors.border,
                backgroundColor: active ? colors.background : colors.surface,
              }}
            >
              <Text className="font-semibold" style={{ color: colors.ink }}>
                {option.label}
              </Text>
              <Text className="mt-1 text-xs" style={{ color: colors.inkMuted }}>
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
