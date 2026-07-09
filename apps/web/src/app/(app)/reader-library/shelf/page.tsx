"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShelfSearchFilter } from "@/components/library/ShelfSearchFilter";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { getShelfConfigBySlug } from "@/lib/constants/shelves";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { readerLibraryPath } from "@/lib/routes/readerLibrary";
import { readerProfilePath } from "@/lib/routes/reader";
import { getProfileByUsername } from "@/lib/services/profile";
import { buildFullShelves, getReaderLibraryBooks } from "@/lib/services/publicLibrary";
import type { ShelfGroup } from "@/lib/services/library";
import type { Profile } from "@/types";

type ShelfData = {
  profile: Profile;
  shelf: ShelfGroup;
};

function ReaderShelfContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username")?.trim() ?? "";
  const shelfSlug = searchParams.get("shelf")?.trim() ?? "";
  const user = useAuthUser();
  const [data, setData] = useState<ShelfData | null | undefined>(undefined);
  const config = getShelfConfigBySlug(shelfSlug);

  useEffect(() => {
    if (!username || !shelfSlug || !config) {
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

      const books = await getReaderLibraryBooks(profile.id);
      const shelves = buildFullShelves(books);
      const shelf = shelves.find((entry) => entry.status === config.status);

      if (!shelf) {
        setData(null);
        return;
      }

      setData({ profile, shelf });
    })();
  }, [username, shelfSlug, config, user]);

  if (!username || !shelfSlug) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">No shelf selected.</p>
        <ButtonLink href="/feed" variant="primary">
          Back to feed
        </ButtonLink>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">Shelf not found.</p>
        <ButtonLink href={readerLibraryPath(username)} variant="primary">
          Back to library
        </ButtonLink>
      </div>
    );
  }

  if (user === undefined || data === undefined) {
    return <LoadingState message="Loading shelf…" />;
  }

  if (!user || !data) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">Shelf not found.</p>
        <ButtonLink href={readerLibraryPath(username)} variant="primary">
          Back to library
        </ButtonLink>
      </div>
    );
  }

  const { profile, shelf } = data;
  const displayName = profile.display_name?.trim() || profile.username || "Reader";
  const libraryHref = readerLibraryPath(username);
  const profileHref = profile.username ? readerProfilePath(profile.username) : "/feed";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <div>
          <p className="text-sm text-text-muted">
            <Link href={profileHref} className="text-primary hover:underline">
              {displayName}&apos;s profile
            </Link>
            {" · "}
            <Link href={libraryHref} className="text-primary hover:underline">
              Library
            </Link>
          </p>
          <h1 className="mt-2 flex items-center justify-center gap-2 text-3xl font-bold text-puce-red sm:text-4xl">
            <span aria-hidden>{config.emoji}</span>
            {config.title}
          </h1>
          <p className="mx-auto mt-1 max-w-xl text-pretty text-text-muted">
            {displayName}&apos;s {config.title.toLowerCase()} shelf
          </p>
          <p className="mt-2 text-sm font-medium text-text">
            {shelf.items.length} {shelf.items.length === 1 ? "book" : "books"}
          </p>
        </div>
      </header>

      <ShelfSearchFilter
        shelf={shelf}
        initialView="bookshelf"
        username={profile.username ?? undefined}
        showHeaderLink={false}
      />
    </div>
  );
}

export default function ReaderShelfPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading shelf…" />}>
      <ReaderShelfContent />
    </Suspense>
  );
}
