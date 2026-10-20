"use client";

import { goalBarFillPercent } from "@bookmarked/utils/readingRoomMotion";

type Props = {
  value: number;
  label?: string;
};

/**
 * The fill width changes only when `value` changes.
 * CSS transitions the bar after the first paint. Reduced motion is handled in CSS.
 */
export function MotionProgressBar({ value, label }: Props) {
  const fill = goalBarFillPercent(value) / 100;

  return (
    <div className="w-full">
      {label ? <p className="mb-1 text-xs text-text-muted">{label}</p> : null}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="rr-progress-fill"
          data-animate="true"
          style={{ "--rr-fill": fill } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
