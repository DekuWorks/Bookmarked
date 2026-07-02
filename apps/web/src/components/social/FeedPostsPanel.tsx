"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard } from "@/components/social/PostCard";
import { PostComposer } from "@/components/social/PostComposer";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { usePostsRealtime } from "@/lib/hooks/usePostsRealtime";
import { getPostById, listFeedPosts } from "@/lib/services/posts";
import type { PostWithAuthor } from "@/types";
import { cn } from "@/lib/utils/cn";

export type FeedTab = "for-you" | "following";

export function parseFeedTab(value: string | null): FeedTab {
  return value === "following" ? "following" : "for-you";
}

const tabOptions: { id: FeedTab; label: string }[] = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following" },
];

const DEFAULT_POST_LIMIT = 30;
const PROFILE_PREVIEW_LIMIT = 8;

type Props = {
  userId: string;
  tab: FeedTab;
  tabHref: (tab: FeedTab) => string;
  highlightedPostId?: string | null;
  showComposer?: boolean;
  showViewFeedLink?: boolean;
  showTabBar?: boolean;
  previewLimit?: number;
  className?: string;
};

function fullFeedHref(tab: FeedTab): string {
  const params = new URLSearchParams();
  params.set("view", "posts");
  if (tab !== "for-you") params.set("tab", tab);
  return `/feed/?${params.toString()}`;
}

export function FeedPostsPanel({
  userId,
  tab,
  tabHref,
  highlightedPostId = null,
  showComposer = false,
  showViewFeedLink = false,
  showTabBar = true,
  previewLimit,
  className,
}: Props) {
  const [posts, setPosts] = useState<PostWithAuthor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchLimit = previewLimit ? previewLimit + 1 : DEFAULT_POST_LIMIT;

  const loadPosts = useCallback(async () => {
    const feedPosts = await listFeedPosts(userId, tab, fetchLimit);
    setPosts(feedPosts);
  }, [userId, tab, fetchLimit]);

  const loadPostsRef = useRef(loadPosts);

  useEffect(() => {
    loadPostsRef.current = loadPosts;
  }, [loadPosts]);

  useEffect(() => {
    setError(null);
    setPosts(null);
    void loadPosts().catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load posts.");
      setPosts([]);
    });
  }, [loadPosts]);

  usePostsRealtime(userId, true, () => {
    void loadPostsRef.current();
  });

  useEffect(() => {
    if (!highlightedPostId) return;

    void getPostById(highlightedPostId, userId)
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
  }, [highlightedPostId, userId]);

  useEffect(() => {
    if (!highlightedPostId) return;

    const handle = window.setTimeout(() => {
      document.getElementById(`post-${highlightedPostId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [highlightedPostId, posts]);

  const visiblePosts =
    previewLimit && posts ? posts.slice(0, previewLimit) : posts;
  const hasMorePosts = Boolean(previewLimit && posts && posts.length > previewLimit);

  return (
    <section className={className}>
      {showTabBar || showViewFeedLink ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {showTabBar ? (
            <h2 className="text-lg font-semibold text-puce-red">Your feed</h2>
          ) : (
            <span />
          )}
          {showViewFeedLink ? (
            <Link href="/feed/?view=posts" className="text-sm font-medium text-primary hover:underline">
              Open full feed
            </Link>
          ) : null}
        </div>
      ) : null}

      {showTabBar ? (
        <div
          className="mb-4 flex gap-2 rounded-lg border border-border bg-background p-1"
          role="tablist"
          aria-label="Feed type"
        >
          {tabOptions.map((option) => (
            <Link
              key={option.id}
              href={tabHref(option.id)}
              role="tab"
              aria-selected={tab === option.id}
              className={cn(
                "flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold transition-colors",
                tab === option.id
                  ? "bg-primary text-puce-red shadow-sm"
                  : "text-text-muted hover:text-text"
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
      ) : null}

      {showComposer ? (
        <PostComposer
          userId={userId}
          onPostCreated={() => {
            void loadPosts().catch((error) => {
              console.warn("[feed-posts] reload failed:", error);
            });
          }}
        />
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!posts ? (
        <LoadingState message="Loading posts…" />
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center">
          {tab === "following" ? (
            <>
              <p className="font-medium text-puce-red">No posts from people you follow</p>
              <p className="mt-2 text-sm text-text-muted">
                Follow readers to see their posts here, or share your first post
                {showComposer ? " above" : " from your profile"}.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ButtonLink href={tabHref("for-you")} variant="primary" size="sm">
                  Browse For You
                </ButtonLink>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-puce-red">No posts yet</p>
              <p className="mt-2 text-sm text-text-muted">
                Be the first to share a reading thought
                {showComposer ? " in the composer above" : ""}, or follow more readers.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {(visiblePosts ?? []).map((post) => (
              <li key={post.id}>
                <PostCard
                  post={post}
                  viewerId={userId}
                  highlighted={post.id === highlightedPostId}
                  onPostChange={() => {
                    void loadPosts().catch((error) => {
                      console.warn("[feed-posts] reload failed:", error);
                    });
                  }}
                />
              </li>
            ))}
          </ul>
          {hasMorePosts ? (
            <div className="mt-6 text-center">
              <ButtonLink href={fullFeedHref(tab)} variant="outline" size="sm">
                View more
              </ButtonLink>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export { PROFILE_PREVIEW_LIMIT };
