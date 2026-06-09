"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchForm } from "@/components/search/SearchForm";
import { SearchResults } from "@/components/search/SearchResults";
import { LoadingState } from "@/components/ui/LoadingState";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-puce-red">Search books</h1>
        <p className="mt-1 text-text-muted">
          Powered by Open Library. Add titles to your shelves from results.
        </p>
      </header>

      <SearchForm />

      {q ? (
        <SearchResults query={q} />
      ) : (
        <p className="text-text-muted">Enter a title or author to start searching.</p>
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
