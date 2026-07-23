import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AttachmentImage } from "../../../src/components/AttachmentImage";
import { Avatar } from "../../../src/components/Avatar";
import { showContentActions } from "../../../src/components/ContentActions";
import { GifPicker } from "../../../src/components/GifPicker";
import { GroupSettingsSheet } from "../../../src/components/messages/GroupSettingsSheet";
import { LoadingState } from "../../../src/components/LoadingState";
import { MessageReactionPicker } from "../../../src/components/messages/MessageReactionPicker";
import { MessageReplyPreview } from "../../../src/components/messages/MessageReplyPreview";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { MESSAGE_QUICK_REACTIONS } from "../../../src/constants/messageReactions";
import {
  useConversation,
  useDeleteMessage,
  useMarkConversationRead,
  usePinConversation,
  useSendMessage,
  useThreadMessages,
  useToggleMessageReaction,
  useUpdateMessage,
} from "../../../src/hooks/useMessages";
import { conversationDisplayName } from "../../../src/services/messages";
import { pickImageFromLibrary, uploadMessageAttachment } from "../../../src/services/storage";
import { containsProfanity } from "../../../src/utils/profanity";
import { useAuthStore } from "../../../src/store/authStore";
import type { MessageReactionSummary, MessageWithSender } from "../../../src/types";

function profileName(message: MessageWithSender): string {
  return (
    message.sender.display_name?.trim() ||
    message.sender.username?.trim() ||
    "Reader"
  );
}

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = String(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const listRef = useRef<FlatList>(null);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [reactionPicker, setReactionPicker] = useState<{
    messageId: string;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const conversation = useConversation(conversationId);
  const messages = useThreadMessages(conversationId);
  const send = useSendMessage(conversationId);
  const toggleReaction = useToggleMessageReaction(conversationId);
  const deleteMsg = useDeleteMessage(conversationId);
  const updateMsg = useUpdateMessage(conversationId);
  const markRead = useMarkConversationRead();
  const pinConversation = usePinConversation();

  useEffect(() => {
    if (conversationId) markRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const title = conversation.data
    ? conversationDisplayName(conversation.data, userId as string)
    : "Conversation";

  const isGroup = conversation.data?.type === "group";
  const groupAvatarUrl = isGroup ? conversation.data?.avatar_url : null;
  const isPinned = Boolean(conversation.data?.viewerPinnedAt);

  const peer =
    conversation.data?.type === "direct"
      ? conversation.data.participants.find((p) => p.user_id !== userId)
      : null;
  const peerUsername = peer?.profile.username?.trim() || null;

  const headerHeight = insets.top + 58;

  async function attachImage() {
    const result = await pickImageFromLibrary();
    if (result.canceled) return;
    if (result.error || !result.image) {
      Alert.alert("Couldn't attach image", result.error ?? "Please try again.");
      return;
    }
    setUploading(true);
    const upload = await uploadMessageAttachment(conversationId, result.image);
    setUploading(false);
    if (upload.error || !upload.url) {
      Alert.alert("Upload failed", upload.error ?? "Please try again.");
      return;
    }
    setAttachment(upload.url);
  }

  async function submit() {
    const body = draft.trim();
    if (!body && !attachment) return;
    if (containsProfanity(body)) {
      Alert.alert("Language not allowed", "Please remove profanity before sending.");
      return;
    }
    setDraft("");
    const pendingAttachment = attachment;
    const pendingReplyTo = replyTo?.id ?? null;
    setAttachment(null);
    setReplyTo(null);
    await send.mutateAsync({
      body,
      attachmentUrl: pendingAttachment,
      replyToId: pendingReplyTo,
    });
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  async function saveEdit(messageId: string) {
    const body = editDraft.trim();
    if (!body) {
      Alert.alert("Message cannot be empty");
      return;
    }
    const result = await updateMsg.mutateAsync({ messageId, body });
    if (result.error) {
      Alert.alert("Couldn't edit message", result.error);
      return;
    }
    setEditingId(null);
    setEditDraft("");
  }

  function handlePinToggle() {
    void pinConversation.mutateAsync(
      { conversationId, pinned: isPinned },
      {
        onSuccess: (result) => {
          if (result.error) Alert.alert("Couldn't update pin", result.error);
        },
      }
    );
  }

  function openMessageActions(message: MessageWithSender) {
    const mine = message.sender_id === userId;
    const options = mine
      ? ["Reply", "Edit", "Delete", "More reactions", ...MESSAGE_QUICK_REACTIONS, "Cancel"]
      : ["Reply", "Report", "More reactions", ...MESSAGE_QUICK_REACTIONS, "Cancel"];
    const cancelButtonIndex = options.length - 1;

    const onSelect = (index: number) => {
      if (index === cancelButtonIndex) return;
      if (index === 0) {
        setReplyTo(message);
        return;
      }
      if (!mine && index === 1) {
        showContentActions({
          contentType: "message",
          contentId: message.id,
          reportedUserId: message.sender_id,
          reportedUserName: profileName(message),
        });
        return;
      }
      if (mine && index === 1) {
        setEditingId(message.id);
        setEditDraft(message.body);
        return;
      }
      if (mine && index === 2) {
        Alert.alert("Delete message?", "This cannot be undone.", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => void deleteMsg.mutateAsync(message.id),
          },
        ]);
        return;
      }
      const moreReactionsIndex = mine ? 3 : 2;
      if (index === moreReactionsIndex) {
        setReactionPicker({ messageId: message.id });
        return;
      }
      const reactionIndex = mine ? index - 4 : index - 3;
      const emoji = MESSAGE_QUICK_REACTIONS[reactionIndex];
      if (!emoji) return;
      void toggleReaction.mutateAsync({ messageId: message.id, emoji });
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex: mine ? 2 : undefined,
        },
        onSelect
      );
      return;
    }

    Alert.alert("Message", undefined, [
      { text: "Reply", onPress: () => setReplyTo(message) },
      ...(!mine
        ? [
            {
              text: "Report",
              onPress: () =>
                showContentActions({
                  contentType: "message",
                  contentId: message.id,
                  reportedUserId: message.sender_id,
                  reportedUserName: profileName(message),
                }),
            },
          ]
        : []),
      ...(mine
        ? [
            {
              text: "Edit",
              onPress: () => {
                setEditingId(message.id);
                setEditDraft(message.body);
              },
            },
            {
              text: "Delete",
              style: "destructive" as const,
              onPress: () =>
                Alert.alert("Delete message?", "This cannot be undone.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => void deleteMsg.mutateAsync(message.id),
                  },
                ]),
            },
          ]
        : []),
      {
        text: "More reactions",
        onPress: () => setReactionPicker({ messageId: message.id }),
      },
      ...MESSAGE_QUICK_REACTIONS.map((emoji) => ({
        text: emoji,
        onPress: () => void toggleReaction.mutateAsync({ messageId: message.id, emoji }),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  const canSend = (draft.trim().length > 0 || Boolean(attachment)) && !uploading && !send.isPending;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={title}
        onTitlePress={
          peerUsername ? () => router.push(`/reader/${peerUsername}`) : undefined
        }
        left={isGroup ? <Avatar url={groupAvatarUrl} name={title} size={32} /> : undefined}
        right={
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={handlePinToggle}
              accessibilityLabel={isPinned ? "Unpin conversation" : "Pin conversation"}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-primary/10"
            >
              <Text className={`text-base ${isPinned ? "text-royal-orange" : "text-ink-muted"}`}>
                📌
              </Text>
            </Pressable>
            {isGroup ? (
              <Pressable
                onPress={() => setGroupSettingsOpen(true)}
                accessibilityLabel="Group settings"
                className="h-10 w-10 items-center justify-center rounded-full active:bg-primary/10"
              >
                <Text className="text-base text-ink-muted">⚙️</Text>
              </Pressable>
            ) : null}
          </View>
        }
      />
      {messages.isLoading ? (
        <LoadingState message="Loading messages…" />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={headerHeight}
        >
          <FlatList
            ref={listRef}
            data={messages.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const mine = item.sender_id === userId;
              const isEditing = editingId === item.id;
              const edited =
                item.updated_at && item.updated_at !== item.created_at;

              return (
                <Pressable
                  onLongPress={() => openMessageActions(item)}
                  className={`max-w-[80%] ${mine ? "self-end" : "self-start"}`}
                >
                  {!isEditing && item.reply_to ? (
                    <MessageReplyPreview reply={item.reply_to} isOwn={mine} />
                  ) : null}
                  <View
                    className={`rounded-2xl px-3 py-2 ${
                      mine ? "bg-puce-red" : "bg-primary/20"
                    }`}
                  >
                    {isEditing ? (
                      <View className="gap-2">
                        <TextInput
                          value={editDraft}
                          onChangeText={setEditDraft}
                          multiline
                          className="min-h-[60px] rounded-xl border border-white/30 bg-white/10 px-2 py-1 text-white"
                        />
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => void saveEdit(item.id)}
                            className="rounded-full bg-white/20 px-3 py-1"
                          >
                            <Text className="text-xs font-semibold text-white">Save</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setEditingId(null);
                              setEditDraft("");
                            }}
                            className="rounded-full bg-white/10 px-3 py-1"
                          >
                            <Text className="text-xs text-white/80">Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <>
                        {item.attachment_url ? (
                          <View className="mb-1 w-52">
                            <AttachmentImage url={item.attachment_url} compact />
                          </View>
                        ) : null}
                        {item.body ? (
                          <Text className={mine ? "text-white" : "text-ink"}>{item.body}</Text>
                        ) : null}
                        {edited ? (
                          <Text
                            className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-ink/50"}`}
                          >
                            edited
                          </Text>
                        ) : null}
                      </>
                    )}
                  </View>
                  {item.reactions?.length ? (
                    <View className={`mt-1 flex-row flex-wrap gap-1 ${mine ? "justify-end" : ""}`}>
                      {item.reactions.map((reaction: MessageReactionSummary) => (
                        <Pressable
                          key={reaction.emoji}
                          onPress={() =>
                            void toggleReaction.mutateAsync({
                              messageId: item.id,
                              emoji: reaction.emoji,
                            })
                          }
                          className={`rounded-full border px-2 py-0.5 ${
                            reaction.viewer_reacted
                              ? "border-puce-red/40 bg-puce-red/10"
                              : "border-brand-border bg-surface"
                          }`}
                        >
                          <Text className="text-xs">
                            {reaction.emoji} {reaction.count}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
          />

          <View
            className="border-t border-brand-border bg-surface px-3 pt-2"
            style={{ paddingBottom: insets.bottom + 8 }}
          >
            {replyTo ? (
              <MessageReplyPreview
                reply={{
                  id: replyTo.id,
                  sender_id: replyTo.sender_id,
                  body: replyTo.body,
                  attachment_url: replyTo.attachment_url,
                  deleted_at: replyTo.deleted_at,
                  sender: replyTo.sender,
                }}
                isOwn={false}
                compact
                onClear={() => setReplyTo(null)}
              />
            ) : null}
            {attachment ? (
              <View className="mb-2 flex-row items-center gap-2">
                <Image
                  source={{ uri: attachment }}
                  style={{ width: 56, height: 56, borderRadius: 8 }}
                />
                <Pressable onPress={() => setAttachment(null)}>
                  <Text className="text-xs text-rust">Remove</Text>
                </Pressable>
              </View>
            ) : null}
            <View className="flex-row items-end gap-2">
              <Pressable
                onPress={attachImage}
                disabled={uploading || Boolean(attachment)}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary/15 active:opacity-70"
              >
                <Text className="text-base">🖼️</Text>
              </Pressable>
              <Pressable
                onPress={() => setGifOpen(true)}
                disabled={Boolean(attachment)}
                className="h-10 items-center justify-center rounded-full bg-primary/15 px-3 active:opacity-70"
              >
                <Text className="text-xs font-bold text-puce-red">GIF</Text>
              </Pressable>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Message…"
                placeholderTextColor="#A99DAE"
                multiline
                className="max-h-28 flex-1 rounded-2xl border border-brand-border bg-background px-3 py-2 text-base text-ink"
              />
              <Pressable
                onPress={submit}
                disabled={!canSend}
                className={`h-10 items-center justify-center rounded-full px-4 ${
                  canSend ? "bg-puce-red" : "bg-primary/40"
                }`}
              >
                <Text className="font-semibold text-white">{uploading ? "…" : "Send"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <GifPicker visible={gifOpen} onClose={() => setGifOpen(false)} onSelect={setAttachment} />

      {reactionPicker ? (
        <MessageReactionPicker
          visible
          onClose={() => setReactionPicker(null)}
          onSelect={(emoji) => {
            void toggleReaction.mutateAsync({
              messageId: reactionPicker.messageId,
              emoji,
            });
            setReactionPicker(null);
          }}
        />
      ) : null}

      {conversation.data && userId ? (
        <GroupSettingsSheet
          visible={groupSettingsOpen}
          conversation={conversation.data}
          currentUserId={userId}
          onClose={() => setGroupSettingsOpen(false)}
          onUpdated={() => {
            void conversation.refetch();
          }}
        />
      ) : null}
    </View>
  );
}
