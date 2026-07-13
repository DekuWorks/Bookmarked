"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
};

function starFill(value: number, star: number): "full" | "half" | "empty" {
  if (value >= star) return "full";
  if (value >= star - 0.5) return "half";
  return "empty";
}

export function StarRating({ value, onChange, disabled = false, size = "md" }: Props) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const display = hoverValue ?? value;
  const textSize = size === "sm" ? "text-xl" : "text-2xl";
  const hitSize = size === "sm" ? "min-h-[36px] min-w-[18px]" : "min-h-[44px] min-w-[22px]";

  function pick(star: number, half: boolean) {
    if (disabled) return;
    const next = half ? star - 0.5 : star;
    onChange(next === value ? 0 : next);
  }

  return (
    <div
      className="flex gap-0.5"
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = starFill(display, star);
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star || value === star - 0.5}
            aria-label={`${star - 0.5} to ${star} stars`}
            disabled={disabled}
            className={cn(
              "relative inline-flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange rounded-lg",
              hitSize,
              disabled && "cursor-not-allowed opacity-60"
            )}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const half = e.clientX - rect.left < rect.width / 2;
              setHoverValue(half ? star - 0.5 : star);
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const half = e.clientX - rect.left < rect.width / 2;
              pick(star, half);
            }}
          >
            <span className={cn(textSize, "text-border select-none")} aria-hidden>
              ☆
            </span>
            <span
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center justify-center text-royal-orange select-none",
                textSize,
                fill === "half" && "[clip-path:inset(0_50%_0_0)]"
              )}
              aria-hidden
            >
              {fill === "empty" ? null : "★"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
