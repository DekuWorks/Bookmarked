"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getBecauseYouReadRecommendations,
  type BecauseYouReadRecommendation,
} from "@/lib/services/recommendations";
import { getProfile } from "@/lib/services/profile";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  COVER_IMAGE_REFERRER_POLICY,
  resolveCoverDisplayUrl,
} from "@bookmarked/utils/mediaDisplayUrl";

type Props = {
  userId: string;
  className?: string;
  limit?: number;
};

function searchHref(title: string, author: string | null): string {
  const q = [title, author].filter(Boolean).join(" ");
  return `/search/?q=${encodeURIComponent(q)}`;
}

export function BecauseYouReadPanel({ userId, className, limit = 8 }: Props) {
  const [items, setItems] = useState<BecauseYouReadRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getProfile(userId);
      const recs = await getBecauseYouReadRecommendations(
        userId,
        profile?.favorite_genres,
        limit
      );
      setItems(recs);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState message="Finding recommendations…" />;
  }

  if (!items.length) {
    return (
      <p className="text-sm text-text-muted">
        Add books to your library to get personalized suggestions.
      </p>
    );
  }

  return (
    <div className={className}>
      <p className="mb-4 text-sm text-text-muted">
        Picked from your shelves, genres, and subjects — powered by ISBNdb.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li
            key={item.externalId}
            className="flex gap-3 rounded-lg border border-border bg-surface p-3 transition hover:border-primary/40"
          >
            {item.coverUrl ? (
              <img
                src={resolveCoverDisplayUrl(item.coverUrl, "thumb") ?? item.coverUrl}
                alt=""
                className="h-20 w-14 shrink-0 rounded object-cover"
                loading="lazy"
                referrerPolicy={COVER_IMAGE_REFERRER_POLICY}
              />
            ) : (
              <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-border text-xs text-text-muted">
                No cover
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Link
                href={searchHref(item.title, item.author)}
                className="line-clamp-2 text-sm font-semibold text-puce-red hover:underline"
              >
                {item.title}
              </Link>
              {item.author ? (
                <p className="mt-0.5 truncate text-xs text-text-muted">{item.author}</p>
              ) : null}
              <p className="mt-1 line-clamp-2 text-xs text-primary">{item.reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
