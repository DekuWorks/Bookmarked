import { Stack } from "expo-router";
import { BACKGROUND_TINT, SURFACE } from "../../../src/constants/theme";

export default function ReaderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BACKGROUND_TINT },
        headerStyle: { backgroundColor: SURFACE },
        headerTintColor: "#642F37",
      }}
    />
  );
}
