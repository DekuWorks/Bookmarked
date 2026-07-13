import { useQuery } from "@tanstack/react-query";
import { fetchPublicFeed } from "../services/feed";
import { useAuthStore } from "../store/authStore";

export function useFeed() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["feed", userId],
    queryFn: () => fetchPublicFeed(),
    enabled: Boolean(userId),
  });
}
