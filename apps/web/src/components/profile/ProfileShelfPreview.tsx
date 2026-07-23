"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookMiniGrid } from "@/components/reading-room/BookMiniGrid";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { getShelvesInOrder } from "@/lib/constants/shelves";
import { readerLibraryPath } from "@/lib/routes/readerLibrary";
import { buildShelfPreview, getReaderLibraryBooks } from "@/lib/services/publicLibrary";
import type { ShelfGroup } from "@/lib/services/library";

type Props = {
  ownerId: string;
  username: string | null;
  isOwnProfile: boolean;
  previewLimit?: number;
};

export function ProfileShelfPreview({
  ownerId,
  username,
  isOwnProfile,
  previewLimit = 4,
}: Props) {
  const [shelves, setShelves] = useState<ShelfGroup[] | null>(null);

  useEffect(() => {
    void getReaderLibraryBooks(ownerId).then((books) => {
      setShelves(buildShelfPreview(books, previewLimit));
    });
  }, [ownerId, previewLimit]);

  if (shelves === null) {
    return <LoadingState message="Loading shelves…" />;
  }

  const visibleShelves = shelves.filter((shelf) => shelf.items.length > 0);
  const seeMoreHref = isOwnProfile
    ? "/reading-room"
    : username
      ? readerLibraryPath(username)
      : null;

  if (!visibleShelves.length) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-background px-6 py-8 text-center">
        <p className="text-sm text-text-muted">
          {isOwnProfile
            ? "Your public shelves are empty or set to private."
            : "No public shelves to show yet."}
        </p>
        {isOwnProfile ? (
          <ButtonLink href="/search" variant="primary" size="sm" className="mt-4">
            Find books
          </ButtonLink>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {getShelvesInOrder().map((config) => {
        const shelf = visibleShelves.find((entry) => entry.status === config.status);
        if (!shelf) return null;

        return (
          <div
            key={shelf.status}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-puce-red">
                <ShelfIcon id={config.status} size="medium" />
                {config.title}
              </h3>
              {seeMoreHref ? (
                <Link href={seeMoreHref} className="text-sm font-medium text-primary hover:underline">
                  See more
                </Link>
              ) : null}
            </div>
            <BookMiniGrid
              items={shelf.items}
              emptyMessage={`No books on ${config.title.toLowerCase()}.`}
            />
          </div>
        );
      })}

      {seeMoreHref ? (
        <div className="text-center">
          <ButtonLink href={seeMoreHref} variant="outline" size="sm">
            {isOwnProfile ? "Open Reading Room" : "View full library"}
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
