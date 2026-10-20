import { Stack } from "expo-router";
import { useNavStackReset } from "../../../src/navigation/useNavStackReset";

export default function ChallengesLayout() {
  useNavStackReset("challenges");
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F4EEFA" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ headerShown: false }} />
    </Stack>
  );
}
