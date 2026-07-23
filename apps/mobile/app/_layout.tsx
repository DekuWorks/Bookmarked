import "../global.css";
import "react-native-gesture-handler";
import { useEffect } from "react";
import { Appearance } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_700Bold,
} from "@expo-google-fonts/geist";
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_800ExtraBold,
  PlayfairDisplay_900Black,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../src/lib/queryClient";
import { useAuthBootstrap } from "../src/hooks/useAuth";
import { useThemeStore } from "../src/store/themeStore";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: splash may already be hidden */
});

function RootLayoutNav() {
  useAuthBootstrap();
  const hydrate = useThemeStore((state) => state.hydrate);
  const syncSystem = useThemeStore((state) => state.syncSystem);

  useEffect(() => {
    void hydrate();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      syncSystem(colorScheme);
    });
    return () => subscription.remove();
  }, [hydrate, syncSystem]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_700Bold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        /* no-op */
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
