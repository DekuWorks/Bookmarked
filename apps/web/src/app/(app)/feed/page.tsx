"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FeedCard } from "@/components/social/FeedCard";
import { FeedDiscoveryCard } from "@/components/social/FeedDiscoveryCard";
import { FeedSearchBar } from "@/components/social/FeedSearchBar";
import { FeedSearchResults } from "@/components/social/FeedSearchResults";
import { PostCard } from "@/components/social/PostCard";
import { PostComposer } from "@/components/social/PostComposer";
import { ShareHead } from "@/components/seo/ShareHead";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { FeedCardSkeleton, PostCardSkeleton } from "@/components/ui/Skeleton";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useActivityFeedRealtime } from "@/lib/hooks/useActivityFeedRealtime";
import { usePostsRealtime } from "@/lib/hooks/usePostsRealtime";
import { searchFeed, type FeedSearchResults as FeedSearchData } from "@/lib/services/feedSearch";
import { getProfile } from "@/lib/services/profile";
import { fetchFollowingFeed, fetchForYouFeed } from "@/lib/services/socialFeed";
import type { FeedItem } from "@/lib/services/socialFeed";
import { getPostById, listFeedPosts } from "@/lib/services/posts";
import type { PostWithAuthor } from "@/types";
import { interleaveFeedWithDiscovery } from "@bookmarked/utils/feedDiscovery";
import { truncateShareDescription } from "@bookmarked/utils/sharePreview";
import { layout } from "@/lib/constants/layout";

type PostFeedRow =
  | { kind: "item"; item: PostWithAuthor }
  | { kind: "discovery"; id: "trending" | "shelved" | "reviewed"; afterIndex: number };
type ActivityFeedRow =
  | { kind: "item"; item: FeedItem }
  | { kind: "discovery"; id: "trending" | "shelved" | "reviewed"; afterIndex: number };

type FeedView = "posts" | "activity";
type FeedTab = "for-you" | "following";

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
  const [deepLinkPost, setDeepLinkPost] = useState<PostWithAuthor | null>(null);
  const [deepLinkUnavailable, setDeepLinkUnavailable] = useState(false);

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
    if (!user || !highlightedPostId || feedView !== "posts" || isSearching) {
      setDeepLinkPost(null);
      setDeepLinkUnavailable(false);
      return;
    }

    setDeepLinkUnavailable(false);
    void getPostById(highlightedPostId, user.id)
      .then((post) => {
        if (!post) {
          setDeepLinkPost(null);
          setDeepLinkUnavailable(true);
          return;
        }
        setDeepLinkPost(post);
        setDeepLinkUnavailable(false);
        setPosts((current) => {
          if (!current) return [post];
          if (current.some((item) => item.id === post.id)) return current;
          return [post, ...current];
        });
      })
      .catch(() => {
        setDeepLinkPost(null);
        setDeepLinkUnavailable(true);
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

  const interleavedPosts = useMemo<PostFeedRow[] | null>(
    () => (posts ? interleaveFeedWithDiscovery(posts) : null),
    [posts]
  );
  const interleavedActivity = useMemo<ActivityFeedRow[] | null>(
    () => (activityItems ? interleaveFeedWithDiscovery(activityItems) : null),
    [activityItems]
  );

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

  const deepLinkAuthor =
    deepLinkPost?.author.display_name?.trim() ||
    deepLinkPost?.author.username?.trim() ||
    "a reader";

  return (
    <div className={`${layout.pageStackWide} text-left`}>
      {deepLinkPost ? (
        <ShareHead
          title={deepLinkPost.book?.title?.trim() || `Post by ${deepLinkAuthor}`}
          description={
            truncateShareDescription(deepLinkPost.body) ??
            `${deepLinkAuthor} shared a post on Bookmarked`
          }
          image={deepLinkPost.book?.cover_url ?? deepLinkPost.image_url}
        />
      ) : null}

      <div className="-mx-4 feed-header-gradient px-4 pb-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-5 text-left">
          <header>
            <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Feed</h1>
            <p className="mt-2 text-pretty text-text-muted">
              Discover readers, follow posts, and see what people you follow are reading.
            </p>
          </header>

          <FeedSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>

      {isSearching ? (
        <div className="mx-auto w-full max-w-3xl">
          <FeedSearchResults
            query={debouncedQuery.trim()}
            results={searchResults}
            loading={searchLoading}
            error={searchError}
          />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <div className="pill-tabs overflow-x-auto" role="tablist" aria-label="Feed content">
            {viewOptions.map((option) => (
              <Link
                key={option.id}
                href={viewHref(option.id)}
                role="tab"
                aria-selected={feedView === option.id}
                data-active={feedView === option.id ? "true" : "false"}
                className="pill-tab shrink-0"
              >
                {option.label}
              </Link>
            ))}
          </div>

          <div className="pill-tabs overflow-x-auto" role="tablist" aria-label="Feed type">
            {tabOptions.map((option) => (
              <Link
                key={option.id}
                href={tabHref(option.id)}
                role="tab"
                aria-selected={tab === option.id}
                data-active={tab === option.id ? "true" : "false"}
                className="pill-tab shrink-0"
              >
                {option.label}
              </Link>
            ))}
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {deepLinkUnavailable ? (
            <p className="rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-text-muted">
              This content is no longer available.
            </p>
          ) : null}

          {feedView === "posts" ? (
            <>
              <PostComposer
                userId={user.id}
                onPostCreated={() => {
                  void loadPosts().catch((reloadError) => {
                    console.warn("[feed] posts reload failed:", reloadError);
                  });
                }}
              />

              {!interleavedPosts ? (
                <ul className="space-y-6" aria-busy="true" aria-label="Loading posts">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <li key={index}>
                      <PostCardSkeleton />
                    </li>
                  ))}
                </ul>
              ) : posts && posts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-left">
                  {tab === "following" ? (
                    <>
                      <p className="font-medium text-puce-red">No posts from people you follow</p>
                      <p className="mt-2 text-sm text-text-muted">
                        Follow readers to see their posts here, or share your first post above.
                      </p>
                      <div className="mt-6 flex flex-wrap gap-3">
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
                  {interleavedPosts.map((row, index) =>
                    row.kind === "discovery" ? (
                      <li key={`discovery-${row.id}-${index}`}>
                        <FeedDiscoveryCard sectionId={row.id} />
                      </li>
                    ) : (
                      <li key={row.item.id}>
                        <PostCard
                          post={row.item}
                          viewerId={user.id}
                          highlighted={row.item.id === highlightedPostId}
                          onPostChange={() => {
                            void loadPosts().catch((reloadError) => {
                              console.warn("[feed] posts reload failed:", reloadError);
                            });
                          }}
                        />
                      </li>
                    )
                  )}
                </ul>
              )}
            </>
          ) : !interleavedActivity ? (
            <ul className="space-y-6" aria-busy="true" aria-label="Loading activity">
              {Array.from({ length: 3 }).map((_, index) => (
                <li key={index}>
                  <FeedCardSkeleton />
                </li>
              ))}
            </ul>
          ) : activityItems && activityItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-left">
              {tab === "following" ? (
                <>
                  <p className="font-medium text-puce-red">Your following feed is empty</p>
                  <p className="mt-2 text-sm text-text-muted">
                    Follow readers to see when they add books, finish reads, and publish reviews.
                    Use the search bar above to find people to follow.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
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
              {interleavedActivity.map((row, index) =>
                row.kind === "discovery" ? (
                  <li key={`discovery-${row.id}-${index}`}>
                    <FeedDiscoveryCard sectionId={row.id} />
                  </li>
                ) : (
                  <li key={row.item.id}>
                    <FeedCard
                      item={row.item}
                      viewerId={user.id}
                      onDeleted={(activityId) => {
                        setActivityItems((current) =>
                          (current ?? []).filter((entry) => entry.id !== activityId)
                        );
                      }}
                    />
                  </li>
                )
              )}
            </ul>
          )}

          {feedView === "activity" && tab === "for-you" && activityItems && activityItems.length > 0 ? (
            <p className="text-left text-xs text-text-muted">
              Activity is sorted by most recent.{" "}
              <Link href="/profile/setup" className="text-primary hover:underline">
                Update your genres
              </Link>{" "}
              to improve book recommendations elsewhere.
            </p>
          ) : null}
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
