"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { Button } from "@/components/ui/Button";
import { SEARCH_PAGE_SIZE } from "@/lib/constants/searchFilters";
import { usePreferredCatalogLanguage } from "@/lib/hooks/usePreferredOpenLibraryLanguage";
import {
  catalogExternalId,
  searchIsbndbByAuthor,
  type CatalogDoc,
} from "@/lib/services/isbndb";
import { resolveDisplayCoverUrl } from "@/lib/services/covers";
import { LoadingState } from "@/components/ui/LoadingState";

type Props = {
  authorName: string;
  knownExternalIds: Set<string>;
};

function filterNewWorks(docs: CatalogDoc[], knownExternalIds: Set<string>): CatalogDoc[] {
  return docs.filter((doc) => {
    const id = catalogExternalId(doc.key);
    if (!id || !doc.title) return false;
    return !knownExternalIds.has(id);
  });
}

export function AuthorOpenLibrarySection({ authorName, knownExternalIds }: Props) {
  const preferredLanguage = usePreferredCatalogLanguage();
  const [docs, setDocs] = useState<CatalogDoc[]>([]);
  const [numFound, setNumFound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawOffset, setRawOffset] = useState(0);

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setErrorMessage(null);
      }

      try {
        const result = await searchIsbndbByAuthor(authorName, {
          limit: SEARCH_PAGE_SIZE,
          offset,
          language: preferredLanguage,
        });

        setNumFound(result.numFound);
        setRawOffset(offset + result.docs.length);
        setDocs((prev) => (append ? [...prev, ...result.docs] : result.docs));
      } catch (error) {
        if (!append) {
          setDocs([]);
          setNumFound(0);
          setRawOffset(0);
        }
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load catalog results."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [authorName, preferredLanguage]
  );

  useEffect(() => {
    setDocs([]);
    setNumFound(0);
    setRawOffset(0);
    void loadPage(0, false);
  }, [authorName, preferredLanguage, loadPage]);

  const visibleDocs = filterNewWorks(docs, knownExternalIds);
  const hasMore = rawOffset < numFound;

  if (loading) {
    return <LoadingState message="Searching catalog…" />;
  }

  if (errorMessage && visibleDocs.length === 0) {
    return <p className="text-center text-sm text-rust">{errorMessage}</p>;
  }

  if (visibleDocs.length === 0 && !hasMore) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background px-6 py-8 text-center text-sm text-text-muted">
        No additional titles found in the catalog for this author.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-text-muted">
        {visibleDocs.length > 0
          ? `Showing ${visibleDocs.length.toLocaleString()} discoverable title${visibleDocs.length === 1 ? "" : "s"} from the catalog`
          : "Loading more titles…"}
        {numFound > 0 ? ` · ${numFound.toLocaleString()} total in catalog` : ""}
      </p>

      {visibleDocs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDocs.map((doc) => {
            const id = catalogExternalId(doc.key);
            if (!id || !doc.title) return null;
            const isbn = doc.isbn?.[0] ?? id;
            const coverUrl = resolveDisplayCoverUrl({
              coverUrl: doc.cover_url,
              isbn,
            });
            const author = doc.author_name?.[0] ?? authorName;

            return (
              <SearchResultCard
                key={`${doc.key}-${isbn}`}
                title={doc.title}
                author={author}
                coverUrl={coverUrl}
                external_id={id}
                cover_url={doc.cover_url ?? ""}
                page_count={
                  doc.number_of_pages_median ? String(doc.number_of_pages_median) : ""
                }
                isbn={isbn}
                first_publish_year={
                  doc.first_publish_year ? String(doc.first_publish_year) : ""
                }
                first_sentence={doc.first_sentence?.[0] ?? ""}
              />
            );
          })}
        </div>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            loading={loadingMore}
            onClick={() => void loadPage(rawOffset, true)}
          >
            Load more from catalog
          </Button>
        </div>
      ) : null}

      {errorMessage && visibleDocs.length > 0 ? (
        <p className="text-center text-sm text-rust">{errorMessage}</p>
      ) : null}
    </div>
  );
}
