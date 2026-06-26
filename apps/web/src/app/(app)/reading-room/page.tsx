"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/services/profile";
import { getReadingRoomData } from "@/lib/services/readingRoom";
import type { ReadingRoomData } from "@/lib/services/readingRoom";
import { ReadingRoomSection } from "@/components/reading-room/ReadingRoomSection";
import { CurrentlyReadingRow } from "@/components/reading-room/CurrentlyReadingRow";
import { BookMiniGrid } from "@/components/reading-room/BookMiniGrid";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { BookshelfView } from "@/components/library/BookshelfView";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SHELF_CONFIG } from "@/lib/constants/shelves";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

export default function ReadingRoomPage() {
  const user = useAuthUser();
  const [data, setData] = useState<ReadingRoomData | null>(null);
  const [displayName, setDisplayName] = useState("Reader");

  useEffect(() => {
    if (!user) return;
    void getProfile(user.id).then((profile) => {
      setDisplayName(profile?.display_name || profile?.username || "Reader");
      return getReadingRoomData(
        user.id,
        profile?.yearly_reading_goal ?? null,
        profile?.favorite_genres
      );
    }).then((room) => {
      if (room) setData(room);
    });
  }, [user]);

  if (user === undefined || (user && !data)) {
    return <LoadingState message="Loading reading room…" />;
  }

  if (!user || !data) return null;

  return (
    <div className="reading-room-bg -mx-4 space-y-8 overflow-x-hidden px-4 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <header className="animate-fade-in text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Your space
        </p>
        <h1 className="mt-1 text-3xl font-bold text-puce-red md:text-4xl">
          {displayName}&apos;s Reading Room
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-pretty text-text-muted">
          A cozy corner for what you&apos;re reading now, what you&apos;ve finished, and the
          shelves that make up your library.
        </p>
      </header>

      <ReadingRoomSection title="Currently reading" emoji="📖">
        <CurrentlyReadingRow items={data.currentlyReading} />
      </ReadingRoomSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReadingRoomSection title="Recently finished" emoji="✅">
          <BookMiniGrid
            items={data.recentlyFinished}
            emptyMessage="Finished books will appear here."
            emptyAction={{ label: "Browse your library", href: "/library/read" }}
          />
        </ReadingRoomSection>

        <ReadingRoomSection
          title="Favorites"
          emoji="⭐"
          action={
            <span className="text-xs text-text-muted">
              Mark favorites on any book page
            </span>
          }
        >
          <BookMiniGrid
            items={data.favorites}
            emptyMessage="Star books from their detail page to collect favorites here."
            emptyAction={{ label: "Find a book", href: "/search" }}
          />
        </ReadingRoomSection>
      </div>

      <ReadingRoomSection title="Reading stats" emoji="📊">
        <AnalyticsGrid
          analytics={data.analytics}
          readingGoal={data.readingGoal}
          showFuturePlaceholders
          compact
        />
      </ReadingRoomSection>

      <ReadingRoomSection title="Reading goal" emoji="🎯">
        <ReadingGoalPanel status={data.readingGoal} />
      </ReadingRoomSection>

      <ReadingRoomSection title="Your bookshelves" emoji="🪵">
        {data.shelves.every((s) => s.items.length === 0) ? (
          <p className="text-center text-sm text-text-muted">
            Your shelves are empty.{" "}
            <Link href="/search" className="font-medium text-primary hover:underline">
              Search for books
            </Link>{" "}
            to fill your room.
          </p>
        ) : (
          <BookshelfView shelves={data.shelves} />
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SHELF_CONFIG.map((shelf) => (
            <ButtonLink
              key={shelf.slug}
              href={`/library/${shelf.slug}`}
              variant="outline"
              size="sm"
            >
              {shelf.emoji} {shelf.title}
            </ButtonLink>
          ))}
        </div>
      </ReadingRoomSection>
    </div>
  );
}
