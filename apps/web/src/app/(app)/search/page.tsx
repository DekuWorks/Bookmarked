"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchForm } from "@/components/search/SearchForm";
import { SearchFiltersBar } from "@/components/search/SearchFiltersBar";
import { SearchResults } from "@/components/search/SearchResults";
import { BecauseYouReadPanel } from "@/components/discovery/BecauseYouReadPanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

import { layout } from "@/lib/constants/layout";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;
  const user = useAuthUser();

  return (
    <div className={layout.pageStackWide}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Search books</h1>
        <p className="mx-auto mt-1 max-w-2xl text-pretty text-text-muted">
          Powered by ISBNdb. Add titles to your shelves from results.
        </p>
      </header>

      <SearchForm />

      {q ? (
        <>
          <SearchFiltersBar />
          <SearchResults query={q} />
        </>
      ) : (
        <div className="space-y-8">
          <p className="text-text-muted">Enter a title or author to start searching.</p>
          {user ? (
            <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-puce-red">Because you read…</h2>
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
