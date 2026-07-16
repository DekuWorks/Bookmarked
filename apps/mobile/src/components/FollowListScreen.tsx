import { Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { EmptyState } from "./EmptyState";
import { FollowListRow } from "./FollowListRow";
import { LoadingState } from "./LoadingState";
import { ScreenHeader } from "./ScreenHeader";
import { TAB_BAR_SPACE, useTabBarScroll } from "../navigation/TabBarScroll";
import type { FollowListUser } from "../services/follows";

type Section = {
  title: string;
  users: FollowListUser[];
  /** Muted title style for secondary “All …” sections. */
  muted?: boolean;
};

type Props = {
  title: string;
  loading: boolean;
  error?: string | null;
  emptyTitle: string;
  emptyDescription?: string;
  sections: Section[];
};

type Row =
  | { type: "header"; key: string; title: string; muted?: boolean }
  | { type: "user"; key: string; user: FollowListUser };

/** Shared followers / following / mutuals list screen shell. */
export function FollowListScreen({
  title,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  sections,
}: Props) {
  const { onScroll } = useTabBarScroll();
  const nonEmpty = sections.filter((section) => section.users.length > 0);
  const totalUsers = nonEmpty.reduce((sum, section) => sum + section.users.length, 0);

  const rows: Row[] = [];
  for (const section of nonEmpty) {
    if (nonEmpty.length > 1 || section.title) {
      rows.push({
        type: "header",
        key: `h-${section.title}`,
        title: section.title,
        muted: section.muted,
      });
    }
    for (const user of section.users) {
      rows.push({ type: "user", key: user.id, user });
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={title} />
      {loading ? (
        <LoadingState message="Loading…" />
      ) : error ? (
        <EmptyState title="Couldn't load list" description={error} />
      ) : totalUsers === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <Animated.FlatList
          data={rows}
          keyExtractor={(item) => item.key}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: TAB_BAR_SPACE,
            gap: 8,
          }}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <Text
                  className={`mb-1 mt-2 text-sm font-semibold ${
                    item.muted ? "text-ink-muted" : "text-puce-red"
                  }`}
                >
                  {item.title}
                </Text>
              );
            }
            return <FollowListRow user={item.user} />;
          }}
        />
      )}
    </View>
  );
}
