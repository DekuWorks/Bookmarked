import { useRouter } from "expo-router";
import { Text } from "react-native";
import { ProfanityBlur } from "./ProfanityBlur";
import { parseMentionSegments } from "../utils/mentions";

type Props = {
  body: string;
  className?: string;
  /** When false, skip profanity blur. Default true. */
  blurProfanity?: boolean;
};

/** Renders post/comment text with tappable @mentions (mirrors web MentionText). */
export function MentionText({ body, className, blurProfanity = true }: Props) {
  const router = useRouter();
  const segments = parseMentionSegments(body);

  const content = (
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

  if (!blurProfanity) return content;

  return <ProfanityBlur text={body}>{content}</ProfanityBlur>;
}
