"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NotesSearchForm } from "@/components/notes/NotesSearchForm";
import { NotesSearchFilters } from "@/components/notes/NotesSearchFilters";
import { NotesSearchResults } from "@/components/notes/NotesSearchResults";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { layout } from "@/lib/constants/layout";
import type { ReadingNoteCategory } from "@/types";
import { READING_NOTE_CATEGORIES } from "@/lib/readingNotes/categories";

const CATEGORY_VALUES = new Set(READING_NOTE_CATEGORIES.map((item) => item.value));

function isReadingNoteCategory(value: string): value is ReadingNoteCategory {
  return CATEGORY_VALUES.has(value as ReadingNoteCategory);
}

function parsePageNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

function hasActiveSearch(params: URLSearchParams): boolean {
  const q = params.get("q")?.trim();
  const category = params.get("category")?.trim();
  const page = params.get("page")?.trim();
  return Boolean(q || category || page);
}

function NotesSearchContent() {
  const searchParams = useSearchParams();
  const user = useAuthUser();
  const q = searchParams.get("q")?.trim() ?? "";
  const categoryParam = searchParams.get("category")?.trim() ?? "";
  const category = isReadingNoteCategory(categoryParam) ? categoryParam : undefined;
  const pageNumber = parsePageNumber(searchParams.get("page"));
  const searching = hasActiveSearch(searchParams);

  if (user === undefined) {
    return <LoadingState message="Loading…" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className={layout.pageStackWide}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Search reading notes</h1>
        <p className="mx-auto mt-1 max-w-2xl text-pretty text-text-muted">
          Find quotes and reflections across every book in your library.
        </p>
      </header>

      <NotesSearchForm />

      {searching ? (
        <>
          <NotesSearchFilters />
          <NotesSearchResults
            userId={user.id}
            keyword={q || undefined}
            category={category}
            pageNumber={pageNumber}
          />
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-text-muted">
            Enter a keyword or choose a filter to search your notes.
          </p>
          <NotesSearchFilters />
          <p className="text-sm text-text-muted">
            Add notes from any{" "}
            <Link href="/library/" className="font-medium text-primary hover:underline">
              library book
            </Link>{" "}
            or your{" "}
            <Link href="/reading-room/" className="font-medium text-primary hover:underline">
              Reading Room
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

export default function NotesSearchPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading notes search…" />}>
      <NotesSearchContent />
    </Suspense>
  );
}
