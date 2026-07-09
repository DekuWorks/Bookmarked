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

const INITIAL_SESSION_FALLBACK_MS = 2500;

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
    let initialSessionHandled = false;

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

    function handleInitialSession(session: Session | null) {
      if (cancelled || initialSessionHandled) return;
      initialSessionHandled = true;
      void verifyAccess(session, true);
    }

    // Wait for INITIAL_SESSION — Supabase fires this after persisted auth is read.
    // Calling getSession() on mount races with hydration and can redirect to login
    // before the post-login session is available (Chrome: "This page couldn't load").
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === "INITIAL_SESSION") {
        handleInitialSession(session);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void verifyAccess(session, false);
        return;
      }

      if (event === "SIGNED_OUT") {
        setReady(false);
        const redirect = encodeURIComponent(pathnameRef.current);
        staticRedirect(`/login/?redirect=${redirect}`);
      }
    });

    const fallbackTimer = window.setTimeout(() => {
      if (cancelled || initialSessionHandled) return;

      void supabase.auth.getSession().then(({ data: { session } }) => {
        handleInitialSession(session);
      });
    }, INITIAL_SESSION_FALLBACK_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return <LoadingState message="Loading your library…" />;
  }

  return children;
}
