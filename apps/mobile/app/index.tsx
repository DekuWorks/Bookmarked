import { Redirect } from "expo-router";
import { LoadingState } from "../src/components/LoadingState";
import { useProfile } from "../src/hooks/useProfile";
import { useAuthStore } from "../src/store/authStore";

export default function Index() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (!initialized) {
    return <LoadingState message="Starting…" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (profileLoading) {
    return <LoadingState message="Loading profile…" />;
  }

  if (!profile?.username?.trim()) {
    return <Redirect href="/(auth)/profile-setup" />;
  }

  return <Redirect href="/(app)" />;
}
