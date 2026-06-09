"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingState } from "@/components/ui/LoadingState";

type Props = {
  children: React.ReactNode;
};

export function ClientAuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        const redirect = encodeURIComponent(pathname);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      void supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          const hasProfile = Boolean(profile?.username?.trim());
          const onSetup = pathname.startsWith("/profile/setup");

          if (!hasProfile && !onSetup) {
            router.replace("/profile/setup");
            return;
          }
          if (hasProfile && onSetup) {
            router.replace("/dashboard");
            return;
          }
          setReady(true);
        });
    });
  }, [pathname, router]);

  if (!ready) {
    return <LoadingState message="Loading your library…" />;
  }

  return children;
}
