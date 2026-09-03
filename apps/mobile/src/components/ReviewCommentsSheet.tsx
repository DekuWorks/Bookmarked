import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { addReviewReply, listReviewReplies } from "../services/reviewEngagement";
import { containsProfanity } from "../utils/profanity";
import { timeAgo } from "../utils";
import type { ReviewReplyWithAuthor } from "../types";

type Props = {
  reviewId: string;
  visible: boolean;
  onClose: () => void;
};

function authorName(author: ReviewReplyWithAuthor["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

export function ReviewCommentsSheet({ reviewId, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [replies, setReplies] = useState<ReviewReplyWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setReplies(await listReviewReplies(reviewId));
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    if (visible) {
      setBody("");
      void reload();
    }
  }, [visible, reload]);

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    if (containsProfanity(trimmed)) {
      Alert.alert("Language not allowed", "Please remove profanity before commenting.");
      return;
    }
    setSending(true);
    const result = await addReviewReply(reviewId, trimmed);
    setSending(false);
    if (result.error) {
      Alert.alert("Couldn't post", result.error);
      return;
    }
    setBody("");
    await reload();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <Text className="text-xl font-bold text-puce-red">Comments</Text>
          <Pressable
            onPress={onClose}
            className="rounded-full bg-primary/15 px-4 py-2 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-puce-red">Close</Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#642F37" />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          >
            {replies.length === 0 ? (
              <Text className="mt-6 text-sm text-ink-muted">No comments yet. Add one below.</Text>
            ) : (
              replies.map((reply) => (
                <View key={reply.id} className="mb-3 flex-row gap-2">
                  <Avatar
                    url={reply.author.avatar_url}
                    name={authorName(reply.author)}
                    size={32}
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-ink">{authorName(reply.author)}</Text>
                    <Text className="mt-0.5 leading-5 text-ink">{reply.body}</Text>
                    <Text className="mt-1 text-xs text-ink-muted">{timeAgo(reply.created_at)}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        <View
          className="flex-row items-end gap-2 border-t border-brand-border px-4 py-3"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write a comment…"
            placeholderTextColor="#A99DAE"
            multiline
            className="min-h-[44px] max-h-28 flex-1 rounded-xl border border-brand-border bg-surface px-3 py-2 text-base text-ink"
          />
          <Pressable
            onPress={() => void submit()}
            disabled={sending || !body.trim()}
            className="h-11 items-center justify-center rounded-xl bg-puce-red px-4 active:opacity-80"
          >
            <Text className="font-semibold text-white">{sending ? "…" : "Send"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
