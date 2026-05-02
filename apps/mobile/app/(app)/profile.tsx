import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { supabase } from "../../src/services/supabase";
import { useProfile } from "../../src/hooks/useProfile";

export default function ProfileRoute() {
  const router = useRouter();
  const { data: profile } = useProfile();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <ScreenContainer scroll>
      <View className="pt-4">
        <Text className="text-2xl font-bold text-slate-900">
          {profile?.display_name || profile?.username || "Profile"}
        </Text>
        <Text className="text-slate-500 mt-1">@{profile?.username}</Text>
        {profile?.bio ? (
          <Text className="text-slate-700 mt-4 leading-6">{profile.bio}</Text>
        ) : null}
        <View className="mt-8">
          <Button title="Log out" variant="ghost" onPress={signOut} />
        </View>
      </View>
    </ScreenContainer>
  );
}
