"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Client auth links for public pages — avoids server/client session mismatch hydration warnings. */
export function NavbarPublicAuth() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(Boolean(session));
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center gap-4 text-sm font-medium" aria-hidden>
        <span className="h-9 w-16 rounded-lg bg-border/60" />
        <span className="h-9 w-20 rounded-lg bg-border/60" />
      </div>
    );
  }

  if (hasSession) {
    return (
      <Link
        href="/dashboard"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="text-sm font-medium text-puce-red hover:text-rust">
        Log in
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-royal-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Sign up
      </Link>
    </>
  );
}
