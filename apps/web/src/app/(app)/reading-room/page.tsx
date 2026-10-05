"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getProfile } from "@/lib/services/profile";
import {
  emptyReadingRoomData,
  getReadingRoomData,
  type ReadingRoomData,
} from "@/lib/services/readingRoom";
import { backfillReadingSessionsForUser } from "@/lib/services/readingSessionBackfill";
import { ReadingRoomHeader } from "@/components/reading-room/ReadingRoomHeader";
import { ReadingRoomTabs } from "@/components/reading-room/ReadingRoomTabs";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useUserBooksRealtime } from "@/lib/hooks/useUserBooksRealtime";
import { useStaleCatalogRefresh } from "@/lib/hooks/useStaleCatalogRefresh";

export default function ReadingRoomPage() {
  const user = useAuthUser();
  const [data, setData] = useState<ReadingRoomData | null>(null);

  const loadReadingRoom = useCallback(async () => {
    if (!user) return;

    try {
      const profile = await getProfile(user.id);
      void backfillReadingSessionsForUser(user.id);
      const room = await getReadingRoomData(
        user.id,
        profile?.yearly_reading_goal ?? null,
        profile?.favorite_genres
      );
      setData(room);
    } catch (error) {
      console.error("[reading-room] load failed:", error);
      setData((current) => current ?? emptyReadingRoomData());
    }
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
      <ReadingRoomHeader />

      <ReadingRoomTabs
        userId={user.id}
        data={data}
        onRefresh={() => void loadReadingRoom()}
      />
    </div>
  );
}
