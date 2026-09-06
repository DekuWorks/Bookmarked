"use client";

import { useEffect } from "react";
import { HOME_HUB_NAV_LABEL } from "@bookmarked/utils/bookMap";
import { HomeHubView } from "@/components/home/HomeHubView";
import { IosHomeSubscribePanel } from "@/components/home/IosHomeSubscribePanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { layout } from "@/lib/constants/layout";
import { staticRedirect } from "@/lib/navigation/staticRedirect";

export default function HomeHubPage() {
  const user = useAuthUser();
  const { canAccess, loading } = useSubscription(user?.id);
  const hasHome = canAccess("home_hub");

  useEffect(() => {
    if (user === null) staticRedirect("/login/?redirect=%2Fhome-hub%2F");
  }, [user]);

  if (user === undefined || (user && loading)) {
    return <LoadingState message="Loading Home Hub…" />;
  }

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">{HOME_HUB_NAV_LABEL}</h1>
      </header>
      {hasHome ? <HomeHubView /> : <IosHomeSubscribePanel title="Home Hub is included with Home" />}
    </div>
  );
}
