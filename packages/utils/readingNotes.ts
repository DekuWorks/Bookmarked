export type NoteLocationInput = {
  pageNumber?: number | null;
  page_number?: number | null;
  chapter?: string | null;
};

export type FormatNoteLocationOptions = {
  separator?: string;
};

const DEFAULT_SEPARATOR = " • ";

function resolvePageNumber(input: NoteLocationInput): number | null {
  const pageNumber = input.pageNumber ?? input.page_number;
  return typeof pageNumber === "number" && Number.isFinite(pageNumber) ? pageNumber : null;
}

export function formatNoteChapter(chapter: string | null | undefined): string | null {
  const value = chapter?.trim();
  if (!value) return null;
  if (/^(chapter|ch\.?)\b/i.test(value)) return value;
  return `Chapter ${value}`;
}

export function formatNoteLocation(
  input: NoteLocationInput,
  options: FormatNoteLocationOptions = {}
): string | null {
  const pageNumber = resolvePageNumber(input);
  const page = pageNumber != null ? `Page ${pageNumber}` : null;
  const chapter = formatNoteChapter(input.chapter);
  const parts = [page, chapter].filter((part): part is string => Boolean(part));

  if (parts.length === 0) return null;
  return parts.join(options.separator ?? DEFAULT_SEPARATOR);
}
