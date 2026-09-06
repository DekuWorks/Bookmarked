"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getProfile } from "@/lib/services/profile";
import { getReadingRoomData } from "@/lib/services/readingRoom";
import { backfillReadingSessionsForUser } from "@/lib/services/readingSessionBackfill";
import type { ReadingRoomData } from "@/lib/services/readingRoom";
import { ReadingRoomTabs } from "@/components/reading-room/ReadingRoomTabs";
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
          Home
        </p>
        <h1 className="mt-1 text-3xl font-bold text-puce-red md:text-4xl">
          {displayName}&apos;s Reading Room
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-pretty text-text-muted">
          Your reading life in one place — Progress, Trail, Notes, Reviews, and History.
        </p>
      </header>

      <ReadingRoomTabs
        userId={user.id}
        data={data}
        onRefresh={() => void loadReadingRoom()}
      />
    </div>
  );
}
