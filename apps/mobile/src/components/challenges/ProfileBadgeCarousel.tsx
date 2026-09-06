import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { badgeA11yLabel } from "../../../../../packages/utils/challengeBadges";
import { listUserBadges, setBadgeFeatured } from "../../services/challenges/ChallengeBadgeService";

type Badge = {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  featured: boolean;
  awardedAt: string;
};

export function ProfileBadgeCarousel({
  userId,
  isOwner,
  featuredOnly = false,
}: {
  userId: string;
  isOwner: boolean;
  featuredOnly?: boolean;
}) {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    void listUserBadges(userId, featuredOnly && !isOwner).then(setBadges);
  }, [userId, featuredOnly, isOwner]);

  if (!badges.length) return null;

  return (
    <View className="mt-6">
      <Text className="text-lg font-semibold text-puce-red">Badges</Text>
      <ScrollView horizontal accessibilityLabel="Badge carousel" className="mt-3">
        {badges.map((badge) => (
          <View
            key={badge.id}
            className="mr-3 w-40 rounded-xl border border-brand-border bg-surface p-3"
            accessibilityLabel={badgeA11yLabel(badge.title, badge.featured)}
          >
            <Text className="font-medium text-puce-red">{badge.title}</Text>
            <Text className="mt-1 text-xs text-ink-muted">{badge.description}</Text>
            {isOwner ? (
              <Pressable
                onPress={() => {
                  void setBadgeFeatured(badge.id, !badge.featured).then(() =>
                    setBadges((current) =>
                      current.map((row) =>
                        row.id === badge.id ? { ...row, featured: !row.featured } : row
                      )
                    )
                  );
                }}
              >
                <Text className="mt-2 text-xs font-medium text-primary">
                  {badge.featured ? "Unfeature" : "Feature"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
