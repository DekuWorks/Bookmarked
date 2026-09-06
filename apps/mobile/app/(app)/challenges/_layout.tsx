import { Stack } from "expo-router";

export default function ChallengesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FCFAFE" },
        headerTitleStyle: { color: "#642F37", fontWeight: "700" },
        headerTintColor: "#642F37",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#F4EEFA" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Challenge", headerBackTitle: "Challenges" }} />
      <Stack.Screen name="create" options={{ title: "Create Challenge", headerBackTitle: "Challenges" }} />
    </Stack>
  );
}
