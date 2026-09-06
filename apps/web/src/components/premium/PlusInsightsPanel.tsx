"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PLUS_INSIGHTS_COPY } from "@bookmarked/utils/plusInsights";
import { ADVANCED_GOAL_KINDS, validateAdvancedGoalDraft } from "@bookmarked/utils/advancedGoals";
import { validateFavoriteAuthorName } from "@bookmarked/utils/favoriteAuthors";
import {
  addFavoriteAuthor,
  createAdvancedGoal,
  listAdvancedGoals,
  listFavoriteAuthors,
  loadPlusInsightsDashboard,
} from "@/lib/services/plusInsights";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Props = { userId: string };

export function PlusInsightsPanel({ userId }: Props) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadPlusInsightsDashboard>> | null>(null);
  const [authors, setAuthors] = useState<Array<{ id: string; author_name: string }>>([]);
  const [goals, setGoals] = useState<Array<{ id: string; title: string; kind: string; target_amount: number }>>([]);
  const [authorName, setAuthorName] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalKind, setGoalKind] = useState<(typeof ADVANCED_GOAL_KINDS)[number]>("BOOK_COUNT");
  const [goalTarget, setGoalTarget] = useState("12");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [dashboard, nextAuthors, nextGoals] = await Promise.all([
      loadPlusInsightsDashboard(userId),
      listFavoriteAuthors(userId),
      listAdvancedGoals(userId),
    ]);
    setData(dashboard);
    setAuthors(nextAuthors);
    setGoals(nextGoals);
  }

  useEffect(() => {
    void refresh().catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load Plus insights.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (error) return <p className="text-sm text-rust">{error}</p>;
  if (!data) return <p className="text-sm text-text-muted">Loading Plus insights…</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Pages / hour"
          value={data.speed.pagesPerHour == null ? "—" : String(data.speed.pagesPerHour)}
          hint={data.speed.pagesPerHour == null ? PLUS_INSIGHTS_COPY.noSpeed : undefined}
        />
        <Stat
          label="Reading time"
          value={formatMinutes(data.time.readingSeconds)}
          hint="Print sessions with a timed duration only"
        />
        <Stat
          label="Listening time"
          value={formatMinutes(data.time.listeningSeconds)}
          hint="Tracked separately from reading time"
        />
      </div>

      <section>
        <h3 className="text-sm font-semibold text-puce-red">Pages by week</h3>
        <ul className="mt-2 space-y-1 text-sm text-text-muted">
          {data.pagesByWeek.map((bucket) => (
            <li key={bucket.key}>
              {bucket.label}: {bucket.pages} pages
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-puce-red">Pages by month</h3>
        <ul className="mt-2 space-y-1 text-sm text-text-muted">
          {data.pagesByMonth.map((bucket) => (
            <li key={bucket.key}>
              {bucket.label}: {bucket.pages} pages
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-puce-red">Habits</h3>
        <p className="mt-2 text-sm text-text-muted">{data.habits.copy}</p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-puce-red">Mood analytics</h3>
        {data.moods.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No mood tags on your own sessions yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-text-muted">
            {data.moods.slice(0, 6).map((mood) => (
              <li key={mood.id}>
                {mood.label}: {mood.count}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-puce-red">Year over year</h3>
        <ul className="mt-2 space-y-1 text-sm text-text-muted">
          {data.yearOverYear.map((row) => (
            <li key={row.year}>
              {row.year}: {row.pages} pages
              {row.complete && row.percentChangePages != null
                ? ` (${row.percentChangePages > 0 ? "+" : ""}${row.percentChangePages}%)`
                : row.complete
                  ? " (change omitted — not enough prior pages)"
                  : ` — ${PLUS_INSIGHTS_COPY.incompleteYear}`}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-puce-red">Favorite authors</h3>
        <p className="mt-1 text-xs text-text-muted">You pick these. We never auto-follow anyone.</p>
        <form
          className="mt-2 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = validateFavoriteAuthorName(authorName);
            if (!parsed.ok) {
              setError(parsed.error);
              return;
            }
            void addFavoriteAuthor(userId, parsed.name).then((result) => {
              if ("error" in result && result.error) setError(result.error);
              else {
                setAuthorName("");
                void refresh();
              }
            });
          }}
        >
          <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Author name" />
          <Button type="submit" size="sm">
            Save
          </Button>
        </form>
        <ul className="mt-2 space-y-1 text-sm text-text-muted">
          {authors.map((author) => (
            <li key={author.id}>{author.author_name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-puce-red">Advanced goals</h3>
        <form
          className="mt-2 grid gap-2 sm:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const draft = {
              title: goalTitle,
              kind: goalKind,
              targetAmount: Number(goalTarget),
            };
            const parsed = validateAdvancedGoalDraft(draft);
            if (!parsed.ok) {
              setError(parsed.error);
              return;
            }
            void createAdvancedGoal({
              userId,
              title: draft.title,
              kind: draft.kind,
              targetAmount: draft.targetAmount,
            }).then((result) => {
              if ("error" in result && result.error) setError(result.error);
              else {
                setGoalTitle("");
                void refresh();
              }
            });
          }}
        >
          <Input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Goal name" />
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={goalKind}
            onChange={(e) => setGoalKind(e.target.value as (typeof ADVANCED_GOAL_KINDS)[number])}
          >
            {ADVANCED_GOAL_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
          <Input value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder="Target" />
          <Button type="submit" size="sm">
            Add goal
          </Button>
        </form>
        <ul className="mt-2 space-y-1 text-sm text-text-muted">
          {goals.map((goal) => (
            <li key={goal.id}>
              {goal.title} — {goal.kind} / {goal.target_amount}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm">
        <Link href="/wrapped/month/" className="font-semibold text-primary hover:underline">
          Open monthly Wrapped
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 px-4 py-3">
      <p className="text-2xl font-bold text-puce-red">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
}

function formatMinutes(seconds: number): string {
  if (seconds <= 0) return "0m";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
