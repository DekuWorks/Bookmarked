import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchHomeFeed, type FeedTab } from "../services/socialFeed";
import { toggleReviewLike } from "../services/reviewEngagement";
import { fetchReaderActivity } from "../services/feed";
import { useAuthStore } from "../store/authStore";

export type { FeedTab } from "../services/socialFeed";

export function useHomeFeed(tab: FeedTab) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["home-feed", tab, userId],
    queryFn: () => fetchHomeFeed(userId as string, tab),
    enabled: Boolean(userId),
  });
}

export function useToggleReviewLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => toggleReviewLike(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });
}

export function useReaderActivity(readerId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["reader-activity", readerId, userId],
    queryFn: () => fetchReaderActivity(readerId as string, userId as string),
    enabled: Boolean(userId) && Boolean(readerId),
  });
}
