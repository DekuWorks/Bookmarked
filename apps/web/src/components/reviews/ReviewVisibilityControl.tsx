"use client";

import {
  REVIEW_VISIBILITY_OPTIONS,
  type ReviewAudience,
} from "@bookmarked/utils/reviewVisibility";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: ReviewAudience;
  onChange: (value: ReviewAudience) => void;
  disabled?: boolean;
  name?: string;
};

export function ReviewVisibilityControl({
  value,
  onChange,
  disabled = false,
  name = "visibility",
}: Props) {
  const helper =
    REVIEW_VISIBILITY_OPTIONS.find((option) => option.value === value)?.helper ??
    REVIEW_VISIBILITY_OPTIONS[0].helper;

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium text-text">Visibility</legend>
      <input type="hidden" name={name} value={value} />
      <div
        className="flex rounded-lg border border-border bg-background p-1"
        role="radiogroup"
        aria-label="Review visibility"
      >
        {REVIEW_VISIBILITY_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-[40px] flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
                selected
                  ? "bg-puce-red text-white shadow-sm"
                  : "text-text-muted hover:bg-surface hover:text-text"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-text-muted">{helper}</p>
    </fieldset>
  );
}
