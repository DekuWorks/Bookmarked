"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useActionToast } from "@/lib/hooks/useActionToast";
import {
  updateYearlyReadingGoal,
  type ProfileActionState,
} from "@/lib/actions/profile";
import type { ReadingGoalStatus } from "@/lib/services/readingGoal";
import { cn } from "@/lib/utils/cn";

const initial: ProfileActionState = {};

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

type Props = {
  status: ReadingGoalStatus;
  variant?: "default" | "compact";
  className?: string;
  /** Called after a successful save/clear so parents can reload profile data. */
  onSaved?: () => void;
};

export function ReadingGoalPanel({
  status,
  variant = "default",
  className,
  onSaved,
}: Props) {
  const [localStatus, setLocalStatus] = useState(status);
  const [editing, setEditing] = useState(!status.target);
  const [goalInput, setGoalInput] = useState(
    status.target ? String(status.target) : ""
  );
  const [action, submit, pending] = useActionState(updateYearlyReadingGoal, initial);
  const [clearAction, submitClear, clearing] = useActionState(
    updateYearlyReadingGoal,
    initial
  );
  const actionGoalRef = useRef(action.goal);

  useEffect(() => {
    actionGoalRef.current = action.goal;
  }, [action.goal]);

  useEffect(() => {
    setLocalStatus(status);
    if (!editing) {
      setGoalInput(status.target ? String(status.target) : "");
    }
  }, [status, editing]);

  useActionToast(action, () => {
    if (actionGoalRef.current != null) {
      setLocalStatus((prev) => withTarget(prev, actionGoalRef.current!));
    }
    setEditing(false);
    onSaved?.();
  });

  useActionToast(clearAction, () => {
    setLocalStatus((prev) => withTarget(prev, null));
    setGoalInput("");
    setEditing(true);
    onSaved?.();
  });

  const hasGoal = localStatus.target != null && localStatus.target > 0;
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        compact ? "space-y-3" : "rounded-lg bg-orange-yellow/15 px-4 py-5",
        className
      )}
    >
      {hasGoal && !editing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={cn("font-medium text-puce-red", compact && "text-sm")}>
              {localStatus.completed} of {localStatus.target} books in{" "}
              {localStatus.year}
            </p>
            {localStatus.met ? (
              <span className="rounded-full bg-primary/25 px-2.5 py-0.5 text-xs font-semibold text-puce-red">
                Goal reached!
              </span>
            ) : (
              <p className="text-sm text-text-muted">
                {localStatus.remaining} to go
              </p>
            )}
          </div>
          <ProgressBar
            value={localStatus.completed}
            max={localStatus.target ?? 100}
            label={`${localStatus.percent}% of your ${localStatus.year} goal`}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setGoalInput(String(localStatus.target));
                setEditing(true);
              }}
            >
              Edit goal
            </Button>
            <form action={submitClear}>
              <input type="hidden" name="action" value="clear" />
              <Button type="submit" variant="ghost" size="sm" loading={clearing}>
                Clear goal
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <form action={submit} className="space-y-3">
          <input type="hidden" name="action" value="set" />
          <p className={cn("text-text-muted", compact ? "text-sm" : "text-sm")}>
            {hasGoal
              ? `Update your ${localStatus.year} reading goal.`
              : `Set how many books you want to finish in ${localStatus.year}.`}
          </p>
          {!hasGoal && !compact ? (
            <p className="text-sm text-text">
              You&apos;ve read <strong>{localStatus.completed}</strong> book
              {localStatus.completed === 1 ? "" : "s"} so far this year.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="Books to read this year"
              name="goal"
              type="number"
              min={1}
              max={500}
              step={1}
              placeholder="e.g. 24"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="sm:max-w-[12rem]"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" size="sm" loading={pending}>
                Save goal
              </Button>
              {hasGoal ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
