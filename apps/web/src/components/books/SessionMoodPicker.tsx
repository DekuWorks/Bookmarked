"use client";

import { REVIEW_FEELINGS, type ReviewFeeling } from "@/lib/constants/reviewFeelings";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: string | null;
  onChange: (mood: ReviewFeeling | null) => void;
  disabled?: boolean;
  className?: string;
};

export function SessionMoodPicker({ value, onChange, disabled, className }: Props) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-text-muted">Mood</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {REVIEW_FEELINGS.map((feeling) => {
          const active = value === feeling;
          return (
            <button
              key={feeling}
              type="button"
              disabled={disabled}
              onClick={() => onChange(active ? null : feeling)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition",
                active
                  ? "border-puce-red bg-puce-red text-white"
                  : "border-border bg-background text-text-muted hover:border-primary disabled:opacity-50"
              )}
            >
              {feeling}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SessionMoodChip({ mood }: { mood: string }) {
  return (
    <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-puce-red">
      {mood}
    </span>
  );
}
