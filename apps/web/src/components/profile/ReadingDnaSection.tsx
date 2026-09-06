"use client";

import { useEffect, useState } from "react";
import { computeReadingDna, titleCaseDnaLabel, type ReadingDna } from "@bookmarked/utils/readingDna";
import { UpgradePrompt } from "@/components/premium/UpgradePrompt";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { readingDnaPath } from "@/lib/routes/readingDna";
import {
  loadReadingDnaBundle,
  persistReadingDnaSnapshot,
} from "@/lib/services/readingDna";

type AccessFeature =
  | "full_reading_dna"
  | "reading_dna_dashboard"
  | "reading_dna_ai_insights"
  | "reading_dna_book_matches"
  | "book_matches"
  | "reading_dna_match"
  | "reader_map";

type Props = {
  userId: string;
  favoriteGenres: string[];
  canAccess: (feature: AccessFeature) => boolean;
};

export function ReadingDnaSection({ userId, favoriteGenres, canAccess }: Props) {
  const [dna, setDna] = useState<ReadingDna>(() =>
    computeReadingDna({ shelves: favoriteGenres.map((genre) => ({ genre })) })
  );
  const [loading, setLoading] = useState(true);

  const hasPlus = canAccess("full_reading_dna");
  const hasHome = canAccess("reading_dna_match");
  const heroTraits = hasPlus ? dna.personaTraits : dna.topTraits;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadReadingDnaBundle(userId, favoriteGenres)
      .then((bundle) => {
        if (cancelled) return;
        setDna(bundle.dna);
        if (!bundle.fromCache) void persistReadingDnaSnapshot(userId, bundle.dna);
      })
      .catch(() => {
        if (!cancelled) {
          setDna(computeReadingDna({ shelves: favoriteGenres.map((genre) => ({ genre })) }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, favoriteGenres]);

  return (
    <section className="surface-card mt-6 overflow-hidden text-left">
      <div className="bg-gradient-to-br from-puce-red via-[#7a3d4a] to-primary px-5 py-6 text-white sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Bookmarked
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl">My Reading DNA</h2>
            <p className="mt-2 max-w-xl text-sm text-white/85">
              {loading ? "Shaping your DNA from your library…" : dna.summary}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              {hasPlus ? (hasHome ? "Home" : "Plus") : "Free · Top 3"}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-white/85">
              Confidence · {dna.confidence}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {heroTraits.length ? (
            heroTraits.map((trait) => (
              <span
                key={`${trait.category}-${trait.label}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur"
              >
                <span aria-hidden>{trait.emoji}</span>
                {trait.persona ?? titleCaseDnaLabel(trait.label)}
              </span>
            ))
          ) : (
            <span className="text-sm text-white/80">No traits yet — finish a few books to begin.</span>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {!hasPlus ? (
          <UpgradePrompt
            compact
            title="Unlock your full Reading DNA"
            description="Free shows your top 3 traits. Open the full DNA page for Genre, Vibe, Emotion, and Trope strands — Plus unlocks the complete view."
          />
        ) : null}
        <ButtonLink href={readingDnaPath()} variant="secondary" size="sm">
          Open full Reading DNA
        </ButtonLink>
      </div>
    </section>
  );
}
