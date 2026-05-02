import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { LoadingState } from "../../src/components/LoadingState";
import { useProfile } from "../../src/hooks/useProfile";
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
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#f8fafc" },
        tabBarActiveTintColor: "#0f172a",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌂</Text>,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>▤</Text>,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌕</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>☺</Text>,
        }}
      />
    </Tabs>
  );
}
