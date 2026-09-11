import type { BookClubBookCategory } from "../types";

export const CLUB_BOOKSHELF_CATEGORIES: Array<{
  id: BookClubBookCategory;
  label: string;
  empty: string;
}> = [
  {
    id: "current_read",
    label: "Current Read",
    empty: "No current read set yet.",
  },
  {
    id: "upcoming",
    label: "Upcoming",
    empty: "No upcoming books yet.",
  },
  {
    id: "previous",
    label: "Previous",
    empty: "No previous books yet.",
  },
  {
    id: "suggested",
    label: "Suggested",
    empty: "No books have been suggested yet.",
  },
  {
    id: "optional",
    label: "Optional",
    empty: "No optional books yet.",
  },
];

export function clubBookshelfEmptyMessage(category: BookClubBookCategory): string {
  return (
    CLUB_BOOKSHELF_CATEGORIES.find((row) => row.id === category)?.empty ??
    "No books in this category yet."
  );
}

export function filterClubShelfByCategory<T extends { category: BookClubBookCategory }>(
  books: T[],
  category: BookClubBookCategory
): T[] {
  return books.filter((book) => book.category === category);
}
