import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Avatar } from "../../src/components/Avatar";
import { Button } from "../../src/components/Button";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ShelfBadge } from "../../src/components/ShelfBadge";
import { supabase } from "../../src/services/supabase";
import { useProfile } from "../../src/hooks/useProfile";

export default function ProfileRoute() {
  const router = useRouter();
  const { data: profile } = useProfile();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  const name = profile?.display_name || profile?.username || "Profile";

  return (
    <ScreenContainer scroll>
      <View className="items-center pt-6">
        <Avatar url={profile?.avatar_url} name={name} size={88} />
        <Text className="text-2xl font-bold text-ink mt-4">{name}</Text>
        {profile?.username ? (
          <Text className="text-ink-muted mt-1">@{profile.username}</Text>
        ) : null}
      </View>

      {profile?.bio ? (
        <Text className="text-ink mt-5 leading-6 text-center px-2">{profile.bio}</Text>
      ) : null}

      {profile?.favorite_genres?.length ? (
        <View className="flex-row flex-wrap gap-2 justify-center mt-5">
          {profile.favorite_genres.map((genre) => (
            <ShelfBadge key={genre} label={genre} />
          ))}
        </View>
      ) : null}

      <View className="mt-10">
        <Button title="Log out" variant="ghost" onPress={signOut} />
      </View>
    </ScreenContainer>
  );
}
