"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FeedCard } from "@/components/social/FeedCard";
import { FeedSearchBar } from "@/components/social/FeedSearchBar";
import { FeedSearchResults } from "@/components/social/FeedSearchResults";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { searchFeed, type FeedSearchResults as FeedSearchData } from "@/lib/services/feedSearch";
import { getProfile } from "@/lib/services/profile";
import { fetchFollowingFeed, fetchForYouFeed } from "@/lib/services/socialFeed";
import type { FeedItem } from "@/lib/services/socialFeed";
import { cn } from "@/lib/utils/cn";

type FeedTab = "for-you" | "following";

import { layout } from "@/lib/constants/layout";

function FeedContent() {
  const user = useAuthUser();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "following" ? "following" : "for-you";
  const [tab, setTab] = useState<FeedTab>(initialTab);
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FeedSearchData | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isSearching = debouncedQuery.trim().length > 0;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);

    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    if (!user || isSearching) return;

    setItems(null);
    setError(null);

    void (async () => {
      try {
        const profile = await getProfile(user.id);
        const feed =
          tab === "following"
            ? await fetchFollowingFeed(user.id)
            : await fetchForYouFeed(user.id, profile?.favorite_genres);
        setItems(feed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load feed.");
        setItems([]);
      }
    })();
  }, [user, tab, isSearching]);

  useEffect(() => {
    if (!user || !isSearching) {
      setSearchResults(null);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    void searchFeed(debouncedQuery, user.id)
      .then(setSearchResults)
      .catch((err) => {
        setSearchError(err instanceof Error ? err.message : "Search failed.");
        setSearchResults({ readers: [], books: [], posts: [] });
      })
      .finally(() => setSearchLoading(false));
  }, [user, debouncedQuery, isSearching]);

  if (user === undefined) {
    return <LoadingState message="Loading feed…" />;
  }

  if (!user) return null;

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Feed</h1>
        <p className="mx-auto mt-1 max-w-xl text-pretty text-text-muted">
          Discover readers and see what people you follow are reading.
        </p>
      </header>

      <FeedSearchBar value={searchQuery} onChange={setSearchQuery} />

      {isSearching ? (
        <FeedSearchResults
          query={debouncedQuery.trim()}
          results={searchResults}
          loading={searchLoading}
          error={searchError}
        />
      ) : (
        <>
          <div
            className="flex gap-2 rounded-lg border border-border bg-background p-1"
            role="tablist"
            aria-label="Feed type"
          >
            {(
              [
                { id: "for-you" as const, label: "For You" },
                { id: "following" as const, label: "Following" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={tab === option.id}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
                  tab === option.id
                    ? "bg-primary text-puce-red shadow-sm"
                    : "text-text-muted hover:text-text"
                )}
                onClick={() => setTab(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {!items ? (
            <LoadingState message="Loading posts…" />
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center">
              {tab === "following" ? (
                <>
                  <p className="font-medium text-puce-red">Your following feed is empty</p>
                  <p className="mt-2 text-sm text-text-muted">
                    Follow readers to see when they add books, finish reads, and publish reviews.
                    Use the search bar above to find people to follow.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <ButtonLink href="/feed/?tab=for-you" variant="primary" size="sm">
                      Browse For You
                    </ButtonLink>
                    <ButtonLink href="/search" variant="outline" size="sm">
                      Find books
                    </ButtonLink>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-puce-red">Nothing in your For You feed yet</p>
                  <p className="mt-2 text-sm text-text-muted">
                    Public reading activity from the community will appear here, ranked by your
                    favorite genres and recent posts.
                  </p>
                  <div className="mt-6">
                    <ButtonLink href="/search" variant="primary" size="sm">
                      Add books to your library
                    </ButtonLink>
                  </div>
                </>
              )}
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id}>
                  <FeedCard item={item} />
                </li>
              ))}
            </ul>
          )}

          {tab === "for-you" && items && items.length > 0 ? (
            <p className="text-center text-xs text-text-muted">
              For You ranks public activity by recency, your genres, and readers you follow.{" "}
              <Link href="/profile/setup" className="text-primary hover:underline">
                Update your genres
              </Link>
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading feed…" />}>
      <FeedContent />
    </Suspense>
  );
}
