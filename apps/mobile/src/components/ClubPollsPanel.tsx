import { useEffect, useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import { PremiumFeatureLock } from "./PremiumFeatureLock";
import { useSubscription } from "../hooks/useSubscription";
import { createClubPoll, listClubPolls, voteClubPoll, type ClubPollRow } from "../services/clubPolls";

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
    <View>
      <Text className="mt-1 text-xs text-ink-muted">
        {poll.allow_multiple ? "Select as many as you like, then save." : "One vote per member."}
      </Text>
      {poll.tallies.map((tally) => {
        const active = poll.allow_multiple ? selected.includes(tally.choiceId) : tally.selectedByViewer;
        return (
          <Pressable key={tally.choiceId} className="mt-1" onPress={() => toggle(tally.choiceId)}>
            <Text className={`text-sm ${active ? "font-semibold text-puce-red" : "text-primary"}`}>
              {tally.label} — {tally.votes} ({tally.percent}%)
              {tally.selectedByViewer ? " · your vote" : ""}
            </Text>
          </Pressable>
        );
      })}
      {poll.allow_multiple ? (
        <Pressable
          className="mt-2 rounded-lg bg-primary px-3 py-2"
          onPress={() => {
            void voteClubPoll(poll.id, selected, true).then((result) => {
              if ("error" in result && result.error) onError(result.error);
              else onVoted();
            });
          }}
        >
          <Text className="text-center text-sm font-semibold text-white">Save votes</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ClubPollsPanel({ clubId, userId }: Props) {
  const { canAccess, loading } = useSubscription();
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

  if (loading) return <Text className="text-sm text-ink-muted">Checking membership…</Text>;
  if (!canAccess("club_polls")) {
    return (
      <PremiumFeatureLock
        compact
        title="Club polls"
        description="Plus members can run club polls."
      />
    );
  }

  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-4">
      <Text className="text-lg font-semibold text-puce-red">Polls</Text>
      <Text className="mt-1 text-xs text-ink-muted">
        Default is one vote. Turn on multi-select if members should pick more than one.
      </Text>
      {error ? <Text className="mt-2 text-sm text-red-600">{error}</Text> : null}
      <TextInput value={question} onChangeText={setQuestion} placeholder="Question" className="mt-3 rounded-lg border border-brand-border px-3 py-2" />
      <TextInput value={choiceA} onChangeText={setChoiceA} placeholder="Choice 1" className="mt-2 rounded-lg border border-brand-border px-3 py-2" />
      <TextInput value={choiceB} onChangeText={setChoiceB} placeholder="Choice 2" className="mt-2 rounded-lg border border-brand-border px-3 py-2" />
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="flex-1 pr-3 text-sm text-ink">Allow multiple choices</Text>
        <Switch
          value={allowMultiple}
          onValueChange={setAllowMultiple}
          trackColor={{ true: "#642F37", false: "#D5C3D7" }}
        />
      </View>
      <Pressable
        className="mt-3 rounded-lg bg-primary px-3 py-2"
        onPress={() => {
          void createClubPoll({ clubId, question, choices: [choiceA, choiceB], allowMultiple }).then((result) => {
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
        <Text className="text-center text-sm font-semibold text-white">Create poll</Text>
      </Pressable>
      {polls.map((poll) => (
        <View key={poll.id} className="mt-4">
          <Text className="font-medium text-puce-red">{poll.question}</Text>
          <PollVoteList
            poll={poll}
            onError={setError}
            onVoted={() => {
              void refresh();
            }}
          />
        </View>
      ))}
    </View>
  );
}
