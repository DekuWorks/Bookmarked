"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddCustomNoteCategoryModal } from "@/components/books/AddCustomNoteCategoryModal";
import { NotesBookFilter } from "@/components/notes/NotesBookFilter";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useReadingNoteCategories } from "@/lib/hooks/useReadingNoteCategories";
import { isReadingNoteCategoryValue } from "@/lib/readingNotes/categories";
import { listNotedBooksForUser } from "@/lib/services/readingNotes";
import type { ReadingNoteCategory } from "@/types";
import { cn } from "@/lib/utils/cn";
import {
  NOTES_BOOK_FILTER_COPY,
  NOTES_BOOK_QUERY_PARAM,
  matchNotesBookFilter,
  type NotesBookFilterOption,
} from "@bookmarked/utils/notesBookFilter";

function parsePageNumber(value: string | null): string {
  if (!value) return "";
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? String(Math.floor(n)) : "";
}

const ADD_CUSTOM_CATEGORY_VALUE = "__add_custom_category__";

export function NotesSearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthUser();
  const { categories, refresh: refreshCategories } = useReadingNoteCategories(user?.id);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [bookOptions, setBookOptions] = useState<NotesBookFilterOption[]>([]);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = parsePageNumber(searchParams.get("page"));
  const selectedUserBookId = matchNotesBookFilter(
    searchParams.get(NOTES_BOOK_QUERY_PARAM),
    bookOptions
  );

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void listNotedBooksForUser(user.id).then(({ options }) => {
      if (!cancelled) setBookOptions(options);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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

  function handleCategoryChange(value: string) {
    if (value === ADD_CUSTOM_CATEGORY_VALUE) {
      setShowAddCategory(true);
      return;
    }
    pushFilters({
      category: value && isReadingNoteCategoryValue(value) ? value : null,
    });
  }

  const selectClass = cn(
    "min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text sm:w-auto",
    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
  );

  return (
    <>
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border bg-surface p-4 text-left shadow-sm">
        <p className="mb-3 text-center text-sm font-medium text-puce-red">Filter results</p>
        <div className="mb-4">
          <NotesBookFilter
            options={bookOptions}
            selectedUserBookId={selectedUserBookId}
            onSelect={(userBookId) =>
              pushFilters({ [NOTES_BOOK_QUERY_PARAM]: userBookId })
            }
          />
        </div>
        <div className="grid gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-text-muted">Category</span>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={selectClass}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.emoji} {item.label}
                </option>
              ))}
              {user ? (
                <option value={ADD_CUSTOM_CATEGORY_VALUE}>➕ Add custom category…</option>
              ) : null}
            </select>
          </label>

        </div>
        <details
          className="mt-4 rounded-lg border border-border bg-background/60 p-3"
          open={Boolean(page)}
        >
          <summary className="min-h-[44px] cursor-pointer list-none text-sm font-medium text-puce-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange">
            {NOTES_BOOK_FILTER_COPY.advancedFilters}
          </summary>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-text-muted">
              {NOTES_BOOK_FILTER_COPY.pageNumber}
            </span>
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
        </details>
      </div>

      {user ? (
        <AddCustomNoteCategoryModal
          open={showAddCategory}
          userId={user.id}
          onClose={() => setShowAddCategory(false)}
          onCreated={(nextCategory: ReadingNoteCategory) => {
            void refreshCategories();
            pushFilters({ category: nextCategory });
          }}
        />
      ) : null}
    </>
  );
}
