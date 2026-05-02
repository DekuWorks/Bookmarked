import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { BookCard } from "../components/BookCard";
import { Button } from "../components/Button";
import { ScreenContainer } from "../components/ScreenContainer";
import { ShelfBadge } from "../components/ShelfBadge";
import { supabase } from "../services/supabase";
import { useProfile } from "../hooks/useProfile";

export function HomeScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <ScreenContainer scroll>
      <View className="pt-6 pb-2">
        <Text className="text-2xl font-bold text-slate-900">
          Hello{profile?.display_name ? `, ${profile.display_name}` : ""}
        </Text>
        <Text className="text-slate-600 mt-1">Your reading home base.</Text>
      </View>

      <View className="flex-row gap-2 my-4">
        <ShelfBadge label="Want to read" />
        <ShelfBadge label="Reading" />
        <ShelfBadge label="Read" />
      </View>

      <BookCard />

      <View className="mt-8">
        <Button title="Log out" variant="ghost" onPress={signOut} />
      </View>
    </ScreenContainer>
  );
}
