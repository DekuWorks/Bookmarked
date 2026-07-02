"use client";

import { cn } from "@/lib/utils/cn";

type Props = {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  animate?: boolean;
};

export function ProgressBar({ value, max = 100, label, className, animate = true }: Props) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : value));

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <p className="mb-1 text-xs text-text-muted">{label}</p>
      ) : null}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-royal-orange to-orange-yellow",
            animate && "transition-all duration-500 ease-out"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
