import { addBookToCustomShelf } from "@/lib/services/customShelves";
import { setBookShelfStatus } from "@/lib/actions/book";
import type { ShelfMoveDestination } from "@bookmarked/utils/shelfMove";

/**
 * Move an existing library book to a built-in shelf or custom collection.
 * Updates the current user_books row — never delete+readd.
 */
export async function moveUserBookToDestination(
  userId: string,
  bookId: string,
  destination: ShelfMoveDestination
): Promise<{ error?: string; success?: string }> {
  if (destination.kind === "builtin") {
    const formData = new FormData();
    formData.set("book_id", bookId);
    formData.set("shelf_status", destination.status);
    return setBookShelfStatus({}, formData);
  }
  const result = await addBookToCustomShelf(destination.shelfId, userId, bookId);
  if (result.error) return { error: result.error };
  return { success: "Added to collection" };
}
