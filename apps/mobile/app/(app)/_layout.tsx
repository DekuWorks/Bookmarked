import { Redirect, Tabs } from "expo-router";
import { BACKGROUND_TINT } from "../../src/constants/theme";
import { LoadingState } from "../../src/components/LoadingState";
import { useProfile } from "../../src/hooks/useProfile";
import { FloatingTabBar } from "../../src/navigation/FloatingTabBar";
import { TabBarScrollProvider } from "../../src/navigation/TabBarScroll";
import { useAuthStore } from "../../src/store/authStore";

export default function AppTabsLayout() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const { data: profile, isLoading } = useProfile();

  if (!initialized || (session && isLoading)) {
    return <LoadingState />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile?.username?.trim()) {
    return <Redirect href="/(auth)/profile-setup" />;
  }

  return (
    <TabBarScrollProvider>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: BACKGROUND_TINT },
        }}
      >
        {/* Primary destinations (final mapping — IMG_5471) */}
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="feed" options={{ title: "Feed" }} />
        <Tabs.Screen name="search" options={{ title: "Search" }} />
        <Tabs.Screen name="messages" options={{ title: "Messages" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />

        {/* Secondary destinations — reached from Home links, Feed, Search, or the bell */}
        <Tabs.Screen name="library" options={{ href: null }} />
        <Tabs.Screen name="compose" options={{ href: null }} />
        <Tabs.Screen name="clubs" options={{ href: null }} />
        <Tabs.Screen name="notes" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="book" options={{ href: null }} />
        <Tabs.Screen name="series" options={{ href: null }} />
        <Tabs.Screen name="author" options={{ href: null }} />
        <Tabs.Screen name="reader" options={{ href: null }} />
        <Tabs.Screen name="shelf-privacy" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="upgrade" options={{ href: null }} />
      </Tabs>
    </TabBarScrollProvider>
  );
}
