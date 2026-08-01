"use client";

import { useEffect, useState } from "react";
import { DiscoveryBookCard } from "@/components/social/DiscoveryBookCard";
import {
  fetchTrendingSections,
  type TrendingSection,
} from "@/lib/services/trending";
import type { FeedDiscoverySectionId } from "@bookmarked/utils/feedDiscovery";
import { cn } from "@/lib/utils/cn";

const SECTION_TITLES: Record<FeedDiscoverySectionId, string> = {
  trending: "Trending Books",
  shelved: "Most Shelved",
  reviewed: "Most Reviewed",
};

type Props = {
  sectionId: FeedDiscoverySectionId;
  className?: string;
};

export function FeedDiscoveryCard({ sectionId, className }: Props) {
  const [section, setSection] = useState<TrendingSection | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void fetchTrendingSections()
      .then((sections) => {
        if (cancelled) return;
        const match =
          sections.find((row) => row.id === sectionId) ??
          sections.find((row) =>
            row.title.toLowerCase().includes(SECTION_TITLES[sectionId].toLowerCase().split(" ")[0]!)
          ) ??
          null;
        setSection(match);
      })
      .catch(() => {
        if (!cancelled) setSection(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  if (section === undefined) {
    return (
      <article className={cn("surface-card p-5 text-left", className)} aria-busy="true">
        <p className="text-sm text-text-muted">Loading discovery…</p>
      </article>
    );
  }

  if (!section || section.books.length === 0) return null;

  return (
    <article className={cn("surface-card p-5 text-left", className)}>
      <h2 className="text-base font-semibold text-puce-red">
        {SECTION_TITLES[sectionId] ?? section.title}
      </h2>
      <p className="mt-1 text-sm text-text-muted">Scroll to explore what readers are loving.</p>
      <ul className="mt-4 flex items-stretch gap-3 overflow-x-auto pb-1">
        {section.books.map((book) => (
          <DiscoveryBookCard key={book.bookId} book={book} />
        ))}
      </ul>
    </article>
  );
}
