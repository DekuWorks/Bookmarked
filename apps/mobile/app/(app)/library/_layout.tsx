import { Stack } from "expo-router";
import { BACKGROUND_TINT } from "../../../src/constants/theme";

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BACKGROUND_TINT },
      }}
    />
  );
}
