"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { PremiumFeatureLock } from "@/components/premium/PremiumFeatureLock";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useToast } from "@/components/ui/Toast";
import { loadMonthlyWrapped } from "@/lib/services/monthlyWrapped";
import { layout } from "@/lib/constants/layout";
import { MONTHLY_WRAPPED_COPY, type MonthlyWrappedRecap } from "@bookmarked/utils/monthlyWrapped";

export default function MonthlyWrappedPage() {
  const user = useAuthUser();
  const { canAccess, loading } = useSubscription(user?.id);
  const toast = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [recap, setRecap] = useState<MonthlyWrappedRecap | null>(null);
  const [months, setMonths] = useState<Array<{ year: number; month: number }>>([]);
  const [shareReady, setShareReady] = useState(false);

  useEffect(() => {
    if (!user || !canAccess("monthly_wrapped")) return;
    let cancelled = false;
    void loadMonthlyWrapped(user.id, year, month).then(({ recap: next, months: available }) => {
      if (cancelled) return;
      setRecap(next);
      setMonths(available.length > 0 ? available : [{ year, month }]);
    });
    return () => {
      cancelled = true;
    };
  }, [user, year, month, canAccess]);

  if (user === undefined || loading) return <LoadingState message="Loading…" />;
  if (!user) return null;
  if (!canAccess("monthly_wrapped")) {
    return (
      <div className={layout.pageStack}>
        <PremiumFeatureLock
          title="Monthly Wrapped"
          description="A Plus recap of the month you actually read. Subscribe in the iOS app — it unlocks here automatically."
        />
      </div>
    );
  }

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">{MONTHLY_WRAPPED_COPY.title}</h1>
        <p className="mt-1 text-text-muted">{MONTHLY_WRAPPED_COPY.subtitle}</p>
      </header>
      <div className="flex flex-wrap justify-center gap-2">
        {months.map((option) => (
          <Button
            key={`${option.year}-${option.month}`}
            type="button"
            size="sm"
            variant={option.year === year && option.month === month ? "primary" : "outline"}
            onClick={() => {
              setYear(option.year);
              setMonth(option.month);
            }}
          >
            {option.year}-{String(option.month).padStart(2, "0")}
          </Button>
        ))}
      </div>
      {!recap ? (
        <LoadingState message="Building your recap…" />
      ) : !recap.hasData ? (
        <p className="text-center text-sm text-text-muted">{MONTHLY_WRAPPED_COPY.emptyMonth}</p>
      ) : (
        <div className="mx-auto grid w-full max-w-xl gap-3">
          <WrappedStat label="Month" value={recap.monthLabel} />
          <WrappedStat label="Books finished" value={String(recap.booksFinished)} />
          <WrappedStat label="Pages read" value={String(recap.pagesRead)} />
          <WrappedStat label="Listening minutes" value={String(recap.listeningMinutes)} />
          <WrappedStat label="Active days" value={String(recap.activeDays)} />
          <WrappedStat label="Longest streak" value={`${recap.longestStreak} days`} />
        </div>
      )}
      <p className="text-center text-xs text-text-muted">{MONTHLY_WRAPPED_COPY.shareHint}</p>
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
          value={`My ${recap.monthLabel} on Bookmarked: ${recap.booksFinished} books finished, ${recap.activeDays} reading days.`}
        />
      ) : null}
      <p className="text-center">
        <Link href="/wrapped/" className="text-sm font-medium text-primary hover:underline">
          Yearly recap
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
