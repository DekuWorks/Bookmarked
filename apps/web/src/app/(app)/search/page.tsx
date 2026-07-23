"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchForm } from "@/components/search/SearchForm";
import { SearchFiltersBar } from "@/components/search/SearchFiltersBar";
import { SearchResults } from "@/components/search/SearchResults";
import { ReaderSearchResults } from "@/components/search/ReaderSearchResults";
import { getSearchMode, SearchModeTabs } from "@/components/search/SearchModeTabs";
import { BecauseYouReadPanel } from "@/components/discovery/BecauseYouReadPanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

import { layout } from "@/lib/constants/layout";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;
  const mode = getSearchMode(searchParams);
  const user = useAuthUser();

  return (
    <div className={layout.pageStackWide}>
      <header className={`${layout.pageHeader} feed-header-gradient -mx-4 px-4 pb-8 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8`}>
        <h1 className="font-display text-3xl font-bold text-puce-red sm:text-4xl">Search</h1>
        <p className="mx-auto mt-1 max-w-2xl text-pretty text-text-muted">
          Find books and readers in one place — like your favorite social app, but for reading.
        </p>
      </header>

      <SearchModeTabs />
      <SearchForm mode={mode} />

      {q ? (
        mode === "people" ? (
          <ReaderSearchResults query={q} />
        ) : (
          <>
            <SearchFiltersBar />
            <SearchResults query={q} />
          </>
        )
      ) : (
        <div className="space-y-8">
          <p className="text-text-muted">
            {mode === "people"
              ? "Search by display name or @username to find readers."
              : "Enter a title, author, or ISBN to start searching books."}
          </p>
          {mode === "books" && user ? (
            <section className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold text-puce-red">Because you read…</h2>
              <div className="mt-4">
                <BecauseYouReadPanel userId={user.id} />
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading search…" />}>
      <SearchContent />
    </Suspense>
  );
}
