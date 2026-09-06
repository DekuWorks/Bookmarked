"use client";

import { useEffect } from "react";
import { ConciergeView } from "@/components/home/ConciergeView";
import { IosHomeSubscribePanel } from "@/components/home/IosHomeSubscribePanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { layout } from "@/lib/constants/layout";
import { staticRedirect } from "@/lib/navigation/staticRedirect";

export default function ConciergePage() {
  const user = useAuthUser();
  const { canAccess, loading } = useSubscription(user?.id);
  const hasHome = canAccess("concierge");

  useEffect(() => {
    if (user === null) staticRedirect("/login/?redirect=%2Fconcierge%2F");
  }, [user]);

  if (user === undefined || (user && loading)) {
    return <LoadingState message="Loading concierge…" />;
  }

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Concierge</h1>
      </header>
      {hasHome ? (
        <ConciergeView />
      ) : (
        <IosHomeSubscribePanel title="Concierge is included with Home" />
      )}
    </div>
  );
}
