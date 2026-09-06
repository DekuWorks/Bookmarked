"use client";

import { useMemo } from "react";
import {
  deriveReadingPersonality,
  titleCaseDnaLabel,
  type ReadingDna,
  type ReadingDnaCategoryBreakdown,
  type ReadingDnaHabit,
  type ReadingDnaTrait,
} from "@bookmarked/utils/readingDna";
import type { ReadingDnaPrivacyState } from "@bookmarked/utils/readingDnaPrivacy";
import { readingDnaShareCardAllowed } from "@bookmarked/utils/readingDnaPrivacy";
import type { ReadingDnaSnapshotCompareRow } from "@bookmarked/utils/readingDnaCompare";
import type { ReadingDnaBookMatch } from "@bookmarked/utils/readingDnaRecs";
import { LockedFeaturePreview } from "@/components/premium/LockedFeaturePreview";
import { UpgradePrompt } from "@/components/premium/UpgradePrompt";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { ReadingDnaPrivacyPanel } from "@/components/reading-dna/ReadingDnaPrivacyPanel";
import type { ReadingDnaSimilarReader } from "@/lib/services/readingDna";

export type ReadingDnaMetrics = {
  booksRead?: number;
  pagesRead?: number;
  daysRead?: number;
  streakDays?: number;
  topFormatLabel?: string;
};

type Props = {
  dna: ReadingDna;
  hasPlus: boolean;
  hasAi: boolean;
  hasMatches: boolean;
  hasHome: boolean;
  metrics?: ReadingDnaMetrics;
  loading?: boolean;
  compact?: boolean;
  privacy?: ReadingDnaPrivacyState;
  onSavePrivacy?: (next: ReadingDnaPrivacyState) => Promise<{ ok: true } | { ok: false; error: string }>;
  yoy?: ReadingDnaSnapshotCompareRow[];
  mom?: ReadingDnaSnapshotCompareRow[];
  bookMatches?: ReadingDnaBookMatch[];
  similarReaders?: ReadingDnaSimilarReader[];
  onShare?: () => void;
};

const DONUT_COLORS = [
  "#642F37",
  "#B89DBB",
  "#F3904B",
  "#C0350F",
  "#F7C767",
  "#8B6B8E",
  "#D4B8D6",
];

function DnaDonut({ traits }: { traits: ReadingDnaTrait[] }) {
  const gradient = useMemo(() => {
    if (!traits.length) return "conic-gradient(#E8E0E4 0 100%)";
    let cursor = 0;
    const stops = traits.map((trait, index) => {
      const start = cursor;
      cursor += trait.percent;
      return `${DONUT_COLORS[index % DONUT_COLORS.length]} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [traits]);

  return (
    <div
      className="relative mx-auto h-36 w-36 rounded-full motion-safe:transition-[background] motion-safe:duration-500 motion-reduce:transition-none"
      style={{ background: gradient }}
      role="img"
      aria-label={
        traits.length
          ? traits.map((trait) => `${titleCaseDnaLabel(trait.label)} ${trait.percent}%`).join(", ")
          : "No traits yet"
      }
    >
      <div className="absolute inset-[22%] rounded-full bg-surface" />
    </div>
  );
}

function CategoryCard({
  breakdown,
  locked,
}: {
  breakdown: ReadingDnaCategoryBreakdown;
  locked?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-background/70 p-4 text-left dark:bg-background/40",
        locked && "pointer-events-none select-none blur-[2px] opacity-70"
      )}
    >
      <h3 className="font-display text-lg text-puce-red dark:text-primary">{breakdown.title}</h3>
      <p className="mt-0.5 text-xs text-text-muted">{breakdown.subtitle}</p>
      <div className="mt-4">
        <DnaDonut traits={breakdown.traits.slice(0, 7)} />
      </div>
      <ul className="mt-4 space-y-1.5">
        {breakdown.traits.slice(0, 7).map((trait, index) => (
          <li key={`${trait.category}-${trait.label}`} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate capitalize text-text">
              {trait.emoji} {titleCaseDnaLabel(trait.label)}
            </span>
            <span className="font-medium text-puce-red dark:text-primary">{trait.percent}%</span>
          </li>
        ))}
        {!breakdown.traits.length ? (
          <li className="text-sm text-text-muted">{breakdown.emptyCopy}</li>
        ) : null}
      </ul>
    </article>
  );
}

function HabitBars({ habits, locked }: { habits: ReadingDnaHabit[]; locked?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-background/70 p-4 text-left dark:bg-background/40",
        locked && "pointer-events-none select-none blur-[2px] opacity-70"
      )}
    >
      <h3 className="font-display text-lg text-puce-red dark:text-primary">Reading Habits</h3>
      <p className="mt-0.5 text-xs text-text-muted">How you show up as a reader</p>
      <ul className="mt-4 space-y-3">
        {habits.slice(0, 7).map((habit) => (
          <li key={habit.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="capitalize text-text">
                {habit.emoji} {habit.persona ?? titleCaseDnaLabel(habit.label)}
              </span>
              <span className="text-xs text-text-muted">
                {habit.evidenceCount} logged signals
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-puce-red to-primary motion-reduce:transition-none"
                style={{ width: `${Math.min(100, Math.max(habit.evidenceCount * 8, 8))}%` }}
              />
            </div>
          </li>
        ))}
        {!habits.length ? (
          <li className="text-sm text-text-muted">Log a handful of sessions before habit labels appear.</li>
        ) : null}
      </ul>
    </div>
  );
}

export function ReadingDnaDashboard({
  dna,
  hasPlus,
  hasAi,
  hasMatches,
  hasHome,
  metrics,
  loading,
  compact,
  privacy,
  onSavePrivacy,
  yoy = [],
  mom = [],
  bookMatches = [],
  similarReaders = [],
  onShare,
}: Props) {
  const heroTraits = hasPlus ? dna.personaTraits : dna.topTraits;
  const metricItems = [
    metrics?.booksRead != null ? { label: "Books Read", value: String(metrics.booksRead) } : null,
    metrics?.pagesRead != null ? { label: "Pages Read", value: metrics.pagesRead.toLocaleString() } : null,
    metrics?.daysRead != null ? { label: "Days Read", value: String(metrics.daysRead) } : null,
    metrics?.streakDays != null ? { label: "Day Streak", value: String(metrics.streakDays) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-surface", compact && "mt-0")}>
      <header className="relative overflow-hidden bg-gradient-to-br from-puce-red via-[#7a3d4a] to-primary px-5 py-6 text-white sm:px-6">
        {/* Decorative atmosphere — charts stay live UI */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage: "url(/assets/reading-dna/dna-hero-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-puce-red/75 via-[#7a3d4a]/70 to-primary/80" />
        <div className="relative z-[1]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Bookmarked</p>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl">My Reading DNA</h1>
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

          <div className="mt-5 flex flex-wrap gap-2" aria-label="Top Reading DNA traits">
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

          {metricItems.length ? (
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {metricItems.map((item) => (
                <div key={item.label} className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
                  <dt className="text-[11px] uppercase tracking-wide text-white/75">{item.label}</dt>
                  <dd className="mt-0.5 text-lg font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {metrics?.topFormatLabel ? (
            <p className="mt-3 text-sm text-white/85">Top Format: {metrics.topFormatLabel}</p>
          ) : null}
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {!hasPlus ? (
          <UpgradePrompt
            compact
            title="Unlock your full Reading DNA"
            description="Free shows your top 3 traits. Plus unlocks Genre, Vibe, Emotion, Trope DNA, habits, AI insights, and book matches."
          />
        ) : null}

        <div className="relative">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dna.categories.map((breakdown) => (
              <CategoryCard key={breakdown.category} breakdown={breakdown} locked={!hasPlus} />
            ))}
          </div>
          {!hasPlus ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-surface/95 px-4 py-2 text-sm font-semibold text-puce-red shadow-md ring-1 ring-border dark:bg-surface/90">
                Plus unlocks full DNA strands
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          {hasPlus ? (
            <HabitBars habits={dna.habits} />
          ) : (
            <LockedFeaturePreview
              title="Reading Habits"
              description="See morning/night rhythms, binge patterns, and format love on Plus."
            >
              <HabitBars habits={dna.habits} />
            </LockedFeaturePreview>
          )}

          <div className="space-y-4">
            <div className={cn("rounded-2xl border border-border bg-background/70 p-4", !hasAi && "opacity-80")}>
              <h3 className="font-display text-lg text-puce-red dark:text-primary">AI Reading Insight</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {hasAi
                  ? dna.insight
                  : "Plus members get AI insights that explain how your DNA is evolving."}
              </p>
              {!hasAi ? (
                <ButtonLink href="/upgrade/" variant="outline" size="sm" className="mt-3">
                  Unlock AI insights
                </ButtonLink>
              ) : null}
            </div>

            <div className={cn("rounded-2xl border border-border bg-background/70 p-4", !hasMatches && "opacity-80")}>
              <h3 className="font-display text-lg text-puce-red dark:text-primary">Book Matches</h3>
              {hasMatches && bookMatches.length ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {bookMatches.map((match) => (
                    <li key={match.id}>
                      <span className="font-medium text-text">{match.title}</span>
                      <span className="ml-2 text-puce-red">{match.percent}%</span>
                      <p className="text-text-muted">{match.explanation}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {hasMatches
                    ? "Add books to your TBR to see DNA-scored matches. Free trending is unchanged."
                    : "Plus recommends books that match your Reading DNA."}
                </p>
              )}
              {hasMatches ? (
                <ButtonLink href="/search/" variant="secondary" size="sm" className="mt-3">
                  Browse more
                </ButtonLink>
              ) : (
                <ButtonLink href="/upgrade/" variant="outline" size="sm" className="mt-3">
                  Unlock book matches
                </ButtonLink>
              )}
            </div>

            {hasPlus ? (
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <h3 className="font-display text-lg text-puce-red dark:text-primary">Year over year</h3>
                {yoy.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {yoy.slice(0, 5).map((row) => (
                      <li key={`${row.category}-${row.label}`}>
                        {titleCaseDnaLabel(row.label)} {row.delta > 0 ? "+" : ""}
                        {row.delta} pts
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-text-muted">
                    Yearly snapshots stay frozen. A comparison appears after a second year is stored.
                  </p>
                )}
              </div>
            ) : null}

            {hasHome ? (
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <h3 className="font-display text-lg text-puce-red dark:text-primary">This month</h3>
                {mom.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {mom.slice(0, 5).map((row) => (
                      <li key={`${row.category}-${row.label}`}>
                        {titleCaseDnaLabel(row.label)} {row.delta > 0 ? "+" : ""}
                        {row.delta} pts
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-text-muted">
                    Monthly shifts only show when they clear the configured threshold.
                  </p>
                )}
              </div>
            ) : null}

            {hasHome ? (
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <h3 className="font-display text-lg text-puce-red dark:text-primary">Similar readers</h3>
                {similarReaders.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {similarReaders.map((reader) => (
                      <li key={reader.userId}>
                        {reader.displayName} · {reader.percent}%
                        {reader.personalityLabel ? ` · ${reader.personalityLabel}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-text-muted">
                    Match only runs against readers who made their DNA visible.
                  </p>
                )}
              </div>
            ) : null}

            <div className={cn("rounded-2xl border border-primary/30 bg-primary/10 p-4", !hasHome && "opacity-90")}>
              <h3 className="font-display text-lg text-puce-red dark:text-primary">Reading Personality</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {hasHome
                  ? deriveReadingPersonality(dna)?.explanation ??
                    "Home scores an explainable personality from your cached DNA traits — not random AI labels."
                  : "Bookmarked Home adds an explainable Reading Personality, DNA Match %, and an optional Reader Map filter."}
              </p>
              {hasHome && deriveReadingPersonality(dna) ? (
                <p className="mt-2 font-semibold text-puce-red">
                  {deriveReadingPersonality(dna)?.label}
                </p>
              ) : null}
              {hasHome ? (
                <ButtonLink href="/reader-map/" variant="secondary" size="sm" className="mt-3">
                  Reader Map filter
                </ButtonLink>
              ) : (
                <ButtonLink href="/upgrade/" variant="ghost" size="sm" className="mt-3">
                  See Home benefits
                </ButtonLink>
              )}
            </div>
          </div>
        </div>

        {privacy && onSavePrivacy ? <ReadingDnaPrivacyPanel privacy={privacy} onSave={onSavePrivacy} /> : null}

        {onShare && privacy && readingDnaShareCardAllowed(privacy) ? (
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <h3 className="font-display text-lg text-puce-red dark:text-primary">Share card</h3>
            <p className="mt-2 text-sm text-text-muted">
              Sharing is opt-in. Bookmarked never posts your DNA automatically.
            </p>
            <Button size="sm" className="mt-3" onClick={onShare}>
              Share my Reading DNA
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
