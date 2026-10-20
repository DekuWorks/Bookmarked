import { Stack } from "expo-router";
import { HistoryMenuButton } from "../../../src/navigation/HistoryMenuButton";
import { useNavStackReset } from "../../../src/navigation/useNavStackReset";

export default function ClubsLayout() {
  useNavStackReset("clubs");
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FCFAFE" },
        headerTitleStyle: { color: "#642F37", fontWeight: "700" },
        headerTintColor: "#642F37",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#F4EEFA" },
        headerRight: () => <HistoryMenuButton />,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Club", headerBackTitle: "Clubs" }} />
      <Stack.Screen name="new" options={{ title: "Start a club", headerBackTitle: "Clubs" }} />
    </Stack>
  );
}
