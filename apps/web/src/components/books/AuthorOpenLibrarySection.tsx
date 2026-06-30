"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { Button } from "@/components/ui/Button";
import { SEARCH_PAGE_SIZE } from "@/lib/constants/searchFilters";
import { usePreferredOpenLibraryLanguage } from "@/lib/hooks/usePreferredOpenLibraryLanguage";
import {
  openLibraryWorkId,
  searchOpenLibraryByAuthor,
} from "@/lib/services/openLibrary";
import { resolveDisplayCoverUrl } from "@/lib/services/covers";
import { LoadingState } from "@/components/ui/LoadingState";
import type { OpenLibraryDoc } from "@/types";

type Props = {
  authorName: string;
  knownExternalIds: Set<string>;
};

function filterNewWorks(docs: OpenLibraryDoc[], knownExternalIds: Set<string>): OpenLibraryDoc[] {
  return docs.filter((doc) => {
    const workId = openLibraryWorkId(doc.key);
    if (!workId || !doc.title) return false;
    return !knownExternalIds.has(workId);
  });
}

export function AuthorOpenLibrarySection({ authorName, knownExternalIds }: Props) {
  const preferredLanguage = usePreferredOpenLibraryLanguage();
  const [docs, setDocs] = useState<OpenLibraryDoc[]>([]);
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
        const result = await searchOpenLibraryByAuthor(authorName, {
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
          error instanceof Error ? error.message : "Could not load Open Library results."
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
    return <LoadingState message="Searching Open Library…" />;
  }

  if (errorMessage && visibleDocs.length === 0) {
    return <p className="text-center text-sm text-rust">{errorMessage}</p>;
  }

  if (visibleDocs.length === 0 && !hasMore) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background px-6 py-8 text-center text-sm text-text-muted">
        No additional titles found on Open Library for this author.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-text-muted">
        {visibleDocs.length > 0
          ? `Showing ${visibleDocs.length.toLocaleString()} discoverable title${visibleDocs.length === 1 ? "" : "s"} from Open Library`
          : "Loading more titles…"}
        {numFound > 0 ? ` · ${numFound.toLocaleString()} total on Open Library` : ""}
      </p>

      {visibleDocs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDocs.map((doc) => {
            const workId = openLibraryWorkId(doc.key);
            if (!workId || !doc.title) return null;
            const isbn = doc.isbn?.[0] ?? "";
            const coverUrl = resolveDisplayCoverUrl({
              coverId: doc.cover_i,
              isbn,
            });
            const author = doc.author_name?.[0] ?? authorName;

            return (
              <SearchResultCard
                key={`${doc.key}-${isbn}`}
                title={doc.title}
                author={author}
                coverUrl={coverUrl}
                external_id={workId}
                cover_i={doc.cover_i ? String(doc.cover_i) : ""}
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
            Load more from Open Library
          </Button>
        </div>
      ) : null}

      {errorMessage && visibleDocs.length > 0 ? (
        <p className="text-center text-sm text-rust">{errorMessage}</p>
      ) : null}
    </div>
  );
}
