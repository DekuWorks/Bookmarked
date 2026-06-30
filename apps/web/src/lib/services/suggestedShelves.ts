import { listUserCustomShelves } from "@/lib/services/customShelves";
import { getUserLibraryBooks, type LibraryBookRow } from "@/lib/services/library";
import type { ShelfStatus } from "@/types";

export type SuggestedShelf = {
  name: string;
  genre: string | null;
  reason: string;
  matchCount: number;
};

export type MatchingBook = {
  id: string;
  title: string;
  author: string | null;
  cover: string | null;
  shelf_status: ShelfStatus;
};

export type SuggestionMatchingBooks = {
  matchingBooks: MatchingBook[];
  unreadMatches: MatchingBook[];
  readMatches: MatchingBook[];
  currentlyReadingMatches: MatchingBook[];
};

const TEMPLATE_SHELVES: Omit<SuggestedShelf, "matchCount">[] = [
  { name: "DNF", genre: null, reason: "Did not finish" },
  { name: "Summer reads", genre: "Seasonal", reason: "Popular collection" },
  { name: "Book club picks", genre: "Book club", reason: "Popular collection" },
  { name: "Comfort reads", genre: null, reason: "Popular collection" },
  { name: "TBR overflow", genre: null, reason: "Extra to-read shelf" },
];

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function genreTokens(genre: string | null): string[] {
  if (!genre) return [];
  return genre
    .split(/[,;/&]+/)
    .map(normalizeToken)
    .filter(Boolean);
}

function subjectCounts(books: LibraryBookRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of books) {
    for (const subject of row.books?.subjects ?? []) {
      const key = subject.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

/** Book IDs from the user's library that overlap the shelf genre/subject tag. */
export function matchingLibraryBookIds(
  books: LibraryBookRow[],
  genre: string | null
): string[] {
  const tokens = genreTokens(genre);
  if (!tokens.length) return [];

  const matched = new Set<string>();
  for (const row of books) {
    const bookId = row.books?.id;
    if (!bookId) continue;

    const subjects = (row.books?.subjects ?? []).map(normalizeToken);
    const hit = tokens.some((token) =>
      subjects.some(
        (subject) =>
          subject === token || subject.includes(token) || token.includes(subject)
      )
    );

    if (hit) matched.add(bookId);
  }

  return [...matched];
}

export function countMatchingLibraryBooks(
  books: LibraryBookRow[],
  genre: string | null
): number {
  return matchingLibraryBookIds(books, genre).length;
}

function libraryRowToMatchingBook(row: LibraryBookRow): MatchingBook | null {
  const book = row.books;
  if (!book?.id) return null;
  return {
    id: book.id,
    title: book.title ?? "Untitled",
    author: book.author,
    cover: book.cover_url,
    shelf_status: row.shelf_status,
  };
}

/** Group library rows that match a suggestion by shelf status. */
export function getMatchingBooksFromLibrary(
  books: LibraryBookRow[],
  genre: string | null
): SuggestionMatchingBooks {
  const ids = new Set(matchingLibraryBookIds(books, genre));
  const matchingBooks = books
    .filter((row) => row.books?.id && ids.has(row.books.id))
    .map(libraryRowToMatchingBook)
    .filter((book): book is MatchingBook => book !== null);

  const unreadMatches = matchingBooks.filter(
    (book) =>
      book.shelf_status === "want_to_read" || book.shelf_status === "currently_reading"
  );
  const readMatches = matchingBooks.filter((book) => book.shelf_status === "read");
  const currentlyReadingMatches = matchingBooks.filter(
    (book) => book.shelf_status === "currently_reading"
  );

  return { matchingBooks, unreadMatches, readMatches, currentlyReadingMatches };
}

export async function getMatchingBooksForSuggestion(
  userId: string,
  suggestion: Pick<SuggestedShelf, "genre">
): Promise<SuggestionMatchingBooks> {
  const books = await getUserLibraryBooks(userId);
  return getMatchingBooksFromLibrary(books, suggestion.genre);
}

export async function getSuggestedShelves(
  userId: string,
  profileGenres: string[] | null | undefined,
  books: LibraryBookRow[] = []
): Promise<SuggestedShelf[]> {
  const existing = await listUserCustomShelves(userId);
  const existingNames = new Set(existing.map((s) => normalizeName(s.name)));

  const suggestions: SuggestedShelf[] = [];
  const seen = new Set<string>();

  function add(shelf: Omit<SuggestedShelf, "matchCount">) {
    const key = normalizeName(shelf.name);
    if (existingNames.has(key) || seen.has(key)) return;
    seen.add(key);
    suggestions.push({
      ...shelf,
      matchCount: countMatchingLibraryBooks(books, shelf.genre),
    });
  }

  for (const genre of profileGenres ?? []) {
    const trimmed = genre.trim();
    if (!trimmed) continue;
    add({
      name: `${trimmed} favorites`,
      genre: trimmed,
      reason: "From your favorite genres",
    });
    add({
      name: `${trimmed} to explore`,
      genre: trimmed,
      reason: "From your favorite genres",
    });
  }

  const subjects = [...subjectCounts(books).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  for (const [subject] of subjects) {
    add({
      name: subject.length > 40 ? `${subject.slice(0, 37)}…` : subject,
      genre: subject,
      reason: "From your library",
    });
  }

  for (const template of TEMPLATE_SHELVES) {
    add(template);
    if (suggestions.length >= 6) break;
  }

  return suggestions.slice(0, 6);
}
