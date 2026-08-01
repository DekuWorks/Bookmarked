"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { Button } from "@/components/ui/Button";
import {
  catalogExternalId,
  searchIsbndb,
  type CatalogDoc,
  type CatalogSearchResult,
} from "@/lib/services/isbndb";
import { resolveDisplayCoverUrl } from "@/lib/services/covers";
import { getBookShelfMemberships, type BookShelfMembership } from "@/lib/services/library";
import { SEARCH_PAGE_SIZE } from "@/lib/constants/searchFilters";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { usePreferredCatalogLanguage } from "@/lib/hooks/usePreferredOpenLibraryLanguage";
import { isIsbnQuery } from "@/lib/utils/isbn";
import { resolveSearchLanguage } from "@/lib/utils/searchLanguage";
import { LoadingState } from "@/components/ui/LoadingState";

type Props = {
  query: string;
};

function parseOptionalInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

export function SearchResults({ query }: Props) {
  const searchParams = useSearchParams();
  const user = useAuthUser();
  const preferredLanguage = usePreferredCatalogLanguage();
  const urlLang = searchParams.get("lang");
  const language = resolveSearchLanguage(urlLang, preferredLanguage);
  const yearFrom = parseOptionalInt(searchParams.get("yearFrom"));
  const yearTo = parseOptionalInt(searchParams.get("yearTo"));
  const sort = searchParams.get("sort") ?? undefined;

  const filterKey = `${urlLang ?? ""}|${language ?? ""}|${preferredLanguage ?? ""}|${yearFrom ?? ""}|${yearTo ?? ""}|${sort ?? ""}`;

  const searchOptions = useMemo(
    () => ({ language, yearFrom, yearTo, sort }),
    [language, yearFrom, yearTo, sort]
  );

  const [docs, setDocs] = useState<CatalogDoc[]>([]);
  const [numFound, setNumFound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Map<string, BookShelfMembership>>(new Map());

  useEffect(() => {
    if (!user) {
      setMemberships(new Map());
      return;
    }

    let cancelled = false;
    void getBookShelfMemberships(user.id)
      .then((result) => {
        if (!cancelled) setMemberships(result);
      })
      .catch((error) => {
        console.error("[search] failed to load shelf memberships:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const runSearch = useCallback(
    async (offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setErrorMessage(null);
      }

      try {
        const result: CatalogSearchResult = await searchIsbndb(query, {
          ...searchOptions,
          limit: SEARCH_PAGE_SIZE,
          offset,
        });

        setNumFound(result.numFound);
        setDocs((prev) => (append ? [...prev, ...result.docs] : result.docs));
      } catch (e) {
        if (!append) {
          setDocs([]);
          setNumFound(0);
        }
        setErrorMessage(e instanceof Error ? e.message : "Search failed.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, searchOptions]
  );

  useEffect(() => {
    void runSearch(0, false);
  }, [query, filterKey, runSearch]);

  if (loading) {
    return <LoadingState message="Searching…" />;
  }

  if (errorMessage && docs.length === 0) {
    return <p className="text-rust">{errorMessage}</p>;
  }

  if (!docs.length) {
    return (
      <p className="text-text-muted">
        No books found for &ldquo;{query}&rdquo;
        {isIsbnQuery(query) ? " (ISBN lookup)" : ""}.
      </p>
    );
  }

  const hasMore = docs.length < numFound;

  return (
    <div className="text-center">
      <p className="mb-4 text-sm text-text-muted">
        Showing {docs.length.toLocaleString()} of {numFound.toLocaleString()} results
        {isIsbnQuery(query) ? " · ISBN search" : ""}
      </p>

      <ul className="mx-auto grid max-w-6xl grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {docs.map((doc) => {
          const externalId = catalogExternalId(doc.key);
          if (!externalId || !doc.title) return null;
          const isbn = doc.isbn?.[0] ?? externalId;
          const coverUrl = resolveDisplayCoverUrl({
            coverUrl: doc.cover_url,
            isbn,
          });
          const author = doc.author_name?.[0] ?? null;
          const membership =
            memberships.get(externalId) ?? (isbn ? memberships.get(isbn) : undefined);

          return (
            <li key={`${doc.key}-${isbn}`} className="w-full max-w-sm">
              <SearchResultCard
                title={doc.title}
                author={author}
                coverUrl={coverUrl}
                external_id={externalId}
                cover_url={doc.cover_url ?? ""}
                page_count={
                  doc.number_of_pages_median ? String(doc.number_of_pages_median) : ""
                }
                isbn={isbn}
                first_publish_year={
                  doc.first_publish_year ? String(doc.first_publish_year) : ""
                }
                first_sentence={doc.first_sentence?.[0] ?? ""}
                bookmarked={Boolean(membership)}
                bookId={membership?.bookId ?? null}
                shelfStatus={membership?.shelfStatus ?? null}
                onShelfMembershipChange={({ bookId, shelfStatus }) => {
                  setMemberships((prev) => {
                    const next = new Map(prev);
                    next.set(externalId, {
                      bookId,
                      shelfStatus,
                      isFavorite: next.get(externalId)?.isFavorite ?? false,
                    });
                    if (isbn) next.set(isbn, next.get(externalId)!);
                    return next;
                  });
                }}
              />
            </li>
          );
        })}
      </ul>

      {hasMore ? (
        <div className="mt-8">
          <Button
            type="button"
            variant="outline"
            loading={loadingMore}
            onClick={() => void runSearch(docs.length, true)}
          >
            Load more
          </Button>
        </div>
      ) : null}

      {errorMessage && docs.length > 0 ? (
        <p className="mt-4 text-sm text-rust">{errorMessage}</p>
      ) : null}
    </div>
  );
}
