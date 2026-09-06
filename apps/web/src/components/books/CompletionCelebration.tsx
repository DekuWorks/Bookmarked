"use client";

import { Z_CLASS } from "@/lib/constants/zIndex";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  bookTitle: string;
  onClose: () => void;
};

const SPARKLES = ["✦", "✧", "✦", "✧", "✦", "✧", "✦"];

/** Full-screen acknowledgement shown immediately after a successful completion. */
export function CompletionCelebration({ open, bookTitle, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Book completed"
      className={cn(
        "completion-celebration-overlay fixed inset-0 flex items-center justify-center p-6 text-center backdrop-blur-sm",
        Z_CLASS.sheet
      )}
      onClick={onClose}
    >
      <div className="max-w-md space-y-5">
        <div className="flex justify-center gap-5 text-4xl" aria-hidden>
          {SPARKLES.map((sparkle, index) => (
            <span
              key={index}
              className={cn("completion-celebration-sparkle", index % 2 ? "translate-y-3" : "")}
            >
              {sparkle}
            </span>
          ))}
        </div>
        <p className="completion-celebration-kicker text-sm font-semibold uppercase tracking-[0.2em]">
          Book complete
        </p>
        <h2 className="text-3xl font-bold">{bookTitle}</h2>
        <p className="opacity-85">Another story saved to your reading life.</p>
        <button
          type="button"
          className="completion-celebration-button rounded-full px-5 py-2.5 font-semibold"
          onClick={onClose}
        >
          Celebrate
        </button>
      </div>
    </div>
  );
}
