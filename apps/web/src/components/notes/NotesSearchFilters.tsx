"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { READING_NOTE_CATEGORIES } from "@/lib/readingNotes/categories";
import type { ReadingNoteCategory } from "@/types";
import { cn } from "@/lib/utils/cn";

function parsePageNumber(value: string | null): string {
  if (!value) return "";
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? String(Math.floor(n)) : "";
}

const CATEGORY_VALUES = new Set(READING_NOTE_CATEGORIES.map((item) => item.value));

function isReadingNoteCategory(value: string): value is ReadingNoteCategory {
  return CATEGORY_VALUES.has(value as ReadingNoteCategory);
}

export function NotesSearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = parsePageNumber(searchParams.get("page"));

  function pushFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (q) params.set("q", q);
    const query = params.toString();
    router.push(query ? `/notes/?${query}` : "/notes/");
  }

  const selectClass = cn(
    "min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text sm:w-auto",
    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
  );

  return (
    <div className="mx-auto w-full max-w-3xl rounded-xl border border-border bg-surface p-4 text-left shadow-sm">
      <p className="mb-3 text-center text-sm font-medium text-puce-red">Filter results</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-text-muted">Category</span>
          <select
            value={category}
            onChange={(e) => {
              const value = e.target.value;
              pushFilters({
                category: value && isReadingNoteCategory(value) ? value : null,
              });
            }}
            className={selectClass}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {READING_NOTE_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.emoji} {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-text-muted">Page number</span>
          <input
            type="number"
            min={1}
            placeholder="e.g. 42"
            value={page}
            onChange={(e) => pushFilters({ page: e.target.value || null })}
            className={selectClass}
            aria-label="Filter by page number"
          />
        </label>
      </div>
    </div>
  );
}
