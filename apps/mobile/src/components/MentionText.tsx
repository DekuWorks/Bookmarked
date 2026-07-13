import { useRouter } from "expo-router";
import { Text } from "react-native";
import { parseMentionSegments } from "../utils/mentions";

type Props = {
  body: string;
  className?: string;
};

/** Renders post/comment text with tappable @mentions (mirrors web MentionText). */
export function MentionText({ body, className }: Props) {
  const router = useRouter();
  const segments = parseMentionSegments(body);

  return (
    <Text className={className ?? "leading-5 text-ink"}>
      {segments.map((segment, index) => {
        if (segment.type === "mention") {
          return (
            <Text
              key={index}
              className="font-semibold text-puce-red"
              onPress={() => router.push(`/reader/${segment.username}`)}
            >
              @{segment.username}
            </Text>
          );
        }
        return <Text key={index}>{segment.value}</Text>;
      })}
    </Text>
  );
}
