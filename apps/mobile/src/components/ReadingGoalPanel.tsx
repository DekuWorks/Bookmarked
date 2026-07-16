import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "./Button";
import { Input } from "./Input";
import { ProgressBar } from "./ProgressBar";
import { updateProfile } from "../services/profile";
import type { ReadingGoalStatus } from "../services/readingGoal";
import { useAuthStore } from "../store/authStore";

type Props = {
  status: ReadingGoalStatus;
};

function withTarget(status: ReadingGoalStatus, target: number | null): ReadingGoalStatus {
  if (target == null || target <= 0) {
    return {
      ...status,
      target: null,
      percent: null,
      remaining: null,
      met: false,
    };
  }
  const percent = Math.min(100, Math.round((status.completed / target) * 1000) / 10);
  const remaining = Math.max(0, target - status.completed);
  return {
    ...status,
    target,
    percent,
    remaining,
    met: status.completed >= target,
  };
}

export function ReadingGoalPanel({ status }: Props) {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState(status);
  const [editing, setEditing] = useState(!status.target);
  const [goalInput, setGoalInput] = useState(status.target ? String(status.target) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalStatus(status);
    if (!editing) {
      setGoalInput(status.target ? String(status.target) : "");
    }
  }, [status, editing]);

  const hasGoal = localStatus.target != null && localStatus.target > 0;

  async function persist(goal: number | null) {
    if (!userId) {
      setError("You must be signed in.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateProfile(userId, { yearly_reading_goal: goal });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setLocalStatus(withTarget(localStatus, goal));
    setEditing(goal == null);
    if (goal == null) setGoalInput("");
    await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  }

  async function saveGoal() {
    const goal = Number(goalInput);
    if (!Number.isFinite(goal) || goal < 1 || goal > 500) {
      setError("Enter a whole number between 1 and 500.");
      return;
    }
    const rounded = Math.round(goal);
    if (Math.abs(goal - rounded) > 1e-9) {
      setError("Enter a whole number between 1 and 500.");
      return;
    }
    await persist(rounded);
  }

  if (hasGoal && !editing) {
    return (
      <View className="gap-2">
        <Text className="text-ink">
          {localStatus.completed} of {localStatus.target} books in {localStatus.year}
        </Text>
        <ProgressBar percent={localStatus.percent ?? 0} />
        <Text className="text-xs text-ink-muted">
          {localStatus.met
            ? "Goal met — congratulations!"
            : `${localStatus.remaining} to go this year`}
        </Text>
        <View className="mt-1 flex-row gap-4">
          <Pressable
            onPress={() => {
              setGoalInput(String(localStatus.target));
              setError(null);
              setEditing(true);
            }}
            accessibilityRole="button"
          >
            <Text className="text-sm font-semibold text-primary-dark">Edit goal</Text>
          </Pressable>
          <Pressable
            onPress={() => void persist(null)}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text className="text-sm font-medium text-ink-muted">
              {saving ? "Clearing…" : "Clear goal"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <Text className="text-ink">
        {hasGoal
          ? `Update your ${localStatus.year} reading goal.`
          : `${localStatus.completed} book${localStatus.completed === 1 ? "" : "s"} read in ${localStatus.year}. Set a yearly goal to track progress.`}
      </Text>
      <Input
        label="Books to read this year"
        value={goalInput}
        onChangeText={(text) => {
          setGoalInput(text.replace(/[^\d]/g, ""));
          setError(null);
        }}
        keyboardType="number-pad"
        placeholder="e.g. 24"
        error={error ?? undefined}
        maxLength={3}
      />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button title="Save goal" onPress={() => void saveGoal()} loading={saving} />
        </View>
        {hasGoal ? (
          <View className="flex-1">
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => {
                setEditing(false);
                setError(null);
                setGoalInput(String(localStatus.target));
              }}
              disabled={saving}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
