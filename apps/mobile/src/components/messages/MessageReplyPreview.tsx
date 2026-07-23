import { Image, Pressable, Text, View } from "react-native";
import { messageReplySnippet } from "../../services/messages";
import { isGiphyImageUrl } from "../../utils/giphy";
import type { MessageReplyPreview as MessageReplyPreviewType } from "../../types";

type Props = {
  reply: MessageReplyPreviewType;
  isOwn: boolean;
  compact?: boolean;
  onClear?: () => void;
};

function profileName(reply: MessageReplyPreviewType): string {
  return (
    reply.sender.display_name?.trim() ||
    reply.sender.username?.trim() ||
    "Reader"
  );
}

export function MessageReplyPreview({ reply, isOwn, compact, onClear }: Props) {
  const snippet = messageReplySnippet(reply);
  const thumbnailUrl = reply.deleted_at ? null : reply.attachment_url;
  const isGif = thumbnailUrl ? isGiphyImageUrl(thumbnailUrl) : false;

  return (
    <View
      className={`rounded-lg border-l-2 px-2.5 py-1.5 ${
        isOwn ? "border-white/70 bg-white/10" : "border-puce-red/60 bg-primary/10"
      } ${compact ? "mb-2" : "mb-1"}`}
    >
      <View className="flex-row items-center gap-2">
        <View className="min-w-0 flex-1">
          <Text
            className={`truncate text-xs font-semibold ${isOwn ? "text-white" : "text-ink"}`}
            numberOfLines={1}
          >
            {profileName(reply)}
          </Text>
          {snippet ? (
            <Text
              className={`text-xs ${isOwn ? "text-white/80" : "text-ink/70"}`}
              numberOfLines={1}
            >
              {snippet}
            </Text>
          ) : null}
        </View>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            accessibilityLabel={isGif ? "GIF" : "Photo"}
            className={`h-10 w-10 shrink-0 rounded border ${
              isOwn ? "border-white/30" : "border-brand-border"
            } ${isGif ? "bg-background/80" : ""}`}
            resizeMode={isGif ? "contain" : "cover"}
          />
        ) : null}
        {onClear ? (
          <Pressable onPress={onClear} accessibilityLabel="Cancel reply">
            <Text className={`text-[11px] ${isOwn ? "text-white/80" : "text-ink-muted"}`}>
              ✕
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
