"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookshelfView } from "@/components/library/BookshelfView";
import { FollowStats } from "@/components/social/FollowStats";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { getFollowCounts, isFollowing } from "@/lib/services/follows";
import { getProfileByUsername } from "@/lib/services/profile";
import { buildFullShelves, getReaderLibraryBooks } from "@/lib/services/publicLibrary";
import { readerProfilePath } from "@/lib/routes/reader";
import type { ShelfGroup } from "@/lib/services/library";
import type { Profile } from "@/types";

type LibraryData = {
  profile: Profile;
  shelves: ShelfGroup[];
  counts: Awaited<ReturnType<typeof getFollowCounts>>;
  following: boolean;
};

function ReaderLibraryContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username")?.trim() ?? "";
  const user = useAuthUser();
  const [data, setData] = useState<LibraryData | null | undefined>(undefined);

  useEffect(() => {
    if (!username) {
      setData(null);
      return;
    }
    if (!user) return;

    void (async () => {
      const profile = await getProfileByUsername(username);
      if (!profile) {
        setData(null);
        return;
      }

      const [books, counts, following] = await Promise.all([
        getReaderLibraryBooks(profile.id),
        getFollowCounts(profile.id),
        user.id === profile.id ? Promise.resolve(false) : isFollowing(user.id, profile.id),
      ]);

      setData({
        profile,
        shelves: buildFullShelves(books),
        counts,
        following,
      });
    })();
  }, [username, user]);

  if (!username) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">No reader selected.</p>
        <ButtonLink href="/feed" variant="primary">
          Back to feed
        </ButtonLink>
      </div>
    );
  }

  if (user === undefined || data === undefined) {
    return <LoadingState message="Loading library…" />;
  }

  if (!user || !data) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">Reader not found.</p>
        <ButtonLink href="/feed" variant="primary">
          Back to feed
        </ButtonLink>
      </div>
    );
  }

  const { profile, shelves, counts } = data;
  const displayName = profile.display_name?.trim() || profile.username || "Reader";
  const visibleShelves = shelves.filter((shelf) => shelf.items.length > 0);
  const profileHref = profile.username ? readerProfilePath(profile.username) : "/feed";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-3">
        <p className="text-sm text-text-muted">
          <Link href={profileHref} className="text-primary hover:underline">
            ← {displayName}&apos;s profile
          </Link>
        </p>
        <h1 className="text-3xl font-bold text-puce-red">{displayName}&apos;s library</h1>
        <p className="text-text-muted">Public shelves this reader has chosen to share.</p>
        <FollowStats
          profileUserId={profile.id}
          viewerId={user.id}
          profileName={displayName}
          counts={counts}
        />
      </header>

      {visibleShelves.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center text-sm text-text-muted">
          This reader has no public shelves to show.
        </p>
      ) : (
        <BookshelfView shelves={visibleShelves} />
      )}
    </div>
  );
}

export default function ReaderLibraryPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading library…" />}>
      <ReaderLibraryContent />
    </Suspense>
  );
}
