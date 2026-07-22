"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FeedCard } from "@/components/social/FeedCard";
import { FeedSearchBar } from "@/components/social/FeedSearchBar";
import { FeedSearchResults } from "@/components/social/FeedSearchResults";
import { PostCard } from "@/components/social/PostCard";
import { PostComposer } from "@/components/social/PostComposer";
import { TrendingNewsletterPanel } from "@/components/trending/TrendingNewsletterPanel";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useActivityFeedRealtime } from "@/lib/hooks/useActivityFeedRealtime";
import { usePostsRealtime } from "@/lib/hooks/usePostsRealtime";
import { searchFeed, type FeedSearchResults as FeedSearchData } from "@/lib/services/feedSearch";
import { getProfile } from "@/lib/services/profile";
import { fetchFollowingFeed, fetchForYouFeed } from "@/lib/services/socialFeed";
import type { FeedItem } from "@/lib/services/socialFeed";
import { getPostById, listFeedPosts } from "@/lib/services/posts";
import type { PostWithAuthor } from "@/types";

type FeedView = "posts" | "activity";
type FeedTab = "for-you" | "following";

import { layout } from "@/lib/constants/layout";

function parseFeedView(value: string | null): FeedView {
  return value === "activity" ? "activity" : "posts";
}

function parseFeedTab(value: string | null): FeedTab {
  return value === "following" ? "following" : "for-you";
}

function FeedContent() {
  const user = useAuthUser();
  const searchParams = useSearchParams();
  const feedView = parseFeedView(searchParams.get("view"));
  const tab = parseFeedTab(searchParams.get("tab"));
  const highlightedPostId = searchParams.get("post")?.trim() ?? null;

  const [activityItems, setActivityItems] = useState<FeedItem[] | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[] | null>(null);
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

  const loadActivity = useCallback(async () => {
    if (!user) return;

    const profile = await getProfile(user.id);
    const feed =
      tab === "following"
        ? await fetchFollowingFeed(user.id)
        : await fetchForYouFeed(user.id, profile?.favorite_genres);
    setActivityItems(feed);
  }, [user, tab]);

  const loadPosts = useCallback(async () => {
    if (!user) return;

    const feedPosts = await listFeedPosts(user.id, tab);
    setPosts(feedPosts);
  }, [user, tab]);

  const loadPostsRef = useRef(loadPosts);
  const loadActivityRef = useRef(loadActivity);

  useEffect(() => {
    loadPostsRef.current = loadPosts;
  }, [loadPosts]);

  useEffect(() => {
    loadActivityRef.current = loadActivity;
  }, [loadActivity]);

  useEffect(() => {
    if (!user || isSearching) return;

    setError(null);

    if (feedView === "activity") {
      setActivityItems(null);
      void loadActivity().catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load feed.");
        setActivityItems([]);
      });
      return;
    }

    setPosts(null);
    void loadPosts().catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load posts.");
      setPosts([]);
    });
  }, [user, tab, feedView, isSearching, loadActivity, loadPosts]);

  usePostsRealtime(user?.id, feedView === "posts" && !isSearching, () => {
    void loadPostsRef.current();
  });

  useActivityFeedRealtime(user?.id, feedView === "activity" && !isSearching, () => {
    void loadActivityRef.current();
  });

  useEffect(() => {
    if (!user || !highlightedPostId || feedView !== "posts" || isSearching) return;

    void getPostById(highlightedPostId, user.id)
      .then((post) => {
        if (!post) return;
        setPosts((current) => {
          if (!current) return [post];
          if (current.some((item) => item.id === post.id)) return current;
          return [post, ...current];
        });
      })
      .catch(() => {
        // Deep-linked post may be unavailable to this viewer.
      });
  }, [user, highlightedPostId, feedView, isSearching]);

  useEffect(() => {
    if (!highlightedPostId || feedView !== "posts") return;

    const handle = window.setTimeout(() => {
      document.getElementById(`post-${highlightedPostId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [highlightedPostId, feedView, posts]);

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

  const viewOptions: { id: FeedView; label: string }[] = [
    { id: "posts", label: "Posts" },
    { id: "activity", label: "Activity" },
  ];

  const tabOptions: { id: FeedTab; label: string }[] = [
    { id: "for-you", label: "For You" },
    { id: "following", label: "Following" },
  ];

  function viewHref(nextView: FeedView): string {
    const params = new URLSearchParams();
    params.set("view", nextView);
    if (tab !== "for-you") params.set("tab", tab);
    return `/feed/?${params.toString()}`;
  }

  function tabHref(nextTab: FeedTab): string {
    const params = new URLSearchParams();
    if (feedView !== "posts") params.set("view", feedView);
    if (nextTab !== "for-you") params.set("tab", nextTab);
    const query = params.toString();
    return query ? `/feed/?${query}` : "/feed/";
  }

  return (
    <div className={layout.pageStack}>
      <div className="-mx-4 feed-header-gradient px-4 pb-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <header className={layout.pageHeader}>
          <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Feed</h1>
          <p className="mx-auto mt-1 max-w-xl text-pretty text-text-muted">
            Discover readers, follow posts, and see what people you follow are reading.
          </p>
        </header>

        <div className="mt-6">
          <FeedSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>

      {isSearching ? (
        <FeedSearchResults
          query={debouncedQuery.trim()}
          results={searchResults}
          loading={searchLoading}
          error={searchError}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
          <div className="space-y-6">
          <div className="pill-tabs" role="tablist" aria-label="Feed content">
            {viewOptions.map((option) => (
              <Link
                key={option.id}
                href={viewHref(option.id)}
                role="tab"
                aria-selected={feedView === option.id}
                data-active={feedView === option.id ? "true" : "false"}
                className="pill-tab"
              >
                {option.label}
              </Link>
            ))}
          </div>

          <div className="pill-tabs" role="tablist" aria-label="Feed type">
            {tabOptions.map((option) => (
              <Link
                key={option.id}
                href={tabHref(option.id)}
                role="tab"
                aria-selected={tab === option.id}
                data-active={tab === option.id ? "true" : "false"}
                className="pill-tab"
              >
                {option.label}
              </Link>
            ))}
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {feedView === "posts" ? (
            <>
              <PostComposer
                userId={user.id}
                onPostCreated={() => {
                  void loadPosts().catch((error) => {
                    console.warn("[feed] posts reload failed:", error);
                  });
                }}
              />

              {!posts ? (
                <LoadingState message="Loading posts…" />
              ) : posts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center">
                  {tab === "following" ? (
                    <>
                      <p className="font-medium text-puce-red">No posts from people you follow</p>
                      <p className="mt-2 text-sm text-text-muted">
                        Follow readers to see their posts here, or share your first post above.
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <ButtonLink href="/feed/?view=posts" variant="primary" size="sm">
                          Browse For You
                        </ButtonLink>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-puce-red">No posts yet</p>
                      <p className="mt-2 text-sm text-text-muted">
                        Be the first to share a reading thought in the composer above, save a draft
                        for later, or follow more readers.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <ul className="space-y-6">
                  {posts.map((post) => (
                    <li key={post.id}>
                      <PostCard
                        post={post}
                        viewerId={user.id}
                        highlighted={post.id === highlightedPostId}
                        onPostChange={() => {
                          void loadPosts().catch((error) => {
                            console.warn("[feed] posts reload failed:", error);
                          });
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : !activityItems ? (
            <LoadingState message="Loading activity…" />
          ) : activityItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center">
              {tab === "following" ? (
                <>
                  <p className="font-medium text-puce-red">Your following feed is empty</p>
                  <p className="mt-2 text-sm text-text-muted">
                    Follow readers to see when they add books, finish reads, and publish reviews.
                    Use the search bar above to find people to follow.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <ButtonLink href="/feed/?view=activity" variant="primary" size="sm">
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
            <ul className="space-y-6">
              {activityItems.map((item) => (
                <li key={item.id}>
                  <FeedCard item={item} />
                </li>
              ))}
            </ul>
          )}

          {feedView === "activity" && tab === "for-you" && activityItems && activityItems.length > 0 ? (
            <p className="text-center text-xs text-text-muted">
              Activity is sorted by most recent.{" "}
              <Link href="/profile/setup" className="text-primary hover:underline">
                Update your genres
              </Link>{" "}
              to improve book recommendations elsewhere.
            </p>
          ) : null}
          </div>

          <aside className="hidden lg:block">
            <section className="sticky top-24 rounded-2xl border border-border bg-surface/90 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-puce-red">Trending</h2>
              <p className="mt-1 text-sm text-text-muted">
                What readers are shelving and reviewing this week.
              </p>
              <div className="mt-4">
                <TrendingNewsletterPanel />
              </div>
            </section>
          </aside>
        </div>
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
