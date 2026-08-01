/**
 * Formats reading-note page/chapter for display.
 *
 * Examples:
 * - both → "Page 48 • Chapter 2"
 * - page only → "Page 48"
 * - chapter only → "Chapter 2" / "Prologue"
 * - neither / invalid → null
 */

export type FormatNoteLocationInput = {
  pageNumber?: number | null;
  chapterNumber?: number | string | null;
};

/** Home / Reading Room Notes tab preview size. */
export const HOME_NOTES_PREVIEW_LIMIT = 5;

function formatPagePart(pageNumber: number | null | undefined): string | null {
  if (pageNumber == null) return null;
  if (typeof pageNumber !== "number" || !Number.isFinite(pageNumber)) return null;
  // Hide invalid / non-positive pages (Page 0 is not shown).
  if (pageNumber <= 0) return null;
  if (!Number.isInteger(pageNumber)) {
    // Allow .5 pages only if somehow stored; otherwise require integer-like.
    if (pageNumber % 1 !== 0) return null;
  }
  return `Page ${pageNumber}`;
}

function formatChapterPart(
  chapterNumber: number | string | null | undefined
): string | null {
  if (chapterNumber == null) return null;

  if (typeof chapterNumber === "number") {
    if (!Number.isFinite(chapterNumber) || chapterNumber <= 0) return null;
    return `Chapter ${chapterNumber}`;
  }

  const text = chapterNumber.trim();
  if (!text || text === "null" || text === "undefined") return null;

  if (/^chapter\b/i.test(text)) {
    return text;
  }

  // Bare numeric chapter → "Chapter N"
  if (/^\d+([.:]\d+)?$/.test(text)) {
    const asNumber = Number(text.replace(":", "."));
    if (!Number.isFinite(asNumber) || asNumber <= 0) return null;
    return `Chapter ${text}`;
  }

  // Named chapters (Prologue, Epilogue, etc.)
  return text;
}

export function formatNoteLocation({
  pageNumber,
  chapterNumber,
}: FormatNoteLocationInput): string | null {
  const page = formatPagePart(pageNumber);
  const chapter = formatChapterPart(chapterNumber);

  if (page && chapter) return `${page} • ${chapter}`;
  if (page) return page;
  if (chapter) return chapter;
  return null;
}
