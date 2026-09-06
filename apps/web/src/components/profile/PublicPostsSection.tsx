"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/social/PostCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { listPostsByUser } from "@/lib/services/posts";
import type { PostWithAuthor } from "@/types";

type Props = {
  userId: string;
  viewerId: string;
};

export function PublicPostsSection({ userId, viewerId }: Props) {
  const [posts, setPosts] = useState<PostWithAuthor[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listPostsByUser(userId, viewerId, 40)
      .then((next) => {
        if (!cancelled) setPosts(next);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, viewerId]);

  return (
    <section className="rounded-xl border border-border bg-surface p-6 text-left shadow-sm">
      <h2 className="text-lg font-semibold text-puce-red">Posts</h2>
      {posts === null ? (
        <div className="mt-4">
          <LoadingState message="Loading posts…" />
        </div>
      ) : posts.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No posts yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} viewerId={viewerId} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
