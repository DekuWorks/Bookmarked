"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useToast } from "@/components/ui/Toast";
import { loadYearlyWrapped } from "@/lib/services/yearlyWrapped";
import { layout } from "@/lib/constants/layout";
import { YEARLY_WRAPPED_COPY, type YearlyWrappedRecap } from "@bookmarked/utils/yearlyWrapped";

export default function WrappedPage() {
  const user = useAuthUser();
  const toast = useToast();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [recap, setRecap] = useState<YearlyWrappedRecap | null>(null);
  const [years, setYears] = useState<number[]>([currentYear]);
  const [shareReady, setShareReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void loadYearlyWrapped(user.id, year).then(({ recap: next, years: available }) => {
      if (cancelled) return;
      setRecap(next);
      setYears(available.length > 0 ? available : [year]);
    });
    return () => {
      cancelled = true;
    };
  }, [user, year]);

  if (user === undefined) return <LoadingState message="Loading…" />;
  if (!user) return null;

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">{YEARLY_WRAPPED_COPY.title}</h1>
        <p className="mt-1 text-text-muted">{YEARLY_WRAPPED_COPY.subtitle}</p>
      </header>

      <div className="flex flex-wrap justify-center gap-2">
        {years.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={option === year ? "primary" : "outline"}
            onClick={() => setYear(option)}
          >
            {option}
          </Button>
        ))}
      </div>

      {!recap ? (
        <LoadingState message="Building your recap…" />
      ) : !recap.hasData ? (
        <p className="text-center text-sm text-text-muted">{YEARLY_WRAPPED_COPY.emptyYear}</p>
      ) : (
        <div className="motion-safe:animate-fade-in mx-auto grid w-full max-w-xl gap-3">
          <WrappedStat label="Books finished" value={String(recap.booksFinished)} />
          <WrappedStat label="Pages read" value={String(recap.pagesRead)} />
          <WrappedStat label="Listening minutes" value={String(recap.listeningMinutes)} />
          <WrappedStat label="Active reading days" value={String(recap.activeDays)} />
          <WrappedStat label="Longest streak" value={`${recap.longestStreak} days`} />
          <WrappedStat label="Reviews written" value={String(recap.reviewsWritten)} />
          <WrappedStat label="Quotes saved" value={String(recap.quotesSaved)} />
          {recap.mostReadMonth ? (
            <WrappedStat
              label="Busiest month"
              value={`${recap.mostReadMonth.label} (${recap.mostReadMonth.days} days)`}
            />
          ) : null}
        </div>
      )}

      <p className="text-center text-xs text-text-muted">{YEARLY_WRAPPED_COPY.shareHint}</p>
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          disabled={!recap?.hasData}
          onClick={() => {
            setShareReady(true);
            toast.success("Recap ready to copy. Nothing was posted.");
          }}
        >
          Prepare share text
        </Button>
      </div>
      {shareReady && recap?.hasData ? (
        <textarea
          readOnly
          className="min-h-[120px] w-full rounded-xl border border-border bg-surface p-3 text-sm"
          value={`My ${recap.year} on Bookmarked: ${recap.booksFinished} books finished, ${recap.activeDays} reading days, longest streak ${recap.longestStreak}.`}
        />
      ) : null}

      <p className="text-center">
        <Link href="/reading-room/?tab=progress" className="text-sm font-medium text-primary hover:underline">
          ← Back to Progress
        </Link>
      </p>
    </div>
  );
}

function WrappedStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-left">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-puce-red">{value}</p>
    </div>
  );
}
