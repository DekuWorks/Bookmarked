"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type Props = {
  layout?: "inline" | "menu";
};

const linkClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2";

/** Client auth links for public pages — avoids server/client session mismatch hydration warnings. */
export function NavbarPublicAuth({ layout = "inline" }: Props) {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const stacked = layout === "menu";

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setHasSession(Boolean(session));
        setReady(true);
      })
      .catch((error) => {
        console.warn("[auth] getSession failed:", error);
        setHasSession(false);
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 text-sm font-medium",
          stacked && "w-full flex-col gap-2"
        )}
        aria-hidden
      >
        <span className="h-11 w-full max-w-[8rem] rounded-lg bg-border/60" />
        <span className="h-11 w-full max-w-[10rem] rounded-lg bg-border/60" />
      </div>
    );
  }

  if (hasSession) {
    return (
      <Link
        href="/reading-room/"
        className={cn(
          linkClass,
          "bg-primary text-on-primary hover:opacity-90",
          stacked && "w-full"
        )}
      >
        Reading Room
      </Link>
    );
  }

  return (
    <div className={cn("flex shrink-0 items-center gap-3", stacked && "w-full flex-col gap-2")}>
      <Link
        href="/login"
        className={cn(linkClass, "text-puce-red hover:text-rust", stacked && "w-full")}
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className={cn(
          linkClass,
          "bg-royal-orange text-white hover:opacity-90",
          stacked && "w-full"
        )}
      >
        Sign up
      </Link>
    </div>
  );
}
