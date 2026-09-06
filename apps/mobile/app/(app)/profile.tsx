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
import { BrandChromeIcon, type BrandChromeIconName } from "../../src/components/BrandChromeIcon";
import { ShelfIcon } from "../../src/components/ShelfIcon";
import type { ShelfIconId } from "../../src/constants/shelfIcons";
import { ReadingDnaSection } from "../../src/components/ReadingDnaSection";
import { PublicReviewsSection } from "../../src/components/PublicReviewsSection";
import { PublicPostsSection } from "../../src/components/PublicPostsSection";
import { ProfileBadgeCarousel } from "../../src/components/challenges/ProfileBadgeCarousel";
import { readerProfilePath } from "../../src/lib/readerProfile";

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
      {profile?.id ? (
        <ProfileBadgeCarousel userId={profile.id} isOwner />
      ) : null}
      {profile?.id ? (
        <PublicPostsSection userId={profile.id} viewerId={profile.id} />
      ) : null}
      {profile?.id ? <PublicReviewsSection userId={profile.id} readerName={name} /> : null}

      <View className="mt-8 gap-2">
        {readerBase ? (
          <ProfileLink
            icon="👤"
            label="Public Profile"
            tone="primary"
            onPress={() => router.push(readerProfilePath(handle ?? ""))}
          />
        ) : null}
        {!isPremium ? (
          <ProfileLink icon="✨" label="Explore membership" tone="orange" onPress={() => router.push("/upgrade")} />
        ) : null}
        <ProfileLink shelfIconId="want_to_read" label="Library" tone="surface" onPress={() => router.push("/library")} />
        <ProfileLink chromeIcon="notes" label="Reading Notes" tone="primary" onPress={() => router.push("/notes")} />
        <ProfileLink icon="🏁" label="Challenges" tone="orange" onPress={() => router.push("/challenges")} />
        <ProfileLink chromeIcon="clubs" label="Book Clubs" tone="surface" onPress={() => router.push("/clubs")} />
      </View>

      <View className="h-24" />
    </ScreenContainer>
  );
}

function ProfileLink({
  icon,
  chromeIcon,
  shelfIconId,
  label,
  onPress,
  tone = "surface",
}: {
  icon?: string;
  chromeIcon?: BrandChromeIconName;
  shelfIconId?: ShelfIconId;
  label: string;
  onPress: () => void;
  tone?: "primary" | "orange" | "surface";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/15"
      : tone === "orange"
        ? "bg-royal-orange/15"
        : "bg-surface";
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[44px] flex-row items-center gap-2 rounded-2xl border border-brand-border px-4 py-3 active:opacity-80 ${toneClass}`}
    >
      {shelfIconId ? (
        <ShelfIcon id={shelfIconId} size="small" />
      ) : chromeIcon ? (
        <BrandChromeIcon name={chromeIcon} />
      ) : (
        <Text className="text-lg">{icon}</Text>
      )}
      <Text className="flex-1 font-medium text-ink">{label}</Text>
      <Text className="text-ink-muted">›</Text>
    </Pressable>
  );
}
