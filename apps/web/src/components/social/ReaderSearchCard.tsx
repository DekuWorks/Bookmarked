"use client";

import Link from "next/link";
import { useState } from "react";
import { FollowButton } from "@/components/social/FollowButton";
import { readerProfilePath } from "@/lib/routes/reader";
import type { ReaderSearchResult } from "@/lib/services/feedSearch";

type Props = {
  reader: ReaderSearchResult;
};

export function ReaderSearchCard({ reader }: Props) {
  const [following, setFollowing] = useState(reader.isFollowing);
  const displayName =
    reader.display_name?.trim() || reader.username?.trim() || "Reader";
  const username = reader.username?.trim();

  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
      <div className="min-w-0">
        {username ? (
          <Link
            href={readerProfilePath(username)}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange rounded-sm"
          >
            <p className="font-semibold text-puce-red hover:underline">{displayName}</p>
            <p className="text-sm text-text-muted">@{username}</p>
          </Link>
        ) : (
          <p className="font-semibold text-puce-red">{displayName}</p>
        )}
        {reader.bio ? (
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">{reader.bio}</p>
        ) : null}
        {reader.favorite_genres?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {reader.favorite_genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-puce-red"
              >
                {genre}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {!reader.isSelf && username ? (
        <FollowButton
          targetUserId={reader.id}
          initialFollowing={following}
          onChange={setFollowing}
        />
      ) : null}
    </article>
  );
}
