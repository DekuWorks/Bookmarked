"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { LoadingState } from "@/components/ui/LoadingState";
import type { Session } from "@supabase/supabase-js";

type Props = {
  children: React.ReactNode;
};

export function ClientAuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function verifyAccess(session: Session | null) {
      if (cancelled) return;

      if (!session?.user) {
        const redirect = encodeURIComponent(pathname);
        router.replace(`/login/?redirect=${redirect}`);
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

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void verifyAccess(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === "SIGNED_OUT") {
        setReady(false);
        const redirect = encodeURIComponent(pathname);
        router.replace(`/login/?redirect=${redirect}`);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void verifyAccess(session);
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
