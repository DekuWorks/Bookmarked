"use client";

import Link from "next/link";
import { useState } from "react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
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
  const profileHref = username ? readerProfilePath(username) : null;

  const profileBody = (
    <>
      <p className="font-semibold text-puce-red group-hover:underline">{displayName}</p>
      {username ? <p className="text-sm text-text-muted">@{username}</p> : null}
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
    </>
  );

  return (
    <article className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
      {profileHref ? (
        <Link
          href={profileHref}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2"
          aria-label={`View ${displayName}'s profile`}
        >
          <ProfileAvatar profile={reader} size="lg" />
        </Link>
      ) : (
        <ProfileAvatar profile={reader} size="lg" className="shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        {profileHref ? (
          <Link
            href={profileHref}
            className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          >
            {profileBody}
          </Link>
        ) : (
          profileBody
        )}
        {profileHref ? (
          <Link
            href={profileHref}
            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
          >
            View profile
          </Link>
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
