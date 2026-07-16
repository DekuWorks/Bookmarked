import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Avatar } from "../../src/components/Avatar";
import { Button } from "../../src/components/Button";
import { FollowStats } from "../../src/components/FollowStats";
import { ProfanityBlur } from "../../src/components/ProfanityBlur";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { ShelfBadge } from "../../src/components/ShelfBadge";
import { useFollowCounts } from "../../src/hooks/useFollows";
import { useProfile } from "../../src/hooks/useProfile";
import { supabase } from "../../src/services/supabase";

export default function ProfileRoute() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const countsQuery = useFollowCounts(profile?.id);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  const name = profile?.display_name || profile?.username || "Profile";
  const handle = profile?.username?.trim();
  const readerBase = handle ? `/reader/${encodeURIComponent(handle)}` : null;

  return (
    <ScreenContainer scroll>
      <View className="items-center pt-6">
        <Avatar url={profile?.avatar_url} name={name} size={88} />
        <Text className="text-2xl font-bold text-ink mt-4">{name}</Text>
        {profile?.username ? (
          <Text className="text-ink-muted mt-1">@{profile.username}</Text>
        ) : null}
        {countsQuery.data && readerBase ? (
          <View className="mt-4 items-center">
            <FollowStats
              counts={countsQuery.data}
              onFollowersPress={() => router.push(`${readerBase}/followers`)}
              onFollowingPress={() => router.push(`${readerBase}/following`)}
              size="md"
            />
          </View>
        ) : null}
      </View>

      {profile?.bio ? (
        <ProfanityBlur text={profile.bio} className="mt-5 px-2">
          <Text className="text-ink leading-6 text-center">{profile.bio}</Text>
        </ProfanityBlur>
      ) : null}

      {profile?.favorite_genres?.length ? (
        <View className="flex-row flex-wrap gap-2 justify-center mt-5">
          {profile.favorite_genres.map((genre) => (
            <ShelfBadge key={genre} label={genre} />
          ))}
        </View>
      ) : null}

      <View className="mt-8 gap-2">
        <ProfileLink icon="📚" label="My Books" onPress={() => router.push("/library")} />
        <ProfileLink
          icon="🔒"
          label="Shelf privacy"
          onPress={() => router.push("/shelf-privacy")}
        />
        <ProfileLink icon="📝" label="Reading Notes" onPress={() => router.push("/notes")} />
        <ProfileLink icon="♣️" label="Book Clubs" onPress={() => router.push("/clubs")} />
        <ProfileLink icon="🔔" label="Notifications" onPress={() => router.push("/notifications")} />
      </View>

      <View className="mt-8">
        <Button title="Log out" variant="ghost" onPress={signOut} />
      </View>
      <View className="h-24" />
    </ScreenContainer>
  );
}

function ProfileLink({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface px-4 py-3 active:opacity-80"
    >
      <Text className="text-lg">{icon}</Text>
      <Text className="flex-1 font-medium text-ink">{label}</Text>
      <Text className="text-ink-muted">›</Text>
    </Pressable>
  );
}
