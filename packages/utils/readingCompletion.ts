/** Shared reading-completion rules — keep web + mobile in sync. */

export const MAX_PAGE_COUNT = 10_000;

export type PageCountStatus = "known" | "user_entered" | "missing";

export type PageCountSource = "edition" | "canonical_book" | "user" | "unavailable";

export type PageCountResolution = {
  totalPages: number | null;
  pageCountStatus: PageCountStatus;
  pageCountSource: PageCountSource;
};

export type ResolvePageCountInput = {
  editionPageCount?: number | string | null;
  editionSelected?: boolean;
  catalogPageCount?: number | string | null;
  previousPage?: number | null;
  manualPageCount?: number | null;
};

export function validateManualPageCount(
  raw: unknown
): { ok: true; value: number } | { ok: false; error: string } {
  const parsed =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseInt(raw.trim(), 10)
        : Number.NaN;

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return { ok: false, error: "Enter a whole number of pages." };
  }
  if (parsed <= 0) {
    return { ok: false, error: "Page count must be greater than zero." };
  }
  if (parsed > MAX_PAGE_COUNT) {
    return { ok: false, error: `Page count cannot exceed ${MAX_PAGE_COUNT.toLocaleString()}.` };
  }
  return { ok: true, value: parsed };
}

function positiveInt(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n =
    typeof value === "number"
      ? Math.trunc(value)
      : Number.parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n > 0 ? n : null;
}

export function resolvePageCount(input: ResolvePageCountInput): PageCountResolution {
  const manual = input.manualPageCount != null ? validateManualPageCount(input.manualPageCount) : null;
  if (manual && manual.ok) {
    return {
      totalPages: manual.value,
      pageCountStatus: "user_entered",
      pageCountSource: "user",
    };
  }

  const editionPages = positiveInt(input.editionPageCount);
  if (input.editionSelected && editionPages != null) {
    return {
      totalPages: editionPages,
      pageCountStatus: "known",
      pageCountSource: "edition",
    };
  }

  const catalogPages = positiveInt(input.catalogPageCount);
  if (catalogPages != null) {
    return {
      totalPages: catalogPages,
      pageCountStatus: "known",
      pageCountSource: input.editionSelected ? "edition" : "canonical_book",
    };
  }

  const previousPages = positiveInt(input.previousPage ?? null);
  if (previousPages != null) {
    return {
      totalPages: previousPages,
      pageCountStatus: "known",
      pageCountSource: "canonical_book",
    };
  }

  return {
    totalPages: null,
    pageCountStatus: "missing",
    pageCountSource: "unavailable",
  };
}

export type CompletionProgressPatch = {
  progress_percent: number;
  progress_pages: number;
  shelf_status: "read";
  finished_at: string;
  started_at?: string;
};

export function buildCompletionUserBookPatch(input: {
  finishedAt: string;
  startedAt?: string | null;
  previousPage: number;
  resolution: PageCountResolution;
}): CompletionProgressPatch {
  const previousPage = Math.max(0, input.previousPage);
  const finished_at = input.finishedAt;
  const started_at = input.startedAt ?? finished_at;

  if (input.resolution.pageCountStatus === "missing" || input.resolution.totalPages == null) {
    return {
      shelf_status: "read",
      progress_percent: 100,
      progress_pages: previousPage,
      finished_at,
      started_at,
    };
  }

  return {
    shelf_status: "read",
    progress_percent: 100,
    progress_pages: input.resolution.totalPages,
    finished_at,
    started_at,
  };
}

export type CompletionSessionPatch = {
  page_start: number;
  page_end: number;
  pages_read: number;
  percent_complete: number;
  total_pages: number | null;
  page_count_status: PageCountStatus;
  page_count_source: PageCountSource;
  edition_id: string | null;
  completed_at: string;
};

export function buildCompletionSessionPatch(input: {
  previousPage: number;
  resolution: PageCountResolution;
  editionId: string | null;
  finishedAt: string;
}): CompletionSessionPatch {
  const pageStart = Math.max(0, input.previousPage);
  const finishedAt = input.finishedAt;

  if (input.resolution.pageCountStatus === "missing" || input.resolution.totalPages == null) {
    return {
      page_start: pageStart,
      page_end: pageStart,
      pages_read: 0,
      percent_complete: 100,
      total_pages: null,
      page_count_status: "missing",
      page_count_source: "unavailable",
      edition_id: input.editionId,
      completed_at: finishedAt,
    };
  }

  const pageEnd = input.resolution.totalPages;
  const pagesRead = Math.max(0, pageEnd - pageStart);

  return {
    page_start: pageStart,
    page_end: pageEnd,
    pages_read: pagesRead,
    percent_complete: 100,
    total_pages: pageEnd,
    page_count_status: input.resolution.pageCountStatus,
    page_count_source: input.resolution.pageCountSource,
    edition_id: input.editionId,
    completed_at: finishedAt,
  };
}

export function countResolvedPagesRead(
  books: Array<{ shelf_status: string; progress_pages?: number | null }>
): number {
  return books.reduce((sum, book) => {
    if (book.shelf_status !== "read") return sum;
    const pages = Number(book.progress_pages) || 0;
    return pages > 0 ? sum + pages : sum;
  }, 0);
}

export function formatFinishActivityDetail(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  if (metadata.page_count_pending === true) return "Page count pending";
  const pages = metadata.pages_read;
  if (typeof pages === "number" && pages > 0) {
    return `${pages.toLocaleString()} pages`;
  }
  return null;
}
