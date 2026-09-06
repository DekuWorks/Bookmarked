import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { PLUS_INSIGHTS_COPY } from "../../../../packages/utils/plusInsights";
import { ADVANCED_GOAL_KINDS, validateAdvancedGoalDraft } from "../../../../packages/utils/advancedGoals";
import { validateFavoriteAuthorName } from "../../../../packages/utils/favoriteAuthors";
import {
  addFavoriteAuthor,
  createAdvancedGoal,
  listAdvancedGoals,
  listFavoriteAuthors,
  loadPlusInsightsDashboard,
} from "../services/plusInsights";

type Props = { userId: string };

export function PlusInsightsPanel({ userId }: Props) {
  const router = useRouter();
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
  }, [userId]);

  if (error) return <Text className="text-sm text-red-600">{error}</Text>;
  if (!data) return <Text className="text-sm text-ink-muted">Loading Plus insights…</Text>;

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text className="text-sm font-medium text-puce-red">
          Pages / hour: {data.speed.pagesPerHour == null ? "—" : data.speed.pagesPerHour}
        </Text>
        {data.speed.pagesPerHour == null ? (
          <Text className="text-xs text-ink-muted">{PLUS_INSIGHTS_COPY.noSpeed}</Text>
        ) : null}
        <Text className="text-sm text-ink-muted">
          Reading time {formatMinutes(data.time.readingSeconds)} · Listening {formatMinutes(data.time.listeningSeconds)}
        </Text>
      </View>

      <View>
        <Text className="text-sm font-semibold text-puce-red">Pages by week</Text>
        {data.pagesByWeek.map((bucket) => (
          <Text key={bucket.key} className="text-sm text-ink-muted">
            {bucket.label}: {bucket.pages}
          </Text>
        ))}
      </View>

      <View>
        <Text className="text-sm font-semibold text-puce-red">Habits</Text>
        <Text className="mt-1 text-sm text-ink-muted">{data.habits.copy}</Text>
      </View>

      <View>
        <Text className="text-sm font-semibold text-puce-red">Year over year</Text>
        {data.yearOverYear.map((row) => (
          <Text key={row.year} className="text-sm text-ink-muted">
            {row.year}: {row.pages} pages
            {row.complete && row.percentChangePages != null
              ? ` (${row.percentChangePages}%)`
              : row.complete
                ? ""
                : " (incomplete)"}
          </Text>
        ))}
      </View>

      <View>
        <Text className="text-sm font-semibold text-puce-red">Favorite authors</Text>
        <TextInput
          value={authorName}
          onChangeText={setAuthorName}
          placeholder="Author name"
          className="mt-2 rounded-lg border border-brand-border px-3 py-2 text-sm"
        />
        <Pressable
          className="mt-2 rounded-lg bg-primary px-3 py-2"
          onPress={() => {
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
          <Text className="text-center text-sm font-semibold text-white">Save author</Text>
        </Pressable>
        {authors.map((author) => (
          <Text key={author.id} className="mt-1 text-sm text-ink-muted">
            {author.author_name}
          </Text>
        ))}
      </View>

      <View>
        <Text className="text-sm font-semibold text-puce-red">Advanced goals</Text>
        <TextInput
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="Goal name"
          className="mt-2 rounded-lg border border-brand-border px-3 py-2 text-sm"
        />
        <TextInput
          value={goalTarget}
          onChangeText={setGoalTarget}
          placeholder="Target"
          keyboardType="number-pad"
          className="mt-2 rounded-lg border border-brand-border px-3 py-2 text-sm"
        />
        <Pressable
          className="mt-2 rounded-lg bg-primary px-3 py-2"
          onPress={() => {
            const draft = { title: goalTitle, kind: goalKind, targetAmount: Number(goalTarget) };
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
          <Text className="text-center text-sm font-semibold text-white">Add {goalKind} goal</Text>
        </Pressable>
        <Pressable onPress={() => setGoalKind(ADVANCED_GOAL_KINDS[(ADVANCED_GOAL_KINDS.indexOf(goalKind) + 1) % ADVANCED_GOAL_KINDS.length]!)}>
          <Text className="mt-2 text-xs text-primary">Cycle type: {goalKind}</Text>
        </Pressable>
        {goals.map((goal) => (
          <Text key={goal.id} className="mt-1 text-sm text-ink-muted">
            {goal.title} — {goal.kind}
          </Text>
        ))}
      </View>

      <Pressable onPress={() => router.push("/wrapped-month")}>
        <Text className="text-sm font-semibold text-primary">Open monthly Wrapped</Text>
      </Pressable>
    </View>
  );
}

function formatMinutes(seconds: number): string {
  if (seconds <= 0) return "0m";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
