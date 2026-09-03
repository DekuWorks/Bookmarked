/** Current page + total pages for a reader's selected edition. */

export type PageProgressInput = {
  currentPage: number;
  totalPages: number;
};

export type PageProgressValidation =
  | { ok: true; currentPage: number; totalPages: number; percent: number }
  | { ok: false; error: string };

export function parsePageCount(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function percentFromPages(currentPage: number, totalPages: number): number {
  if (totalPages <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, currentPage) / totalPages) * 1000) / 10);
}

export function validatePageProgress(input: {
  currentPage: string | number | null | undefined;
  totalPages: string | number | null | undefined;
}): PageProgressValidation {
  const currentPage = parsePageCount(input.currentPage);
  const totalPages = parsePageCount(input.totalPages);

  if (totalPages == null || totalPages <= 0) {
    return { ok: false, error: "Total pages must be greater than 0." };
  }
  if (!Number.isInteger(totalPages)) {
    return { ok: false, error: "Total pages must be a whole number." };
  }
  if (currentPage == null || currentPage < 0) {
    return { ok: false, error: "Current page cannot be negative." };
  }
  if (!Number.isInteger(currentPage)) {
    return { ok: false, error: "Current page must be a whole number." };
  }
  if (currentPage > totalPages) {
    return { ok: false, error: "Current page cannot be greater than total pages." };
  }

  return {
    ok: true,
    currentPage,
    totalPages,
    percent: percentFromPages(currentPage, totalPages),
  };
}

export function resolveUserEditionTotalPages(input: {
  userTotalPages?: number | null;
  catalogPageCount?: number | null;
}): number {
  if (input.userTotalPages && input.userTotalPages > 0) return input.userTotalPages;
  if (input.catalogPageCount && input.catalogPageCount > 0) return input.catalogPageCount;
  return 0;
}
