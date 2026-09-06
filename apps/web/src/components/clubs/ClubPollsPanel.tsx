"use client";

import { useEffect, useState } from "react";
import { PremiumFeatureLock } from "@/components/premium/PremiumFeatureLock";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { createClubPoll, listClubPolls, voteClubPoll, type ClubPollRow } from "@/lib/services/clubPolls";

type Props = {
  clubId: string;
  userId: string;
};

function PollVoteList({
  poll,
  onError,
  onVoted,
}: {
  poll: ClubPollRow;
  onError: (message: string) => void;
  onVoted: () => void;
}) {
  const initial = poll.tallies.filter((tally) => tally.selectedByViewer).map((tally) => tally.choiceId);
  const [selected, setSelected] = useState<string[]>(initial);

  useEffect(() => {
    setSelected(poll.tallies.filter((tally) => tally.selectedByViewer).map((tally) => tally.choiceId));
  }, [poll]);

  function toggle(choiceId: string) {
    if (!poll.allow_multiple) {
      void voteClubPoll(poll.id, [choiceId], false).then((result) => {
        if ("error" in result && result.error) onError(result.error);
        else onVoted();
      });
      return;
    }
    setSelected((current) =>
      current.includes(choiceId) ? current.filter((id) => id !== choiceId) : [...current, choiceId]
    );
  }

  return (
    <>
      <p className="mt-1 text-xs text-text-muted">
        {poll.allow_multiple ? "Select as many as you like, then save." : "One vote per member."}
      </p>
      <ul className="mt-2 space-y-2">
        {poll.tallies.map((tally) => {
          const active = poll.allow_multiple ? selected.includes(tally.choiceId) : tally.selectedByViewer;
          return (
            <li key={tally.choiceId}>
              <button
                type="button"
                className={`text-sm hover:underline ${active ? "font-semibold text-puce-red" : "text-primary"}`}
                onClick={() => toggle(tally.choiceId)}
              >
                {tally.label}
              </button>
              <span className="ml-2 text-xs text-text-muted">
                {tally.votes} ({tally.percent}%)
                {tally.selectedByViewer ? " · your vote" : ""}
              </span>
            </li>
          );
        })}
      </ul>
      {poll.allow_multiple ? (
        <Button
          type="button"
          size="sm"
          className="mt-2"
          onClick={() => {
            void voteClubPoll(poll.id, selected, true).then((result) => {
              if ("error" in result && result.error) onError(result.error);
              else onVoted();
            });
          }}
        >
          Save votes
        </Button>
      ) : null}
    </>
  );
}

export function ClubPollsPanel({ clubId, userId }: Props) {
  const { canAccess, loading } = useSubscription(userId);
  const [polls, setPolls] = useState<ClubPollRow[]>([]);
  const [question, setQuestion] = useState("");
  const [choiceA, setChoiceA] = useState("");
  const [choiceB, setChoiceB] = useState("");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setPolls(await listClubPolls(clubId, userId));
  }

  useEffect(() => {
    if (!canAccess("club_polls")) return;
    void refresh().catch((err) => setError(err instanceof Error ? err.message : "Could not load polls."));
  }, [clubId, userId, canAccess]);

  if (loading) return <p className="text-sm text-text-muted">Checking membership…</p>;
  if (!canAccess("club_polls")) {
    return (
      <PremiumFeatureLock
        compact
        title="Club polls"
        description="Plus members can run club polls. Subscribe in the iOS app."
      />
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-puce-red">Polls</h2>
      <p className="mt-1 text-sm text-text-muted">
        Default is one vote. Turn on multi-select if members should pick more than one.
      </p>
      {error ? <p className="mt-2 text-sm text-rust">{error}</p> : null}
      <form
        className="mt-4 grid gap-2 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          void createClubPoll({
            clubId,
            question,
            choices: [choiceA, choiceB],
            allowMultiple,
          }).then((result) => {
            if ("error" in result && result.error) setError(result.error);
            else {
              setQuestion("");
              setChoiceA("");
              setChoiceB("");
              setAllowMultiple(false);
              void refresh();
            }
          });
        }}
      >
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question" />
        <Input value={choiceA} onChange={(e) => setChoiceA(e.target.value)} placeholder="Choice 1" />
        <Input value={choiceB} onChange={(e) => setChoiceB(e.target.value)} placeholder="Choice 2" />
        <label className="flex items-center gap-2 text-sm text-text sm:col-span-2">
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(e) => setAllowMultiple(e.target.checked)}
            className="rounded border-border"
          />
          Allow multiple choices
        </label>
        <Button type="submit" size="sm">
          Create poll
        </Button>
      </form>
      <div className="mt-6 space-y-4">
        {polls.map((poll) => (
          <article key={poll.id} className="rounded-lg border border-border p-3">
            <h3 className="font-medium text-puce-red">{poll.question}</h3>
            <PollVoteList
              poll={poll}
              onError={setError}
              onVoted={() => {
                void refresh();
              }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
