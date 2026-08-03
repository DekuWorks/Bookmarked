import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { LoadingState } from "./LoadingState";
import { ProfanityBlur } from "./ProfanityBlur";
import { SpoilerReveal } from "./SpoilerReveal";
import {
  useClubDiscussionReplies,
  useCreateReply,
  useDeleteReply,
  useSetDiscussionLocked,
  useSetDiscussionPinned,
} from "../hooks/useClubs";
import { timeAgo } from "../utils";
import type {
  BookClubDiscussionWithAuthor,
  BookClubMemberRole,
} from "../types";
import {
  canModerateDiscussions,
  canPinDiscussions,
} from "../../../../packages/utils/clubPermissions";

type Props = {
  visible: boolean;
  clubId: string;
  discussion: BookClubDiscussionWithAuthor | null;
  viewerId: string;
  viewerRole: BookClubMemberRole | null;
  isMember: boolean;
  onClose: () => void;
};

function authorName(author: {
  display_name: string | null;
  username: string | null;
}): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

export function ClubDiscussionThreadSheet({
  visible,
  clubId,
  discussion,
  viewerId,
  viewerRole,
  isMember,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const discussionId = discussion?.id ?? "";
  const replies = useClubDiscussionReplies(discussionId);
  const createReply = useCreateReply(clubId, discussionId);
  const deleteReply = useDeleteReply(clubId, discussionId);
  const pinMutation = useSetDiscussionPinned(clubId);
  const lockMutation = useSetDiscussionLocked(clubId);

  const [body, setBody] = useState("");
  const [spoilers, setSpoilers] = useState(false);

  const canPin = canPinDiscussions(viewerRole);
  const canModerate = canModerateDiscussions(viewerRole);
  const locked = Boolean(discussion?.is_locked);

  async function handleReply() {
    if (!discussion || !body.trim()) return;
    const result = await createReply.mutateAsync({
      body: body.trim(),
      containsSpoilers: spoilers,
    });
    if (result.error) {
      Alert.alert("Couldn't reply", result.error);
      return;
    }
    setBody("");
    setSpoilers(false);
  }

  function confirmDeleteReply(replyId: string) {
    Alert.alert("Delete reply?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteReply.mutateAsync(replyId).then((result) => {
            if (result.error) Alert.alert("Couldn't delete", result.error);
          });
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-row items-center justify-between border-b border-brand-border px-4 py-3">
          <Text className="flex-1 text-lg font-bold text-puce-red" numberOfLines={1}>
            {discussion?.title?.trim() || "Discussion"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close discussion thread"
            onPress={onClose}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary/15 px-3 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-puce-red">Close</Text>
          </Pressable>
        </View>

        {!discussion ? (
          <LoadingState message="Loading discussion…" />
        ) : (
          <FlatList
            data={replies.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View className="mb-4 rounded-2xl border border-brand-border bg-surface p-4">
                <View className="mb-2 flex-row flex-wrap gap-2">
                  {discussion.is_pinned ? (
                    <Text className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-puce-red">
                      Pinned
                    </Text>
                  ) : null}
                  {discussion.is_locked ? (
                    <Text className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-puce-red">
                      Locked
                    </Text>
                  ) : null}
                  {discussion.contains_spoilers ? (
                    <Text className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-puce-red">
                      Spoilers
                    </Text>
                  ) : null}
                </View>
                <Text className="text-left text-xs text-ink-muted">
                  {authorName(discussion.author)} · {timeAgo(discussion.created_at)}
                </Text>
                <SpoilerReveal
                  enabled={discussion.contains_spoilers}
                  className="mt-3"
                >
                  <ProfanityBlur text={discussion.body}>
                    <Text className="text-left leading-6 text-ink">{discussion.body}</Text>
                  </ProfanityBlur>
                </SpoilerReveal>

                {(canPin || canModerate) && isMember ? (
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {canPin ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          discussion.is_pinned ? "Unpin discussion" : "Pin discussion"
                        }
                        onPress={() =>
                          void pinMutation.mutateAsync({
                            discussionId: discussion.id,
                            isPinned: !discussion.is_pinned,
                          })
                        }
                        className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3 active:opacity-80"
                      >
                        <Text className="text-xs font-semibold text-puce-red">
                          {discussion.is_pinned ? "Unpin" : "Pin"}
                        </Text>
                      </Pressable>
                    ) : null}
                    {canModerate ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          discussion.is_locked ? "Unlock discussion" : "Lock discussion"
                        }
                        onPress={() =>
                          void lockMutation.mutateAsync({
                            discussionId: discussion.id,
                            isLocked: !discussion.is_locked,
                          })
                        }
                        className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3 active:opacity-80"
                      >
                        <Text className="text-xs font-semibold text-puce-red">
                          {discussion.is_locked ? "Unlock" : "Lock"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                <Text className="mt-4 text-sm font-semibold text-puce-red">
                  Replies ({discussion.reply_count})
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className="mb-3 rounded-2xl border border-brand-border bg-surface p-3">
                <View className="flex-row items-center gap-2">
                  <Avatar
                    url={item.author.avatar_url}
                    name={authorName(item.author)}
                    size={28}
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                      {authorName(item.author)}
                    </Text>
                    <Text className="text-[11px] text-ink-muted">
                      {timeAgo(item.created_at)}
                    </Text>
                  </View>
                  {item.user_id === viewerId ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Delete reply"
                      onPress={() => confirmDeleteReply(item.id)}
                      className="min-h-[44px] justify-center px-2"
                    >
                      {deleteReply.isPending ? (
                        <ActivityIndicator size="small" color="#642F37" />
                      ) : (
                        <Text className="text-xs font-semibold text-puce-red">Delete</Text>
                      )}
                    </Pressable>
                  ) : null}
                </View>
                <SpoilerReveal enabled={item.contains_spoilers} className="mt-2">
                  <ProfanityBlur text={item.body}>
                    <Text className="leading-5 text-ink">{item.body}</Text>
                  </ProfanityBlur>
                </SpoilerReveal>
              </View>
            )}
            ListEmptyComponent={
              replies.isLoading ? (
                <LoadingState message="Loading replies…" />
              ) : (
                <Text className="py-4 text-center text-sm text-ink-muted">
                  No replies yet.
                </Text>
              )
            }
          />
        )}

        {isMember && discussion && !locked ? (
          <View className="border-t border-brand-border px-4 pt-3">
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Write a reply…"
              placeholderTextColor="#A99DAE"
              multiline
              accessibilityLabel="Reply body"
              className="min-h-[44px] rounded-2xl border border-brand-border bg-surface px-4 py-3 text-base text-ink"
              style={{ textAlignVertical: "top" }}
            />
            <View className="mt-2 flex-row items-center justify-between">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: spoilers }}
                accessibilityLabel="Contains spoilers"
                onPress={() => setSpoilers((value) => !value)}
                className="min-h-[44px] flex-row items-center gap-2 px-1"
              >
                <View
                  className={`h-5 w-5 rounded border ${
                    spoilers ? "border-puce-red bg-puce-red" : "border-brand-border"
                  }`}
                />
                <Text className="text-sm text-ink">Spoilers</Text>
              </Pressable>
              <Button
                title="Reply"
                variant="primary"
                loading={createReply.isPending}
                disabled={!body.trim()}
                onPress={() => void handleReply()}
                className="min-w-[110px]"
              />
            </View>
          </View>
        ) : locked ? (
          <View className="border-t border-brand-border px-4 py-4">
            <Text className="text-center text-sm text-ink-muted">
              This discussion is locked.
            </Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
