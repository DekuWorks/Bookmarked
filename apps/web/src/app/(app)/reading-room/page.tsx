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

let roomCache: { userId: string; data: ReadingRoomData } | null = null;

export default function ReadingRoomPage() {
  const user = useAuthUser();
  const [loaded, setLoaded] = useState<{ userId: string; data: ReadingRoomData } | null>(null);
  const [settledUserId, setSettledUserId] = useState<string | null>(null);
  const cached = user?.id && roomCache?.userId === user.id ? roomCache.data : null;
  const visible = user?.id && loaded?.userId === user.id ? loaded.data : cached;
  const dataSettled = Boolean(user?.id && settledUserId === user.id);

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
      roomCache = { userId: user.id, data: room };
      setLoaded({ userId: user.id, data: room });
      setSettledUserId(user.id);
    } catch (error) {
      console.error("[reading-room] load failed:", error);
      setLoaded((current) => {
        if (current?.userId === user.id) return current;
        const fallback =
          roomCache?.userId === user.id ? roomCache.data : emptyReadingRoomData();
        return { userId: user.id, data: fallback };
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (roomCache && roomCache.userId !== user.id) roomCache = null;
    void loadReadingRoom();
  }, [user, loadReadingRoom]);

  const libraryBooks = useMemo(
    () => visible?.shelves.flatMap((shelf) => shelf.items) ?? [],
    [visible?.shelves]
  );

  useUserBooksRealtime(user?.id, loadReadingRoom);
  useStaleCatalogRefresh(libraryBooks, loadReadingRoom);

  if (user === undefined || (user && !visible)) {
    return <LoadingState message="Loading reading room…" />;
  }

  if (!user || !visible) return null;

  return (
    <div className="reading-room-bg -mx-4 space-y-8 overflow-x-hidden px-4 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <ReadingRoomHeader />

      <ReadingRoomTabs
        userId={user.id}
        data={visible}
        dataSettled={dataSettled}
        onRefresh={() => void loadReadingRoom()}
      />
    </div>
  );
}
