import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDirectConversation,
  getConversation,
  getConversations,
  getMessages,
  getUnreadMessageCount,
  markConversationRead,
  sendMessage,
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
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: Boolean(conversationId),
    refetchInterval: 15_000,
  });
}

export function useSendMessage(conversationId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body),
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
  return useMutation({
    mutationFn: (targetUserId: string) => createDirectConversation(targetUserId),
  });
}
