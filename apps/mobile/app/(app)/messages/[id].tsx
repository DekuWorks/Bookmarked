import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingState } from "../../../src/components/LoadingState";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import {
  useConversation,
  useMarkConversationRead,
  useSendMessage,
  useThreadMessages,
} from "../../../src/hooks/useMessages";
import { conversationDisplayName } from "../../../src/services/messages";
import { useAuthStore } from "../../../src/store/authStore";

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = String(id);
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const listRef = useRef<FlatList>(null);
  const [draft, setDraft] = useState("");

  const conversation = useConversation(conversationId);
  const messages = useThreadMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkConversationRead();

  useEffect(() => {
    if (conversationId) markRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const title = conversation.data
    ? conversationDisplayName(conversation.data, userId as string)
    : "Conversation";

  async function submit() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await send.mutateAsync(body);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={title} />
      {messages.isLoading ? (
        <LoadingState message="Loading messages…" />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={90}
        >
          <FlatList
            ref={listRef}
            data={messages.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const mine = item.sender_id === userId;
              return (
                <View
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    mine ? "self-end bg-puce-red" : "self-start bg-primary/20"
                  }`}
                >
                  <Text className={mine ? "text-white" : "text-ink"}>{item.body}</Text>
                </View>
              );
            }}
          />
          <View
            className="flex-row items-end gap-2 border-t border-brand-border bg-surface px-3 pt-2"
            style={{ paddingBottom: insets.bottom + 8 }}
          >
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
              disabled={!draft.trim() || send.isPending}
              className={`h-10 items-center justify-center rounded-full px-4 ${
                draft.trim() ? "bg-puce-red" : "bg-primary/40"
              }`}
            >
              <Text className="font-semibold text-white">Send</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
