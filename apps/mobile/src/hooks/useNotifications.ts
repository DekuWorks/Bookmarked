import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications";
import { useAuthStore } from "../store/authStore";

export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => getNotifications(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUnreadNotificationCount() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["notifications", "unread", userId],
    queryFn: () => getUnreadNotificationCount(userId as string),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread", userId] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread", userId] });
    },
  });
}
