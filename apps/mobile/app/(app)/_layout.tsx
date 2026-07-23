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

  if (!initialized) {
    return <LoadingState />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isLoading && !profile?.username?.trim()) {
    return <Redirect href="/(auth)/profile-setup" />;
  }

  // Keep Tabs mounted while profile loads so tab screens never render outside
  // the navigation tree (same class of bug as ThemeShell remounting nav context).
  return (
    <TabBarScrollProvider>
      <Tabs
        tabBar={(props) => (isLoading ? null : <FloatingTabBar {...props} />)}
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
        <Tabs.Screen name="reading-room" options={{ href: null }} />
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
        <Tabs.Screen name="profile-edit" options={{ href: null }} />
        <Tabs.Screen name="notification-preferences" options={{ href: null }} />
        <Tabs.Screen name="upgrade" options={{ href: null }} />
      </Tabs>
    </TabBarScrollProvider>
  );
}
