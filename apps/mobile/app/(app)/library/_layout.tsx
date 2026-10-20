import { Stack } from "expo-router";
import { BACKGROUND_TINT } from "../../../src/constants/theme";
import { useNavStackReset } from "../../../src/navigation/useNavStackReset";

export default function LibraryLayout() {
  useNavStackReset("library");
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BACKGROUND_TINT },
      }}
    />
  );
}
