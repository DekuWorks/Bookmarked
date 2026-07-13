import { Stack } from "expo-router";

export default function ClubsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FCFAFE" },
        headerTitleStyle: { color: "#642F37", fontWeight: "700" },
        headerTintColor: "#642F37",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#FAF8FC" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Club", headerBackTitle: "Clubs" }} />
      <Stack.Screen name="new" options={{ title: "Start a club", headerBackTitle: "Clubs" }} />
    </Stack>
  );
}
