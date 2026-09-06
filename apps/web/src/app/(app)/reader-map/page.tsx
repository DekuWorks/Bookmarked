"use client";

import { useEffect } from "react";
import { READER_MAP_NAV_LABEL } from "@bookmarked/utils/readerMap";
import { IosHomeSubscribePanel } from "@/components/home/IosHomeSubscribePanel";
import { ReaderMapView } from "@/components/home/ReaderMapView";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { layout } from "@/lib/constants/layout";
import { staticRedirect } from "@/lib/navigation/staticRedirect";

export default function ReaderMapPage() {
  const user = useAuthUser();
  const { canAccess, loading } = useSubscription(user?.id);
  const hasHome = canAccess("reader_map");

  useEffect(() => {
    if (user === null) staticRedirect("/login/?redirect=%2Freader-map%2F");
  }, [user]);

  if (user === undefined || (user && loading)) {
    return <LoadingState message="Loading Reader Map…" />;
  }

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">{READER_MAP_NAV_LABEL}</h1>
        <p className="mx-auto mt-2 max-w-xl text-pretty text-text-muted">
          Opt-in, coarse, and revocable. Not live tracking. Nearby readers stay off for unknown or
          under-minimum ages.
        </p>
      </header>
      {hasHome ? (
        <ReaderMapView />
      ) : (
        <IosHomeSubscribePanel title="Reader Map is included with Home" />
      )}
    </div>
  );
}
