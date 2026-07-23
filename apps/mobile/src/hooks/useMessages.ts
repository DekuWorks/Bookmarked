import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDirectConversation,
  getConversation,
  getConversations,
  getMessages,
  getUnreadMessageCount,
  markConversationRead,
  sendMessage,
  toggleMessageReaction,
} from "../services/messages";
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
  return useQuery({
    queryKey: ["messages", conversationId, userId],
    queryFn: () => getMessages(conversationId, userId ?? null),
    enabled: Boolean(conversationId),
    refetchInterval: 15_000,
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
  return useMutation({
    mutationFn: (targetUserId: string) => createDirectConversation(targetUserId),
  });
}
