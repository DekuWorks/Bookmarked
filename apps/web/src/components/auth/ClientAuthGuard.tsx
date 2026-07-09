"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import { LoadingState } from "@/components/ui/LoadingState";
import type { Session } from "@supabase/supabase-js";

type Props = {
  children: React.ReactNode;
};

export function ClientAuthGuard({ children }: Props) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function verifyAccess(session: Session | null, redirectIfMissing: boolean) {
      if (cancelled) return;

      if (!session?.user) {
        if (redirectIfMissing) {
          const redirect = encodeURIComponent(pathnameRef.current);
          staticRedirect(`/login/?redirect=${redirect}`);
        }
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.warn("[auth] profile lookup failed:", error);
          setReady(true);
          return;
        }

        const hasProfile = Boolean(profile?.username?.trim());
        const onSetup = pathnameRef.current.startsWith("/profile/setup");

        if (!hasProfile && !onSetup) {
          staticRedirect("/profile/setup/");
          return;
        }

        setReady(true);
      } catch (error) {
        console.warn("[auth] verifyAccess failed:", error);
        if (!cancelled) setReady(true);
      }
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        void verifyAccess(session, false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void verifyAccess(session, event === "INITIAL_SESSION");
        return;
      }

      if (event === "SIGNED_OUT") {
        setReady(false);
        const redirect = encodeURIComponent(pathnameRef.current);
        staticRedirect(`/login/?redirect=${redirect}`);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return <LoadingState message="Loading your library…" />;
  }

  return children;
}
