import { useQuery } from "@tanstack/react-query";
import { getUserLibraryBooks, groupBooksByShelf } from "../services/library";
import { useAuthStore } from "../store/authStore";

export function useLibrary() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["library", userId],
    queryFn: async () => {
      if (!userId) return [];
      const books = await getUserLibraryBooks(userId);
      return groupBooksByShelf(books);
    },
    enabled: Boolean(userId),
  });
}
