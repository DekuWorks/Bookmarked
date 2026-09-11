import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { formatReplyCount } from "../../../../packages/utils/clubDiscussionUi";
import { timeAgo } from "../utils";
import type { RecentClubDiscussion } from "../services/bookClubs";

type Props = {
  discussion: RecentClubDiscussion;
};

export function RecentDiscussionCard({ discussion }: Props) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open discussion: ${discussion.title}`}
      onPress={() =>
        router.push({
          pathname: "/(app)/clubs/[id]",
          params: {
            id: discussion.club.id,
            tab: "discussions",
            discussion: discussion.id,
          },
        } as never)
      }
      className="rounded-xl bg-background px-3 py-2 active:opacity-80"
    >
      <Text className="font-semibold text-ink" numberOfLines={1}>
        {discussion.title}
      </Text>
      <Text className="mt-0.5 text-xs text-ink-muted" numberOfLines={1}>
        {discussion.club.name}
      </Text>
      <Text className="mt-0.5 text-[11px] text-ink-muted">
        {formatReplyCount(discussion.reply_count)} · {timeAgo(discussion.latest_activity_at)}
      </Text>
    </Pressable>
  );
}
