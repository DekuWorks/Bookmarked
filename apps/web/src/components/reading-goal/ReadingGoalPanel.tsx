"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import {
  updateYearlyReadingGoal,
  type ProfileActionState,
} from "@/lib/actions/profile";
import type { ReadingGoalStatus } from "@/lib/services/readingGoal";
import { cn } from "@/lib/utils/cn";

const initial: ProfileActionState = {};

type Props = {
  status: ReadingGoalStatus;
  variant?: "default" | "compact";
  className?: string;
};

export function ReadingGoalPanel({
  status,
  variant = "default",
  className,
}: Props) {
  const toast = useToast();
  const [editing, setEditing] = useState(!status.target);
  const [goalInput, setGoalInput] = useState(
    status.target ? String(status.target) : ""
  );
  const [action, submit, pending] = useActionState(updateYearlyReadingGoal, initial);
  const [clearAction, submitClear, clearing] = useActionState(
    updateYearlyReadingGoal,
    initial
  );

  useEffect(() => {
    if (action.error) toast.error(action.error);
    if (action.success) {
      toast.success(action.success);
      setEditing(false);
    }
  }, [action, toast]);

  useEffect(() => {
    if (clearAction.error) toast.error(clearAction.error);
    if (clearAction.success) {
      toast.success(clearAction.success);
      setGoalInput("");
      setEditing(true);
    }
  }, [clearAction, toast]);

  const hasGoal = status.target != null && status.target > 0;
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
              {status.completed} of {status.target} books in {status.year}
            </p>
            {status.met ? (
              <span className="rounded-full bg-primary/25 px-2.5 py-0.5 text-xs font-semibold text-puce-red">
                Goal reached!
              </span>
            ) : (
              <p className="text-sm text-text-muted">
                {status.remaining} to go
              </p>
            )}
          </div>
          <ProgressBar
            value={status.completed}
            max={status.target ?? 100}
            label={`${status.percent}% of your ${status.year} goal`}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setGoalInput(String(status.target));
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
              ? `Update your ${status.year} reading goal.`
              : `Set how many books you want to finish in ${status.year}.`}
          </p>
          {!hasGoal && !compact ? (
            <p className="text-sm text-text">
              You&apos;ve read <strong>{status.completed}</strong> book
              {status.completed === 1 ? "" : "s"} so far this year.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="Books to read this year"
              name="goal"
              type="number"
              min={1}
              max={500}
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
