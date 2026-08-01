import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Avatar } from "../../src/components/Avatar";
import { FollowStats } from "../../src/components/FollowStats";
import { ProfanityBlur } from "../../src/components/ProfanityBlur";
import { PremiumBadge } from "../../src/components/PremiumBadge";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useSubscription } from "../../src/hooks/useSubscription";
import { ShelfBadge } from "../../src/components/ShelfBadge";
import { useFollowCounts } from "../../src/hooks/useFollows";
import { useProfile } from "../../src/hooks/useProfile";
import { ShelfIcon } from "../../src/components/ShelfIcon";
import type { ShelfIconId } from "../../src/constants/shelfIcons";
import { ReadingDnaSection } from "../../src/components/ReadingDnaSection";
import { PublicReviewsSection } from "../../src/components/PublicReviewsSection";

export default function ProfileRoute() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { isPremium, canAccess } = useSubscription();
  const countsQuery = useFollowCounts(profile?.id);

  const name = profile?.display_name || profile?.username || "Profile";
  const handle = profile?.username?.trim();
  const readerBase = handle ? `/reader/${encodeURIComponent(handle)}` : null;

  return (
    <ScreenContainer scroll>
      <View className="flex-row items-center justify-end pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account settings"
          onPress={() => router.push("/settings")}
          className="flex-row items-center gap-2 rounded-full border border-brand-border bg-surface px-4 py-2 active:opacity-80"
        >
          <Text className="text-base">⚙️</Text>
          <Text className="font-semibold text-puce-red">Settings</Text>
        </Pressable>
      </View>

      <View className="items-center pt-4">
        <Avatar url={profile?.avatar_url} name={name} size={88} />
        <View className="mt-4 flex-row items-center gap-2">
          <Text className="text-2xl font-bold text-ink">{name}</Text>
          {isPremium ? <PremiumBadge compact /> : null}
        </View>
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
              centered
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

      {profile?.id ? (
        <ReadingDnaSection
          userId={profile.id}
          favoriteGenres={profile?.favorite_genres ?? []}
          canAccess={canAccess}
          onUpgrade={() => router.push("/upgrade")}
        />
      ) : null}
      {profile?.id ? <PublicReviewsSection userId={profile.id} readerName={name} /> : null}

      <View className="mt-8 gap-2">
        {!isPremium ? (
          <ProfileLink icon="✨" label="Explore membership" onPress={() => router.push("/upgrade")} />
        ) : null}
        <ProfileLink shelfIconId="want_to_read" label="Library" onPress={() => router.push("/library")} />
        <ProfileLink icon="📝" label="Reading Notes" onPress={() => router.push("/notes")} />
        <ProfileLink icon="🖼" label="Quote graphics" onPress={() => router.push("/quote-graphics")} />
        <ProfileLink icon="🏁" label="Challenges" onPress={() => router.push("/challenges")} />
        <ProfileLink icon="🧬" label="Reading DNA" onPress={() => router.push("/reading-dna")} />
        <ProfileLink icon="♣️" label="Book Clubs" onPress={() => router.push("/clubs")} />
      </View>

      <View className="h-24" />
    </ScreenContainer>
  );
}

function ProfileLink({
  icon,
  shelfIconId,
  label,
  onPress,
}: {
  icon?: string;
  shelfIconId?: ShelfIconId;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface px-4 py-3 active:opacity-80"
    >
      {shelfIconId ? (
        <ShelfIcon id={shelfIconId} size="small" />
      ) : (
        <Text className="text-lg">{icon}</Text>
      )}
      <Text className="flex-1 font-medium text-ink">{label}</Text>
      <Text className="text-ink-muted">›</Text>
    </Pressable>
  );
}
