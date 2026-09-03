"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { LoadingState } from "@/components/ui/LoadingState";
import { searchProfilesForMessaging } from "@/lib/services/messages";
import { readerProfilePath } from "@/lib/routes/reader";
import { withOriginQuery } from "@bookmarked/utils/navigationOrigin";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import type { MessageProfile } from "@/types";

type Props = {
  query: string;
};

export function ReaderSearchResults({ query }: Props) {
  const user = useAuthUser();
  const [results, setResults] = useState<MessageProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || query.trim().length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setResults(null);
    setError(null);

    void searchProfilesForMessaging(query, user.id)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        console.error("[search] reader search failed:", err);
        if (!cancelled) {
          setError("Could not search readers right now.");
          setResults([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, user]);

  if (!user) {
    return (
      <p className="text-sm text-text-muted">
        <Link href="/login/" className="font-medium text-primary hover:underline">
          Log in
        </Link>{" "}
        to search for readers.
      </p>
    );
  }

  if (query.trim().length < 2) {
    return (
      <p className="text-text-muted">Type at least 2 characters to find readers by name or @username.</p>
    );
  }

  if (results === null) {
    return <LoadingState message="Searching readers…" />;
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
        No readers found for &ldquo;{query}&rdquo;.
      </p>
    );
  }

  return (
    <ul className="mx-auto grid max-w-2xl gap-3 text-left">
      {results.map((profile) => {
        const label = profile.display_name?.trim() || profile.username?.trim() || "Reader";
        const href = profile.username
          ? withOriginQuery(readerProfilePath(profile.username), {
              origin: "search_people",
              query,
              scroll: typeof window !== "undefined" ? Math.round(window.scrollY) : null,
            })
          : null;

        return (
          <li key={profile.id}>
            {href ? (
              <Link
                href={href}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                <ProfileAvatar profile={profile} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-text">{label}</span>
                  {profile.username ? (
                    <span className="block text-sm text-text-muted">@{profile.username}</span>
                  ) : null}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
                <ProfileAvatar profile={profile} size="md" />
                <span className="font-semibold text-text">{label}</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
