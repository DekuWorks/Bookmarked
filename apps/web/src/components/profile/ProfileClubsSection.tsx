"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { getUserClubs } from "@/lib/services/bookClubs";
import { clubDetailPath, clubsPath } from "@/lib/routes/clubs";
import type { BookClubSummary } from "@/types";

type Props = {
  profileUserId: string;
  viewerId: string;
  isOwnProfile: boolean;
};

export function ProfileClubsSection({ profileUserId, viewerId, isOwnProfile }: Props) {
  const [clubs, setClubs] = useState<BookClubSummary[] | null>(null);

  useEffect(() => {
    void getUserClubs(profileUserId, viewerId)
      .then(setClubs)
      .catch(() => setClubs([]));
  }, [profileUserId, viewerId]);

  if (clubs === null) {
    return <p className="text-sm text-text-muted">Loading book clubs…</p>;
  }

  if (clubs.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        {isOwnProfile ? (
          <>
            You haven&apos;t joined any book clubs yet.{" "}
            <Link href={clubsPath()} className="text-primary hover:underline">
              Discover clubs
            </Link>
          </>
        ) : (
          "No public book clubs yet."
        )}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {clubs.map((club) => (
        <li key={club.id}>
          <Link
            href={clubDetailPath(club.id)}
            className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 transition hover:border-primary/40"
          >
            <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md">
              {club.current_book ? (
                <BookCover
                  title={club.current_book.title}
                  author={club.current_book.author}
                  coverUrl={club.current_book.cover_url}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-puce-red/10 to-royal-orange/25 text-xl">
                  📚
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-puce-red">{club.name}</p>
              <p className="truncate text-xs text-text-muted">
                {club.member_count} member{club.member_count === 1 ? "" : "s"}
                {club.viewer_role === "owner" ? " · Owner" : ""}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
