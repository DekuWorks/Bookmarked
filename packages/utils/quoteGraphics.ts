import { filterNotesBookOptionsByQuery, type NotesBookFilterOption } from "./notesBookFilter";

export const QUOTE_GRAPHICS_PAGE_SUBTITLE =
  "Turn your favorite quotes into beautiful, shareable graphics. Free members can create 3 per month, while Plus members enjoy unlimited creations.";

export const QUOTE_GRAPHICS_MONTHLY_LIMIT_COPY =
  "Your monthly limit only counts successfully created graphics—failed attempts won’t use one of your 3 Free creations.";

export const QUOTE_GRAPHICS_PLUS_LIMIT_COPY =
  "Plus members can create unlimited quote graphics. Failed attempts are not counted.";

export const QUOTE_GRAPHICS_EMPTY_COPY =
  "Save a quote in Reading Notes to create your first Quote Graphic.";

export const QUOTE_GRAPHICS_SELECT_BOOK_FIRST = "Select a book first";

export const QUOTE_GRAPHICS_VAULT_LABEL = "Quote Graphics Vault";
export const QUOTE_GRAPHICS_OPEN_VAULT_LABEL = "Open Quote Graphics Vault";

export type QuoteGraphicSourceNote = {
  id: string;
  quote?: string | null;
  note?: string | null;
  page_number?: number | null;
  chapter?: string | null;
  user_book_id: string;
  book?: {
    id?: string | null;
    title?: string | null;
    author?: string | null;
    cover_url?: string | null;
  } | null;
};

export type QuoteGraphicBookOption = NotesBookFilterOption;

export function isQuoteGraphicEligibleNote(note: { quote?: string | null }): boolean {
  return Boolean(note.quote?.trim());
}

export function buildQuoteGraphicBookOptions(
  notes: readonly QuoteGraphicSourceNote[]
): QuoteGraphicBookOption[] {
  const grouped = new Map<string, QuoteGraphicBookOption>();
  for (const note of notes) {
    if (!isQuoteGraphicEligibleNote(note) || !note.user_book_id) continue;
    const existing = grouped.get(note.user_book_id);
    if (existing) {
      existing.noteCount += 1;
      continue;
    }
    grouped.set(note.user_book_id, {
      userBookId: note.user_book_id,
      bookId: note.book?.id?.trim() || "",
      title: note.book?.title?.trim() || "Untitled",
      author: note.book?.author?.trim() || null,
      coverUrl: note.book?.cover_url ?? null,
      noteCount: 1,
    });
  }
  return [...grouped.values()].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );
}

export function searchQuoteGraphicBooks(
  options: readonly QuoteGraphicBookOption[],
  query: string
): QuoteGraphicBookOption[] {
  return filterNotesBookOptionsByQuery(options, query);
}

export function quotesForSelectedBook<T extends QuoteGraphicSourceNote>(
  notes: readonly T[],
  userBookId: string | null
): T[] {
  if (!userBookId) return [];
  return notes.filter(
    (note) => note.user_book_id === userBookId && isQuoteGraphicEligibleNote(note)
  );
}

export function buildQuoteGraphicAttribution(note: QuoteGraphicSourceNote): string {
  const parts: string[] = [];
  const title = note.book?.title?.trim();
  const author = note.book?.author?.trim();
  if (title && author) parts.push(`${title} — ${author}`);
  else if (title) parts.push(title);
  else if (author) parts.push(author);
  return parts.join(" · ");
}

export function quoteGraphicSnippet(quote: string, max = 90): string {
  const trimmed = quote.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function monthlyLimitCopy(unlimited: boolean): string {
  return unlimited ? QUOTE_GRAPHICS_PLUS_LIMIT_COPY : QUOTE_GRAPHICS_MONTHLY_LIMIT_COPY;
}
