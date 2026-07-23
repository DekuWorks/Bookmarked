import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDirectConversation,
  createGroupConversation,
  deleteMessage,
  getConversation,
  getConversations,
  getMessages,
  getUnreadMessageCount,
  leaveConversation,
  markConversationRead,
  pinConversation,
  sendMessage,
  toggleMessageReaction,
  unpinConversation,
  updateMessage,
} from "../services/messages";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/authStore";

export function useConversations() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["conversations", userId],
    queryFn: () => getConversations(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUnreadMessageCount() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["messages", "unread", userId],
    queryFn: () => getUnreadMessageCount(userId as string),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });
}

export function useConversation(conversationId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["conversation", conversationId, userId],
    queryFn: () => getConversation(conversationId, userId as string),
    enabled: Boolean(userId) && Boolean(conversationId),
  });
}

export function useThreadMessages(conversationId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const topic = `messages:${conversationId}`;
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          void queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient, userId]);

  return useQuery({
    queryKey: ["messages", conversationId, userId],
    queryFn: () => getMessages(conversationId, userId ?? null),
    enabled: Boolean(conversationId),
  });
}

export function useSendMessage(conversationId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      attachmentUrl,
      replyToId,
    }: {
      body: string;
      attachmentUrl?: string | null;
      replyToId?: string | null;
    }) => sendMessage(conversationId, body, attachmentUrl, replyToId),
    onSuccess: (result) => {
      if (result.error) return;
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      queryClient.invalidateQueries({ queryKey: ["messages", "unread", userId] });
    },
  });
}

export function useToggleMessageReaction(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      toggleMessageReaction(messageId, emoji),
    onSuccess: (result) => {
      if (result.error) return;
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useDeleteMessage(conversationId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: (result) => {
      if (result.error) return;
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      queryClient.invalidateQueries({ queryKey: ["messages", "unread", userId] });
    },
  });
}

export function useMarkConversationRead() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      queryClient.invalidateQueries({ queryKey: ["messages", "unread", userId] });
    },
  });
}

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (targetUserId: string) => createDirectConversation(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
    },
  });
}

export function useCreateGroupConversation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ title, userIds }: { title: string; userIds: string[] }) =>
      createGroupConversation(title, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
    },
  });
}

export function useUpdateMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      updateMessage(messageId, body),
    onSuccess: (result) => {
      if (result.error) return;
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function usePinConversation() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      pinned,
    }: {
      conversationId: string;
      pinned: boolean;
    }) => (pinned ? unpinConversation(conversationId) : pinConversation(conversationId)),
    onSuccess: (result) => {
      if (result.error) return;
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
    },
  });
}

export function useLeaveConversation() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => leaveConversation(conversationId),
    onSuccess: (result) => {
      if (result.error) return;
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
    },
  });
}
