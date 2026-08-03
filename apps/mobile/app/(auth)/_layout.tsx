import { useRef } from "react";
import { Redirect, Stack, useSegments } from "expo-router";
import { LoadingState } from "../../src/components/LoadingState";
import { useProfile } from "../../src/hooks/useProfile";
import { useAuthStore } from "../../src/store/authStore";
import { usePendingDeepLinkStore } from "../../src/store/pendingDeepLinkStore";

export default function AuthLayout() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const { data: profile, isLoading } = useProfile();
  const segments = useSegments();
  const inProfileSetup = segments.includes("profile-setup");
  const postAuthDestination = useRef<string | null>(null);

  if (!initialized || (session && isLoading)) {
    return <LoadingState />;
  }

  if (session && profile?.username?.trim()) {
    if (!postAuthDestination.current) {
      postAuthDestination.current =
        usePendingDeepLinkStore.getState().consume() ?? "/(app)";
    }
    return <Redirect href={postAuthDestination.current as never} />;
  }

  if (session && !profile?.username?.trim() && !inProfileSetup) {
    return <Redirect href="/(auth)/profile-setup" />;
  }

  if (!session && inProfileSetup) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F4EEFA" } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
