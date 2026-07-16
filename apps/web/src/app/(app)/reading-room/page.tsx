"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getProfile } from "@/lib/services/profile";
import { getReadingRoomData } from "@/lib/services/readingRoom";
import { backfillReadingSessionsForUser } from "@/lib/services/readingSessionBackfill";
import type { ReadingRoomData } from "@/lib/services/readingRoom";
import { ReadingRoomSection } from "@/components/reading-room/ReadingRoomSection";
import { CurrentlyReadingRow } from "@/components/reading-room/CurrentlyReadingRow";
import { BookMiniGrid } from "@/components/reading-room/BookMiniGrid";
import { ReadingActivityPanel } from "@/components/analytics/ReadingActivityPanel";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { SuggestedShelvesPanel } from "@/components/shelves/SuggestedShelvesPanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useUserBooksRealtime } from "@/lib/hooks/useUserBooksRealtime";
import { useStaleCatalogRefresh } from "@/lib/hooks/useStaleCatalogRefresh";

export default function ReadingRoomPage() {
  const user = useAuthUser();
  const [data, setData] = useState<ReadingRoomData | null>(null);
  const [displayName, setDisplayName] = useState("Reader");

  const loadReadingRoom = useCallback(async () => {
    if (!user) return;

    const profile = await getProfile(user.id);
    setDisplayName(profile?.display_name || profile?.username || "Reader");
    void backfillReadingSessionsForUser(user.id);
    const room = await getReadingRoomData(
      user.id,
      profile?.yearly_reading_goal ?? null,
      profile?.favorite_genres
    );
    setData(room);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadReadingRoom();
  }, [user, loadReadingRoom]);

  const libraryBooks = useMemo(
    () => data?.shelves.flatMap((shelf) => shelf.items) ?? [],
    [data?.shelves]
  );

  useUserBooksRealtime(user?.id, loadReadingRoom);
  useStaleCatalogRefresh(libraryBooks, loadReadingRoom);

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
          A cozy corner for what you&apos;re reading now, what you&apos;ve finished, and your
          favorite reads.{" "}
          <Link href="/notes/" className="font-medium text-primary hover:underline">
            Search your reading notes
          </Link>
          .
        </p>
      </header>

      <ReadingRoomSection title="Currently reading" emoji="📖">
        <CurrentlyReadingRow items={data.currentlyReading} onItemsChange={loadReadingRoom} />
      </ReadingRoomSection>

      <ReadingRoomSection title="Reading goal" emoji="🎯">
        <ReadingGoalPanel
          status={data.readingGoal}
          onSaved={() => void loadReadingRoom()}
        />
      </ReadingRoomSection>

      <SuggestedShelvesPanel
        userId={user.id}
        variant="reading-room"
        className="rounded-xl border border-border bg-surface/80 p-5 shadow-sm"
        onShelfCreated={() => void loadReadingRoom()}
      />

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

      <ReadingRoomSection title="Reading statistics" emoji="📊">
        <ReadingActivityPanel userId={user.id} />
      </ReadingRoomSection>
    </div>
  );
}
