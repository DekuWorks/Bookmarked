"use client";

import Link from "next/link";
import { QuoteGraphicsStudio } from "@/components/quotes/QuoteGraphicsStudio";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { layout } from "@/lib/constants/layout";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import { useEffect } from "react";

export default function QuoteGraphicsPage() {
  const user = useAuthUser();

  useEffect(() => {
    if (user === null) {
      staticRedirect("/login/?redirect=%2Fquote-graphics%2F");
    }
  }, [user]);

  if (user === undefined) {
    return <LoadingState message="Loading…" />;
  }

  if (!user) return null;

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Quote graphics</h1>
        <p className="mt-1 text-text-muted">
          Create shareable quote cards. Free includes 3 per month.
        </p>
      </header>
      <p>
        <Link href="/notes/" className="text-sm font-medium text-primary hover:underline">
          ← Back to notes
        </Link>
      </p>
      <QuoteGraphicsStudio userId={user.id} />
    </div>
  );
}
