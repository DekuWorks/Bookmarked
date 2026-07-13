import { useQuery } from "@tanstack/react-query";
import { getUserLibraryBooks, groupBooksByShelf } from "../services/library";
import { useAuthStore } from "../store/authStore";

/** Raw user_books rows for the viewer (used by My Books filtering/sorting). */
export function useLibraryBooks() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["library", userId],
    queryFn: () => (userId ? getUserLibraryBooks(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
  });
}

/** Shelves grouped by status (used by Reading Room / other consumers). */
export function useLibrary() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["library", "grouped", userId],
    queryFn: async () => {
      if (!userId) return [];
      const books = await getUserLibraryBooks(userId);
      return groupBooksByShelf(books);
    },
    enabled: Boolean(userId),
  });
}
