import { Suspense } from "react";
import { SearchForm } from "@/components/search/SearchForm";
import { SearchResults } from "@/components/search/SearchResults";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = { title: "Search" };

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-puce-red">Search books</h1>
        <p className="mt-1 text-text-muted">
          Powered by Open Library. Add titles to your shelves from results.
        </p>
      </header>

      <Suspense fallback={<p className="text-text-muted">Loading search…</p>}>
        <SearchForm />
      </Suspense>

      {q ? (
        <Suspense fallback={<LoadingState message="Searching…" />}>
          <SearchResults query={q} />
        </Suspense>
      ) : (
        <p className="text-text-muted">Enter a title or author to start searching.</p>
      )}
    </div>
  );
}
