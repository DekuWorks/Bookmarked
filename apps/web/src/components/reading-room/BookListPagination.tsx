"use client";

import { cn } from "@/lib/utils/cn";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  label?: string;
};

export function BookListPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className,
  label = "books",
}: Props) {
  if (total <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-text-muted">
        Showing {start}–{end} of {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="min-h-[44px] min-w-[44px] rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-text transition enabled:hover:border-primary disabled:opacity-40"
          aria-label="Previous page"
        >
          ←
        </button>
        <span className="text-sm font-medium text-text">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="min-h-[44px] min-w-[44px] rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-text transition enabled:hover:border-primary disabled:opacity-40"
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </div>
  );
}
