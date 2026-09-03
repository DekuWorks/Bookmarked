"use client";

import { useEffect, useState } from "react";
import { ClubCard } from "@/components/clubs/ClubCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { searchClubs } from "@/lib/services/bookClubs";
import type { BookClubSummary } from "@/types";
import { withOriginQuery } from "@bookmarked/utils/navigationOrigin";
import { clubDetailPath } from "@/lib/routes/clubs";

type Props = {
  query: string;
};

export function ClubSearchResults({ query }: Props) {
  const user = useAuthUser();
  const [results, setResults] = useState<BookClubSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || query.trim().length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setResults(null);
    setError(null);

    void searchClubs(user.id, query)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        console.error("[search] club search failed:", err);
        if (!cancelled) {
          setError("Could not search clubs right now.");
          setResults([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, user]);

  if (query.trim().length < 2) {
    return (
      <p className="text-text-muted">Type at least 2 characters to find public book clubs.</p>
    );
  }

  if (results === null) {
    return <LoadingState message="Searching clubs…" />;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center text-sm text-text-muted">
        No clubs found for &ldquo;{query}&rdquo;.
      </p>
    );
  }

  return (
    <ul className="mx-auto grid max-w-2xl gap-3 text-left">
      {results.map((club) => (
        <li key={club.id}>
          <ClubCard
            club={club}
            href={withOriginQuery(clubDetailPath(club.id), {
              origin: "search_clubs",
              query,
              scroll: typeof window !== "undefined" ? Math.round(window.scrollY) : null,
            })}
          />
        </li>
      ))}
    </ul>
  );
}
