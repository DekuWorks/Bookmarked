"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard } from "@/components/social/PostCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { PROFILE_PREVIEW_LIMIT } from "@/components/social/FeedPostsPanel";
import { usePostsRealtime } from "@/lib/hooks/usePostsRealtime";
import { listPostsByUser } from "@/lib/services/posts";
import type { PostWithAuthor } from "@/types";

type Props = {
  profileUserId: string;
  viewerId: string;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  displayName?: string;
  previewLimit?: number;
  className?: string;
};

function fullFeedHref(): string {
  return "/feed/?view=posts";
}

export function ProfilePostsSection({
  profileUserId,
  viewerId,
  isOwnProfile = false,
  isFollowing = false,
  displayName = "this reader",
  previewLimit = PROFILE_PREVIEW_LIMIT,
  className,
}: Props) {
  const canViewPosts = isOwnProfile || isFollowing;
  const [posts, setPosts] = useState<PostWithAuthor[] | null>(canViewPosts ? null : []);
  const [error, setError] = useState<string | null>(null);
  const fetchLimit = previewLimit + 1;

  const loadPosts = useCallback(async () => {
    if (!canViewPosts) {
      setPosts([]);
      return;
    }
    const userPosts = await listPostsByUser(profileUserId, viewerId, fetchLimit);
    setPosts(userPosts);
  }, [canViewPosts, profileUserId, viewerId, fetchLimit]);

  const loadPostsRef = useRef(loadPosts);

  useEffect(() => {
    loadPostsRef.current = loadPosts;
  }, [loadPosts]);

  useEffect(() => {
    setError(null);
    if (!canViewPosts) {
      setPosts([]);
      return;
    }
    setPosts(null);
    void loadPosts().catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load posts.");
      setPosts([]);
    });
  }, [loadPosts, canViewPosts]);

  usePostsRealtime(viewerId, canViewPosts, () => {
    void loadPostsRef.current();
  });

  const visiblePosts = posts ? posts.slice(0, previewLimit) : posts;
  const hasMorePosts = Boolean(posts && posts.length > previewLimit);

  return (
    <section className={className}>
      <h2 className="mb-4 text-lg font-semibold text-puce-red">Posts</h2>

      {!canViewPosts ? (
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
          <p className="font-medium text-puce-red">Posts are for followers</p>
          <p className="mt-2 text-sm text-text-muted">
            Follow {displayName} to see their posts here.
          </p>
        </div>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : !posts ? (
        <LoadingState message="Loading posts…" />
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
          <p className="font-medium text-puce-red">No posts yet</p>
          <p className="mt-2 text-sm text-text-muted">
            {isOwnProfile
              ? "Share a reading thought from your profile feed."
              : `${displayName} hasn't shared any posts yet.`}
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {(visiblePosts ?? []).map((post) => (
              <li key={post.id}>
                <PostCard
                  post={post}
                  viewerId={viewerId}
                  onPostChange={() => {
                    void loadPosts().catch((loadError) => {
                      console.warn("[profile-posts] reload failed:", loadError);
                    });
                  }}
                />
              </li>
            ))}
          </ul>
          {hasMorePosts ? (
            <div className="mt-6 text-center">
              <ButtonLink href={fullFeedHref()} variant="outline" size="sm">
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
