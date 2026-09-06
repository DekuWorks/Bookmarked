"use client";

import { useEffect } from "react";
import { BOOK_MAP_NAV_LABEL } from "@bookmarked/utils/bookMap";
import { BookMapView } from "@/components/home/BookMapView";
import { IosHomeSubscribePanel } from "@/components/home/IosHomeSubscribePanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { layout } from "@/lib/constants/layout";
import { staticRedirect } from "@/lib/navigation/staticRedirect";

export default function BookMapPage() {
  const user = useAuthUser();
  const { canAccess, loading } = useSubscription(user?.id);
  const hasHome = canAccess("book_map");

  useEffect(() => {
    if (user === null) staticRedirect("/login/?redirect=%2Fbook-map%2F");
  }, [user]);

  if (user === undefined || (user && loading)) {
    return <LoadingState message="Loading Book Map…" />;
  }

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">{BOOK_MAP_NAV_LABEL}</h1>
        <p className="mx-auto mt-2 max-w-xl text-pretty text-text-muted">
          Independent bookstores, libraries, and explicit reading cafés. This is not the Overview
          Home tab.
        </p>
      </header>
      {hasHome ? <BookMapView /> : <IosHomeSubscribePanel title="Book Map is included with Home" />}
    </div>
  );
}
