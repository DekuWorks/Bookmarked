import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../src/components/Button";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { useSubscription } from "../../../src/hooks/useSubscription";
import { createChallenge } from "../../../src/services/challenges/ChallengeService";
import { IOS_SUBSCRIBE_COPY } from "../../../../../packages/utils/subscription";
import {
  CHALLENGE_GOAL_TYPES,
  CHALLENGE_VISIBILITIES,
  isChallengeGoalType,
  isChallengeVisibility,
  type ChallengeGoalType,
  type ChallengeVisibility,
} from "../../../../../packages/utils/challengeTypes";
import { challengeVisibilityLabel } from "../../../../../packages/utils";

export default function CreateChallengeRoute() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<ChallengeGoalType>("BOOK_COUNT");
  const [goalAmount, setGoalAmount] = useState("12");
  const [visibility, setVisibility] = useState<ChallengeVisibility>("private");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isPremium) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Create Challenge" fallbackHref="/challenges" />
        <View className="p-4">
          <Text className="text-lg font-semibold text-puce-red">{IOS_SUBSCRIBE_COPY.headline}</Text>
          <Text className="mt-2 text-ink-muted">{IOS_SUBSCRIBE_COPY.body}</Text>
          <Button title="Subscribe" className="mt-4" onPress={() => router.push("/upgrade")} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Create Challenge" fallbackHref="/challenges" />
      <View className="gap-3 p-4">
        <TextInput className="rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink" placeholder="Title" value={title} onChangeText={setTitle} />
        <TextInput className="rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink" placeholder="Description" value={description} onChangeText={setDescription} multiline />
        <Text className="text-sm text-ink-muted">Goal type</Text>
        {CHALLENGE_GOAL_TYPES.map((type) => (
          <Button
            key={type}
            title={type.replaceAll("_", " ")}
            variant={goalType === type ? "primary" : "ghost"}
            onPress={() => {
              if (isChallengeGoalType(type)) setGoalType(type);
            }}
          />
        ))}
        <TextInput className="rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink" placeholder="Goal amount" keyboardType="number-pad" value={goalAmount} onChangeText={setGoalAmount} />
        <Text className="text-sm text-ink-muted">Visibility</Text>
        {CHALLENGE_VISIBILITIES.map((value) => (
          <Button
            key={value}
            title={challengeVisibilityLabel(value)}
            variant={visibility === value ? "primary" : "ghost"}
            onPress={() => {
              if (isChallengeVisibility(value)) setVisibility(value);
            }}
          />
        ))}
        {error ? <Text className="text-sm text-puce-red">{error}</Text> : null}
        <Button
          title="Create Challenge"
          loading={saving}
          onPress={() => {
            void (async () => {
              setSaving(true);
              const result = await createChallenge({
                title,
                description,
                goalType,
                goalAmount: Number(goalAmount) || 1,
                startsAt: null,
                endsAt: null,
                visibility,
              });
              setSaving(false);
              if (result.error) {
                setError(result.error);
                return;
              }
              if (result.id) router.replace(`/challenges/${result.id}?origin=challenges`);
            })();
          }}
        />
      </View>
    </View>
  );
}
