"use client";

import { useEffect, useState } from "react";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import {
  openLibraryCoverUrl,
  openLibraryWorkId,
  searchOpenLibrary,
  type OpenLibrarySearchResult,
} from "@/lib/services/openLibrary";
import { LoadingState } from "@/components/ui/LoadingState";

type Props = {
  query: string;
};

export function SearchResults({ query }: Props) {
  const [results, setResults] = useState<OpenLibrarySearchResult | null | "error">(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setResults(null);
    setErrorMessage(null);
    void searchOpenLibrary(query)
      .then(setResults)
      .catch((e) => {
        setResults("error");
        setErrorMessage(e instanceof Error ? e.message : "Search failed.");
      });
  }, [query]);

  if (results === null) {
    return <LoadingState message="Searching…" />;
  }

  if (results === "error") {
    return <p className="text-rust">{errorMessage}</p>;
  }

  if (!results.docs.length) {
    return <p className="text-text-muted">No books found for &ldquo;{query}&rdquo;.</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-text-muted">
        {results.numFound.toLocaleString()} results — showing {results.docs.length}
      </p>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.docs.map((doc) => {
          const workId = openLibraryWorkId(doc.key);
          if (!workId || !doc.title) return null;
          const coverUrl = doc.cover_i ? openLibraryCoverUrl(doc.cover_i) : null;
          const author = doc.author_name?.[0] ?? null;

          return (
            <li key={doc.key}>
              <SearchResultCard
                title={doc.title}
                author={author}
                coverUrl={coverUrl}
                external_id={workId}
                cover_i={doc.cover_i ? String(doc.cover_i) : ""}
                page_count={
                  doc.number_of_pages_median ? String(doc.number_of_pages_median) : ""
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
