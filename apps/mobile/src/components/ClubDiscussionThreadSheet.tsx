import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { LoadingState } from "./LoadingState";
import { ProfanityBlur } from "./ProfanityBlur";
import { SpoilerReveal } from "./SpoilerReveal";
import {
  useClubDiscussionReplies,
  useCreateReply,
  useDeleteDiscussion,
  useDeleteReply,
  useSetDiscussionLocked,
  useSetDiscussionPinned,
  useUpdateDiscussion,
  useUpdateReply,
} from "../hooks/useClubs";
import {
  useClubDiscussionRepliesRealtime,
  type ClubReplyRealtimeChange,
} from "../hooks/useClubDiscussionRepliesRealtime";
import { getReply, listReplies } from "../services/bookClubs";
import {
  CLUB_REPLY_SORT_LABEL,
  CLUB_REPLY_SORT_OPTIONS,
  CLUB_REPLY_SORT_STORAGE_KEY,
  mergeClubReplies,
  mergeReconnectClubReplies,
  parseClubReplySort,
  removeClubReply,
  sortClubReplies,
  type ClubReplySort,
} from "../../../../packages/utils/clubReplyThread";
import { formatReplyCount, isDiscussionEdited } from "../../../../packages/utils/clubDiscussionUi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { timeAgo } from "../utils";
import type {
  BookClubDiscussionWithAuthor,
  BookClubMemberRole,
} from "../types";
import {
  canModerateDiscussions,
  canPinDiscussions,
} from "../../../../packages/utils/clubPermissions";
import { showReplyActionsMenu } from "./ReplyActionsMenu";
import { showDiscussionActionsMenu } from "./DiscussionActionsMenu";
import { EditDiscussionSheet } from "./EditDiscussionSheet";

type Props = {
  visible: boolean;
  clubId: string;
  discussion: BookClubDiscussionWithAuthor | null;
  viewerId: string;
  viewerRole: BookClubMemberRole | null;
  isMember: boolean;
  /** When true, Back also leaves the club screen (deep link from Feed/share). */
  exitClubOnClose?: boolean;
  onClose: () => void;
  onDiscussionUpdated?: (discussion: BookClubDiscussionWithAuthor) => void;
  onDiscussionDeleted?: (discussionId: string) => void;
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
  exitClubOnClose = false,
  onClose,
  onDiscussionUpdated,
  onDiscussionDeleted,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const discussionId = discussion?.id ?? "";
  const replies = useClubDiscussionReplies(discussionId);
  const createReply = useCreateReply(clubId, discussionId);
  const deleteReply = useDeleteReply(clubId, discussionId);
  const updateReplyMutation = useUpdateReply(clubId, discussionId);
  const updateDiscussionMutation = useUpdateDiscussion(clubId);
  const deleteDiscussionMutation = useDeleteDiscussion(clubId);
  const pinMutation = useSetDiscussionPinned(clubId);
  const lockMutation = useSetDiscussionLocked(clubId);

  const [liveDiscussion, setLiveDiscussion] = useState(discussion);
  const [body, setBody] = useState("");
  const [spoilers, setSpoilers] = useState(false);
  const [replySort, setReplySort] = useState<ClubReplySort>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [liveReplies, setLiveReplies] = useState(replies.data ?? []);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editDiscussionOpen, setEditDiscussionOpen] = useState(false);

  useEffect(() => {
    setLiveDiscussion(discussion);
  }, [discussion]);

  useEffect(() => {
    setLiveReplies(replies.data ?? []);
  }, [replies.data]);

  useEffect(() => {
    void AsyncStorage.getItem(CLUB_REPLY_SORT_STORAGE_KEY).then((value) => {
      setReplySort(parseClubReplySort(value));
    });
  }, []);

  useEffect(() => {
    if (!visible) setSortOpen(false);
  }, [visible]);

  const sortedReplies = useMemo(
    () => sortClubReplies(liveReplies, replySort),
    [liveReplies, replySort]
  );

  const handleRealtime = useCallback(
    async (change: ClubReplyRealtimeChange) => {
      if (!discussionId) return;
      if (change.type === "delete") {
        setLiveReplies((current) => removeClubReply(current, change.id));
        return;
      }
      if (change.type === "reconnect") {
        const rows = await listReplies(discussionId);
        setLiveReplies((current) =>
          mergeReconnectClubReplies(current, rows, replySort, discussionId)
        );
        return;
      }
      const row = await getReply(change.id);
      if (!row || row.discussion_id !== discussionId) return;
      setLiveReplies((current) => mergeClubReplies(current, row, replySort));
    },
    [discussionId, replySort]
  );

  useClubDiscussionRepliesRealtime(visible ? discussionId : undefined, (change) => {
    void handleRealtime(change);
  });

  async function changeReplySort(next: ClubReplySort) {
    setReplySort(next);
    await AsyncStorage.setItem(CLUB_REPLY_SORT_STORAGE_KEY, next);
  }

  function openReplySortMenu() {
    setSortOpen(true);
  }

  const canPin = canPinDiscussions(viewerRole);
  const canModerate = canModerateDiscussions(viewerRole);
  const locked = Boolean(liveDiscussion?.is_locked);
  const showEdited = liveDiscussion ? isDiscussionEdited(liveDiscussion) : false;

  function handleBack() {
    onClose();
    if (exitClubOnClose) {
      if (router.canGoBack()) router.back();
      else router.replace("/(app)/feed" as never);
    }
  }

  async function handleReply() {
    if (!liveDiscussion || !body.trim()) return;
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
    if (result.replyId) {
      const row = await getReply(result.replyId);
      if (row) {
        setLiveReplies((current) => mergeClubReplies(current, row, replySort));
      }
    }
  }

  function confirmDeleteReply(replyId: string) {
    void deleteReply.mutateAsync(replyId).then((result) => {
      if (result.error) Alert.alert("Couldn't delete", result.error);
      else setLiveReplies((current) => removeClubReply(current, replyId));
    });
  }

  async function saveEditReply(replyId: string) {
    if (!editBody.trim()) return;
    const result = await updateReplyMutation.mutateAsync({
      replyId,
      body: editBody.trim(),
    });
    if (result.error) {
      Alert.alert("Couldn't update", result.error);
      return;
    }
    setEditingReplyId(null);
    setEditBody("");
    const row = await getReply(replyId);
    if (row) {
      setLiveReplies((current) => mergeClubReplies(current, row, replySort));
    }
  }

  async function saveEditDiscussion(values: { title: string; body: string }) {
    if (!liveDiscussion) return;
    const result = await updateDiscussionMutation.mutateAsync({
      discussionId: liveDiscussion.id,
      input: values,
    });
    if (result.error) {
      Alert.alert("Couldn't update", result.error);
      return;
    }
    const now = new Date().toISOString();
    const next = {
      ...liveDiscussion,
      title: values.title,
      body: values.body,
      updated_at: now,
      edited_at: now,
    };
    setLiveDiscussion(next);
    onDiscussionUpdated?.(next);
    setEditDiscussionOpen(false);
  }

  async function handleDeleteDiscussion() {
    if (!liveDiscussion) return;
    const result = await deleteDiscussionMutation.mutateAsync(liveDiscussion.id);
    if (result.error) {
      Alert.alert("Couldn't delete", result.error);
      return;
    }
    onDiscussionDeleted?.(liveDiscussion.id);
    onClose();
  }

  return (
    <>
    <Modal visible={visible} animationType="slide" onRequestClose={handleBack}>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-row items-center border-b border-brand-border px-2 py-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-primary/10"
          >
            <Text className="text-2xl text-puce-red">‹</Text>
          </Pressable>
          <Text className="flex-1 text-lg font-bold text-puce-red" numberOfLines={1}>
            {liveDiscussion?.title?.trim() || "Discussion"}
          </Text>
          {liveDiscussion ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Discussion options"
              onPress={() =>
                showDiscussionActionsMenu({
                  discussionId: liveDiscussion.id,
                  creatorId: liveDiscussion.user_id,
                  creatorName: authorName(liveDiscussion.author),
                  viewerId,
                  viewerRole,
                  onEdit: () => setEditDiscussionOpen(true),
                  onDelete: () => void handleDeleteDiscussion(),
                })
              }
              className="min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <Text className="text-lg font-semibold text-ink-muted">⋯</Text>
            </Pressable>
          ) : (
            <View className="w-11" />
          )}
        </View>

        {!liveDiscussion ? (
          <LoadingState message="Loading discussion…" />
        ) : (
          <FlatList
            data={sortedReplies}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View className="mb-4 rounded-2xl border border-brand-border bg-surface p-4">
                <View className="mb-2 flex-row flex-wrap gap-2">
                  {liveDiscussion.is_pinned ? (
                    <Text className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-puce-red">
                      Pinned
                    </Text>
                  ) : null}
                  {liveDiscussion.is_locked ? (
                    <Text className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-puce-red">
                      Locked
                    </Text>
                  ) : null}
                  {liveDiscussion.contains_spoilers ? (
                    <Text className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-puce-red">
                      Spoilers
                    </Text>
                  ) : null}
                  {showEdited ? (
                    <Text
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-ink-muted"
                      accessibilityLabel="Edited"
                    >
                      Edited
                    </Text>
                  ) : null}
                </View>
                <Text className="text-left text-xs text-ink-muted">
                  {authorName(liveDiscussion.author)} · {timeAgo(liveDiscussion.created_at)}
                </Text>
                <SpoilerReveal
                  enabled={liveDiscussion.contains_spoilers}
                  className="mt-3"
                >
                  <ProfanityBlur
                    text={liveDiscussion.body}
                    meta={liveDiscussion.moderation_meta ?? null}
                  >
                    <Text className="text-left leading-6 text-ink">{liveDiscussion.body}</Text>
                  </ProfanityBlur>
                </SpoilerReveal>

                {(canPin || canModerate) && isMember ? (
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {canPin ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          liveDiscussion.is_pinned ? "Unpin discussion" : "Pin discussion"
                        }
                        onPress={() =>
                          void pinMutation.mutateAsync({
                            discussionId: liveDiscussion.id,
                            isPinned: !liveDiscussion.is_pinned,
                          })
                        }
                        className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3 active:opacity-80"
                      >
                        <Text className="text-xs font-semibold text-puce-red">
                          {liveDiscussion.is_pinned ? "Unpin" : "Pin"}
                        </Text>
                      </Pressable>
                    ) : null}
                    {canModerate ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          liveDiscussion.is_locked ? "Unlock discussion" : "Lock discussion"
                        }
                        onPress={() =>
                          void lockMutation.mutateAsync({
                            discussionId: liveDiscussion.id,
                            isLocked: !liveDiscussion.is_locked,
                          })
                        }
                        className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3 active:opacity-80"
                      >
                        <Text className="text-xs font-semibold text-puce-red">
                          {liveDiscussion.is_locked ? "Unlock" : "Lock"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                <View className="mt-4 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-puce-red">
                    {formatReplyCount(sortedReplies.length)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={CLUB_REPLY_SORT_LABEL}
                    accessibilityHint="Newest First or Oldest First"
                    onPress={openReplySortMenu}
                    className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3 active:opacity-80"
                  >
                    <Text className="text-xs font-semibold text-puce-red">
                      {CLUB_REPLY_SORT_OPTIONS.find((option) => option.id === replySort)?.label}
                    </Text>
                  </Pressable>
                </View>
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
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Reply options"
                    onPress={() =>
                      showReplyActionsMenu({
                        replyId: item.id,
                        replyAuthorId: item.user_id,
                        replyAuthorName: authorName(item.author),
                        viewerId,
                        viewerRole,
                        onEdit: () => {
                          setEditingReplyId(item.id);
                          setEditBody(item.body);
                        },
                        onDelete: () => confirmDeleteReply(item.id),
                      })
                    }
                    className="min-h-[44px] justify-center px-2"
                  >
                    <Text className="text-lg font-semibold text-ink-muted">⋯</Text>
                  </Pressable>
                </View>
                {editingReplyId === item.id ? (
                  <View className="mt-2 gap-2">
                    <TextInput
                      value={editBody}
                      onChangeText={setEditBody}
                      multiline
                      className="min-h-[44px] rounded-2xl border border-brand-border bg-surface px-3 py-2 text-base text-ink"
                      style={{ textAlignVertical: "top" }}
                    />
                    <View className="flex-row gap-2">
                      <Button
                        title="Save"
                        loading={updateReplyMutation.isPending}
                        onPress={() => void saveEditReply(item.id)}
                        className="flex-1"
                      />
                      <Button
                        title="Cancel"
                        variant="ghost"
                        onPress={() => {
                          setEditingReplyId(null);
                          setEditBody("");
                        }}
                        className="flex-1"
                      />
                    </View>
                  </View>
                ) : (
                  <SpoilerReveal enabled={item.contains_spoilers} className="mt-2">
                    <ProfanityBlur text={item.body} meta={item.moderation_meta ?? null}>
                      <Text className="leading-5 text-ink">{item.body}</Text>
                    </ProfanityBlur>
                  </SpoilerReveal>
                )}
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

        {isMember && liveDiscussion && !locked ? (
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
                title={createReply.isPending ? "Checking…" : "Reply"}
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
    <Modal transparent visible={sortOpen} animationType="fade" onRequestClose={() => setSortOpen(false)}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setSortOpen(false)}>
        <Pressable className="rounded-t-3xl border border-brand-border bg-surface px-4 pb-8 pt-4">
          <Text className="mb-2 text-center text-sm font-medium text-puce-red">
            {CLUB_REPLY_SORT_LABEL}
          </Text>
          {CLUB_REPLY_SORT_OPTIONS.map((option) => {
            const active = replySort === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
                onPress={() => {
                  void changeReplySort(option.id);
                  setSortOpen(false);
                }}
                className="min-h-[44px] justify-center rounded-xl px-3 py-2 active:bg-primary/10"
              >
                <Text
                  className={`text-sm font-semibold ${
                    active ? "text-puce-red" : "text-ink-muted"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
    <EditDiscussionSheet
      visible={editDiscussionOpen}
      initialTitle={liveDiscussion?.title ?? ""}
      initialBody={liveDiscussion?.body ?? ""}
      submitting={updateDiscussionMutation.isPending}
      onClose={() => setEditDiscussionOpen(false)}
      onSubmit={saveEditDiscussion}
    />
    </>
  );
}
