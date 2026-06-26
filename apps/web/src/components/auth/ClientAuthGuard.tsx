"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { LoadingState } from "@/components/ui/LoadingState";

type Props = {
  children: React.ReactNode;
};

export function ClientAuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        if (!session) {
          if (event === "INITIAL_SESSION") {
            const redirect = encodeURIComponent(pathname);
            router.replace(`/login/?redirect=${redirect}`);
          }
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .maybeSingle();

        if (cancelled) return;

        const hasProfile = Boolean(profile?.username?.trim());
        const onSetup = pathname.startsWith("/profile/setup");

        if (!hasProfile && !onSetup) {
          router.replace("/profile/setup");
          return;
        }

        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (!ready) {
    return <LoadingState message="Loading your library…" />;
  }

  return children;
}
